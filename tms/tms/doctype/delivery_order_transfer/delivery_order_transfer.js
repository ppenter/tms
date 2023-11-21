function setCreatePurchaseInvoiceButton(frm) {
    if (frm.doc.docstatus != 1) {
        return false
    }
    frm.add_custom_button(__("Purchase Invoice"), async () => {
        frappe.new_doc('Purchase Invoice', {
            'supplier': cur_frm.doc.transporter,
            tms_reference_type: 'Delivery Order Transfer',
            ref_delivery_order_transfer: cur_frm.doc.name,
            company: cur_frm.doc.company
        })
    }, __("Create"))
}

function setAddOrderButton(frm) {
    if (frm.is_new()) {
        return
    }
    frm.add_custom_button(__("Delivery Order"), async () => {
        if (frm.doc.driver != null && frm.doc.vehicle != null && frm.doc.target_warehouse != null && frm.doc.departure_date_time != null) {} else {
            frappe.msgprint(__('Please filled mandotary fields'));
            return false
        }
        let items = []
        await frappe.call({
            method: 'frappe.client.get_list',
            args: {
                'doctype': 'Delivery Order',
                'filters': {
                    'docstatus': 1,
                    'current_warehouse': frm.doc.source_warehouse,
                    'transfer_status': ['=', 'Open'],
                    'tr_no': ['!=', frm.doc.name]
                },
                'fieldname': ['name'],
                'limit_page_length': 3000
            },
            callback: function(r) {
                if (!r.exc) {
                    console.log(r)
                    r.message?.map(d => {
                        items.push(d.name)
                    })
                }
            }
        });
        // await frappe.db.get_list('Delivery Order Transfer Item', { 
        // fields: ['name', 'delivery_order', 'docstatus'], 
        // parent_doctype:"Delivery Order Transfer" 
        // }).then(e => { 
        // 
        // items = e.map(trip_item => trip_item.delivery_order) 
        // console.log(e) 
        // }) 
        if (frm.doc.items) {
            frm.doc.items.forEach(i => {
                items = items.filter(it => it != i.delivery_order)
            })
        }
        new frappe.ui.form.MultiSelectDialog({
            doctype: "Delivery Order",
            target: cur_frm,
            setters: {
                "posting_date": null,
                "recipient_county": null,
                "recipient_province": null,
                "delivery_type": 'Express',
            },
            add_filters_group: 1,
            date_field: "posting_date",
            page_length: 3000,
            get_query() {
                return {
                    filters: {
                        docstatus: 1,
                        // name: ['in', items],
                        company: frm.doc.company,
                        current_warehouse: frm.doc.source_warehouse,
                        transfer_status: ['=', 'Open'],
                        tr_no: ['!=', frm.doc.name]
                    },
                    limit_page_length: 3000
                }
            },
            action: (selections, args) => {
                const delivery_notes = frappe.db.get_list('Delivery Order', {
                    filters: {
                        name: ['in', selections]
                    },
                    limit: 3000,
                    page_length: 3000,
                    fields: ['name', 'sender_id', 'posting_date', "source_warehouse", "recipient", "recipient_id", "recipient_county", "recipient_province", "grand_total", "grand_total_qty", "grand_total_weight", "grand_total_volume", "cash_on", "sender", "hand_bill_no", "recipient_in_line_address", 'money_received_amount']
                }).then(e => {
                    e.map(note => {
                        frm.add_child('items', {
                            delivery_order: note.name,
                            posting_date: note.posting_date,
                            source_warehouse: note.source_warehouse,
                            sender: note.sender_id,
                            recipient: note.recipient_id,
                            recipient_in_line_address: note.recipient_in_line_address,
                            hand_bill_no: note.hand_bill_no,
                            recipient_county: note.recipient_county,
                            recipient_province: note.recipient_province,
                            grand_total: note.grand_total,
                            grand_total_qty: note.grand_total_qty,
                            grand_total_weight: note.grand_total_weight,
                            grand_total_volume: note.grand_total_volume,
                            cash_on: note.cash_on,
                        })
                    })
                    frm.refresh()
                    if (frm.doc.docstatus == 1) {
                        frm.save('Update')
                    } else {
                        frm.save()
                    }
                    $('.modal').modal('hide');
                })
            }
        })
    }, __("Add"))
}

function setViewOrderButton(frm) {
    frm.add_custom_button(__("View Delivery Order List"), async () => {
        let items = []
        // await frappe.db.get_list('Delivery Order Transfer Item',{ 
        // fields: ['name', 'delivery_order', 'docstatus'] 
        // }).then(e => { 
        // items = e.map(trip_item => trip_item.delivery_order) 
        // console.log(e) 
        // }) 
        frappe.set_route("List", "Delivery Order", {
            "tr_no": frm.doc.name
        });
    }, __("Views"))
    frm.add_custom_button(__("View Delivery Order Report"), async () => {
        let items = []
        // await frappe.db.get_list('Delivery Order Transfer Item',{ 
        // fields: ['name', 'delivery_order', 'docstatus'] 
        // }).then(e => { 
        // items = e.map(trip_item => trip_item.delivery_order) 
        // console.log(e) 
        // }) 
        frappe.set_route("Report", "Delivery Order", {
            "tr_no": frm.doc.name
        });
    }, __("Views"))
}

function setStatusButton(frm) {
    if (frm.doc.transfer_status == 'Completed') {
        return
    }
    if (frm.doc.transfer_status != 'Loaded') {
        frm.add_custom_button(__("Loaded"), async () => {
            frm.doc.transfer_status = 'Loaded'
            frm.refresh()
            if (frm.doc.docstatus == 1) {
                frm.save('Update')
            } else {
                frm.save()
            }
        }, __("Update"))
    }
    if (frm.doc.transfer_status != 'In Transit') {
        frm.add_custom_button(__("In Transit"), async () => {
            frm.doc.transfer_status = 'In Transit'
            frm.refresh()
            if (frm.doc.docstatus == 1) {
                frm.save('Update')
            } else {
                frm.save()
            }
        }, __("Update"))
    }
    if (frm.doc.transfer_status != 'Arrived') {
        frm.add_custom_button(__("Arrived"), async () => {
            frm.doc.transfer_status = 'Arrived'
            frm.refresh()
            if (frm.doc.docstatus == 1) {
                frm.save('Update')
            } else {
                frm.save()
            }
        }, __("Update"))
    }
    if (frm.doc.transfer_status != 'Completed') {
        frm.add_custom_button(__("Completed"), async () => {
            frm.doc.transfer_status = 'Completed'
            frm.refresh()
            if (frm.doc.docstatus == 1) {
                frm.save('Update')
            } else {
                frm.save()
            }
        }, __("Update"))
    }
}
frappe.ui.form.on('Delivery Order Transfer', {
    onload(frm) {
        frm.get_field("items").grid.cannot_add_rows = true;
    },
    source_warehouse(frm) {
        // frm.doc.target_warehouse = null 
        frm.set_value("target_warehouse", null)
        frm.set_query("target_warehouse", function() {
            return {
                "filters": {
                    "is_group": 0,
                    'name': ['!=', frm.doc.source_warehouse]
                }
            };
        });
        frm.refresh()
    },
    refresh(frm) {
        // if (frm.is_new()) { 
        // return 
        // } 
        frm.set_query("source_warehouse", function() {
            return {
                "filters": {
                    "is_group": 0,
                }
            };
        });
        frm.set_query("target_warehouse", function() {
            return {
                "filters": {
                    "is_group": 0,
                    'name': ['!=', frm.doc.source_warehouse]
                }
            };
        });
        if (frm.doc.docstatus == 0) {
            setAddOrderButton(frm)
        }
        if (frm.doc.docstatus == 1) {
            setAddOrderButton(frm)
            // setViewOrderButton(frm) 
            setStatusButton(frm)
            setCreatePurchaseInvoiceButton(frm)
        }
    },
    after_save(frm){
        frm.refresh()
    }
})
frappe.ui.form.on('Delivery Order Transfer Item', {
    items_add(frm) {
        // frm.save()
    },
})