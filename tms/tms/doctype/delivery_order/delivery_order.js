function setCreateSalesInvoiceButton(frm) {
    if (frm.doc.docstatus != 1) {
        return false
    }
    // frm.add_custom_button(__("Sales Invoice"), async () => {
    //     frappe.new_doc('Sales Invoice', {
    //         'customer': frm.doc.customer,
    //         tms_reference_type: 'Delivery Order',
    //         delivery_order: frm.doc.name
    //     })
    // },__("Create"))
}

function calculate_amount(frm) {
    const amountArr = frm.doc.items.map((item, index) => {
        const sum = item.rate * item.qty
        frm.doc.items[index].amount = sum
        return sum
    }) 
    const sum = amountArr.reduce((accumulator, object) => {
        return accumulator + object;
    }, 0);
    frm.doc.grand_total = sum + frm.doc.county_extended_price;
    frm.refresh()
}

function getRate(frm, cdt, cdn, uom) {
    let item = locals['Delivery Order Item'][cdn]
    console.log('Get Rate')
    if (!item.item_code || !frm.doc.sender_id || !frm.doc.recipient_id) {
        return false
    }
    if (!frm.doc.sender_id || !frm.doc.recipient_id || !frm.doc.cash_on) {
        item.rate = 0 
        calculate_all(frm)
        frm.refresh()
        return
    }
    let filter_options = {
        sender_id: frm.doc.sender_id || 'this is a random message',
        recipient_id: frm.doc.recipient_id || 'this is a random message',
        cash_on: frm.doc.cash_on,
        item: item.item_code || 'this is a random message',
        // uom: uom ? item.uom : null 
    }
    if (uom) {
        filter_options = {
            ...filter_options,
            uom: item.uom
        }
    }
    frappe.db.get_list('TMS Price List', {
        filters: filter_options,
        page_length: 1,
        fields: ['rate', 'name', 'sender_id', 'recipient_id', 'cash_on', 'item', 'uom']
    }).then(list => {
        if (list[0]?.rate) {
            console.log(filter_options, list[0]) 
            item.rate = list[0]?.rate || 0 
            item.uom = uom ? item.uom : list[0]?.uom
            // item.uom = list[0]?.uom 
            calculate_all(frm)
            frm.refresh()
            // frappe.show_alert('Get Rate !') 
        } else {
            // frappe.show_alert('No Rate Founded')
        }
    })
}

function calculate_qty(frm) {
    const sum = frm.doc.items.reduce((accumulator, object) => {
        return accumulator + object.qty;
    }, 0);
    frm.doc.grand_total_qty = sum
    frm.refresh()
    // console.log(amountArr, sum) 
}

function calculate_weight(frm) {
    const amountArr = frm.doc.items.map((item, index) => {
        const sum = item.weight * item.qty
        frm.doc.items[index].total_weight = sum
        return sum
    }) 
    const sum = amountArr.reduce((accumulator, object) => {
        return accumulator + object;
    }, 0);
    frm.doc.grand_total_weight = sum
    frm.refresh()
}

function calculate_volume(frm) {
    const amountArr = frm.doc.items.map((item, index) => {
        const sum = item.volume * item.qty
        frm.doc.items[index].total_volume = sum
        return sum
    }) 
    const sum = amountArr.reduce((accumulator, object) => {
        return accumulator + object;
    }, 0);
    frm.doc.grand_total_volume = sum
    frm.refresh()
}

function calculate_others(frm) {
    const amountArr = frm.doc.items.map((item, index) => {
        const sum = item.volume * item.qty
        frm.doc.items[index].total_volume = sum
        return sum
    }) 
    const sum = amountArr.reduce((accumulator, object) => {
        return accumulator + object;
    }, 0);
    frm.doc.grand_total = sum + frm.doc.county_extended_price
    frm.refresh()
}

function calculate_all(frm) {
    calculate_qty(frm) 
    calculate_amount(frm) 
    calculate_weight(frm) 
    calculate_volume(frm)
}
async function getDoc(type, name) {
    try {
        const task = await frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: type,
                name: name,
            },
            callback(r) {
                if (r.message) {
                    return r.message || null
                }
            }
        }) 
        return task.message
    } catch (e) {
        console.log('error') 
        return null
    }
}
const cal = async (frm) => {
    const byWeightTable = (await getDoc('TMS Price By Weight', frm.doc.recipient_province)).price_table
    const byVolumeTable = (await getDoc('TMS Price By Volume', frm.doc.recipient_province)).price_table
    frm.doc.items.map(item => {
        let weightPrice = 0
        if (item.total_weight > 0) {
            for (let i = 0; i < byWeightTable.length; i++) {
                if (item.total_weight <= byWeightTable[i].weight) {
                    weightPrice = byWeightTable[i].price
                    break
                }
            }
        }
        let volumePrice = 0
        if (item.total_volume > 0) {
            for (let i = 0; i < byVolumeTable.length; i++) {
                if (item.total_volume <= byVolumeTable[i].volume) {
                    volumePrice = byVolumeTable[i].price
                    break
                }
            }
        }
        item.rate = weightPrice > volumePrice ? weightPrice : volumePrice
        console.log(weightPrice, volumePrice)
    })
    frm.refresh()
    calculate_all(frm)
}
frappe.ui.form.on('Delivery Order', {
            naming_series(frm) {
                frm.doc.returned_delivery_order = null
                if (frm.doc.naming_series.includes('RDO')) {
                    frm.doc.save_rate = 0
                    frm.refresh()
                }
            },
            refresh(frm) {
                console.log(frm)
                // setCreateSalesInvoiceButton(frm) 
                frm.set_query("source_warehouse", function() {
                    return {
                        "filters": {
                            "is_group": 0,
                        }
                    };
                });
                if (frm.doc.docstatus == 1) {
                    frm.add_custom_button(__('Status'), function() {
                        let d = new frappe.ui.Dialog({
                            title: 'Change Status',
                            fields: [{
                                label: 'Status',
                                fieldname: 'status',
                                fieldtype: 'Select',
                                options: ['Submitted', 'Completed', 'Failed'],
                                default: frm.doc.status
                            }, ],
                            primary_action_label: 'Change',
                            primary_action(values) {
                                frm.set_value({
                                    status: values.status
                                })
                                // frm.refresh() 
                                // frm.save('Update')
                                d.hide();
                            }
                        });
                        d.show();
                    }, __('Change'));
                }
            },
            cash_on(frm) {
                frm.doc.items.forEach(item => {
                    getRate(frm, 'Delivery Order Item', item.name)
                })
            },
            recipient_id(frm) {
                if (frm.doc.items) {
                    frm.doc.items.forEach(item => {
                        getRate(frm, 'Delivery Order Item', item.name)
                    })
                }
            },
            recipient_county(frm) {
                if (!frm.doc.recipient_county || !frm.doc.recipient_province) {
                    return
                }
                frappe.call({
                    method: 'frappe.client.get_list',
                    args: {
                        'doctype': 'County',
                        'filters': {
                            'title': frm.doc.recipient_county,
                            'province': frm.doc.recipient_province
                        },
                        'fields': ['title', 'province', 'extended_price', 'tms_disabled']
                    },
                    callback: function(r) {
                        if (r.message?.length <= 0) return
                        const county = r.message[0]
                        frm.doc.county_extended_price = county?.extended_price || 0
                        calculate_all(frm)
                        frm.refresh()
                    }
                });
            },
            sender_id(frm) {
                // if (frm.doc.items) { 
                // frm.doc.items.forEach(item => { 
                // getRate(frm, 'Delivery Order Item', item.name) 
                // }) 
                // } 
            },
            calculate_price(frm) {
                cal(frm)
            },
            county_extended_price(frm) {
                calculate_all(frm)
            }
})

            frappe.ui.form.on('Delivery Order Item', {
                // refresh(frm) {},
                rate(frm) {
                    calculate_all(frm)
                },
                weight(frm) {
                    calculate_all(frm)
                },
                qty(frm) {
                    calculate_all(frm)
                },
                volume(frm) {
                    calculate_all(frm)
                },
                item_code(frm, cdt, cdn) {
                    if (frm.doc.docstatus == 0) {
                        getRate(frm, cdt, cdn)
                    }
                    calculate_all(frm)
                },
                item_name(frm) {
                    calculate_all(frm)
                },
                uom(frm, cdt, cdn) {
                    if (frm.doc.docstatus == 0) {
                        getRate(frm, cdt, cdn, true)
                    }
                    calculate_all(frm)
                },
                items_remove(frm) {
                    calculate_all(frm)
                }
            })