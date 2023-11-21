async function delay(msecs) {
    return new Promise((resolve) => setTimeout(resolve, msecs));
  }

function setCreatePurchaseInvoiceButton(frm){
    if(frm.doc.docstatus != 1){
        return false
    }
    frm.add_custom_button(__("Purchase Invoice"), async () => {
        // const user_setting = await getDoc('TMS User Setting', `${frm.doc.owner} - ${frm.doc.abbr}`)
        // const company = await getDoc('Company', `${frm.doc.company}`)
        frappe.new_doc('Purchase Invoice', {
            'supplier': frm.doc.transporter,
            tms_reference_type: 'Delivery Order Trip',
            ref_tms_expense: frm.doc.name
        })
        },__("Create"))
}

function setAddOrderButton(frm){
    if (frm.is_new()) {
        return
    }
    frm.add_custom_button(__("Delivery Order"), async () => {
        if (frm.doc.driver != null && frm.doc.vehicle != null && frm.doc.source_warehouse != null && frm.doc.departure_date_time != null) {

        } else {
            frappe.msgprint(__('Please filled mandotary fields'));
            return false
        }
            let items = []
//         await frappe.call({
//     method: 'frappe.client.get_list',
//     args: {
//         'doctype': 'Delivery Order',
//         'filters': {
//             'docstatus': 1,
//             'current_warehouse': frm.doc.source_warehouse,
//             'dr_no': ['=', '']
//         },
//         'fieldname': [
//             'name'
//         ],
// 		'limit_page_length': 3000
//     },
//     callback: function(r) {
//         if (!r.exc) {
//             console.log(r)
//             r.message?.map( d => {
//                 items.push(d.name)
//             })
            
//         }
//     }
// });

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
                    "current_warehouse": null,
                    "recipient_county": null,
                    "recipient_province": null,
                    "delivery_type": 'Express',
                },
                add_filters_group: 1,
                date_field: "posting_date",
				page_length: 3000,
                // allow_child_item_selection: 1,
                // child_fieldname: "items", // child table fieldname, whose records will be shown &amp; can be filtered
                // child_columns: ["item_code", "qty", "uom", "rate", "amount"],
                get_query() {
                    return {
                        filters: {
                            docstatus: ['=', 1],
                            // name: ['in', items],
                            company: ['=', frm.doc.company],
                            current_warehouse: ['=', frm.doc.source_warehouse],
                            dr_no: ['!=', frm.doc.name]
                            
                        },
						limit_page_length: 3000
                    }
                },
                action: (selections, args) => {
                    const delivery_notes = frappe.db.get_list('Delivery Order',{
                        filters: {
                            name: ['in', selections]
                        },
                        limit: 3000,
                        page_length: 3000,
                        fields: ['name', 'posting_date','sender_id', "source_warehouse", "recipient", "recipient_id", "recipient_county", "recipient_province", "grand_total", "grand_total_qty", "grand_total_weight", "grand_total_volume", "cash_on", "sender", "hand_bill_no", "recipient_in_line_address"]
                    }).then(
                        e => {
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
                     if(frm.docstatus == 1){
                         frm.save('Update')
                     }else{
                        frm.save()
                     }
                    
                    $('.modal').modal('hide');
                    })
                   
                }
            })
            
        },__("Add"))
}

function setViewOrderButton(frm){
    frm.add_custom_button(__("Delivery Order"), async () => {
            let items = []
            await frappe.db.get_list('Delivery Order Trip Item',{
                        fields: ['name', 'delivery_order', 'docstatus'], 
                        parent_doctype:"Delivery Order Trip"
                    }).then(e => {
                        items = e.map(trip_item => trip_item.delivery_order)
                        console.log(e)
                    })
                    frappe.set_route("List", "Delivery Order", {"dr_no": frm.doc.name});
            
        },__("View"))
}



frappe.ui.form.on('Delivery Order Trip', {
    onload(frm) {
        frm.get_field("items").grid.cannot_add_rows = true;
    },
    refresh(frm){
        frm.set_query("source_warehouse", function() {
        return {
            "filters": {
                "is_group": 0,
            }
        };
    });
        if(frm.doc.docstatus == 0){
            setAddOrderButton(frm)
        }
        if(frm.doc.docstatus == 1){
            setAddOrderButton(frm)
            setCreatePurchaseInvoiceButton(frm)
            setViewOrderButton(frm)
        }
    },
    async scanner(frm){
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Delivery Order",
                name: frm.doc.scanner,
            },
            callback(r) {
                if(r.message) {
                    var note = r.message;
                    const con = frm.doc?.items?.filter(e => e.delivery_order === note.name) || []
                    if(con?.length > 0) return
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
                    frm.doc.scanner = null
                    frm.refresh()
                                //  if(frm.docstatus == 1){
                                //      frm.save('Update')
                                //  }else{
                                //     frm.save()
                                //  }
                }
            }
        });
    },
    scan(frm){
        new frappe.ui.Scanner({
            dialog: true, // open camera scanner in a dialog
            multiple: true, // stop after scanning one value
            on_scan(data) {
                frappe.call({
                    method: "frappe.client.get",
                    args: {
                        doctype: "Delivery Order",
                        name: data?.decodedText,
                    },
                    callback(r) {
                        if(r.message) {
                            var note = r.message;
                            const con = frm.doc?.items?.filter(e => e.delivery_order === note.name) || []
                            if(con?.length > 0) return
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
                            frm.doc.scanner = null
                            frm.refresh()
                                        //  if(frm.docstatus == 1){
                                        //      frm.save('Update')
                                        //  }else{
                                        //     frm.save()
                                        //  }
                        }
                    }
                });
            }
          });
    }
})

frappe.ui.form.on('Delivery Order Trip Item', {
    items_add(frm) {
        // frm.save()
    },
    items_remove(frm) {
        // if(frm.doc.docstatus == 1){
        //                     frm.save('Update')
        //                 }else{
        //                     frm.save()
        //                 }
    },
    direction(frm,cdt,cdn){
        console.log(frm.doc.items, frm,cdt,cdn)
        let item = locals[cdt][cdn];
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "TMS Recipient",
                name: item.recipient,
            },
            callback(r) {
                if(r.message) {
                    var recipient = r.message;
                    let json = JSON.parse(recipient?.geo) || null
                    let coordinates = json?.features?.[0]?.geometry?.coordinates
                    const lat = coordinates[0]
                    const long = coordinates[1]
                    if(lat && long){
                        const url = `https://maps.google.com?q=${long},${lat}`
                        window.open(url, "_blank");
                    }else{
                        frappe.throw('No Geolocation')
                    }
                }
            }
        });
    }
})