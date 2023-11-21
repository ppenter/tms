function calculateTotal(frm) {
    let total = 0 
	frm.doc.items.map(item => {
        total += item.received_amount
    }) 
	frm.doc.total_received_amount = total 
	frm.doc.payment_total = total 
	frm.refresh()
}
async function getDoc(type, name) {
    try {
        const task = await frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: type,
                name: name,
                limit_page_length: 3000
            },
            callback(r) {
                if (r.message) {
                    return r.message
                }
            }
        });
        return task.message
    } catch (e) {
        return null
    }
}

function setAddOrderButton(frm) {
    frm.add_custom_button(__("Delivery Order"), () => {
        frm.refresh() 
		// let items = []
        // if (frm.doc.items) {
        //     frm.doc.items.forEach(i => {
        //         items.push(i.delivery_order)
        //     })
        // }
        new frappe.ui.form.MultiSelectDialog({
            doctype: "Delivery Order",
            target: cur_frm,
            setters: {
                "posting_date": null,
                "source_warehouse": null,
                "recipient_county": null,
                "recipient_province": null,
                "delivery_type": null,
                "cash_on": null,
            },
            add_filters_group: 1,
            date_field: "posting_date",
            page_length: 3000,
            get_query() {
                return {
                    filters: {
                        docstatus: ['=', 1],
                        // name: ['not in', items],
                        company: ['=', cur_frm.doc.company],
                        sending_money_status: ['=', 'Open'],
                    },
                }
            },
            action: (selections, args) => {
                const delivery_notes = frappe.db.get_list('Delivery Order', {
                    filters: {
                        name: ['in', selections]
                    },
                    limit: 3000,
                    page_length: 3000,
                    fields: ['name', 'posting_date', "source_warehouse", "recipient", "recipient_county", "recipient_province", "grand_total", "cash_on", "sender", "hand_bill_no", "recipient_in_line_address", 'money_received_amount', 'commission']
                }).then(e => {
                    e.map(note => {
                        const remaining = note.grand_total - note.money_received_amount - note.commission 
						frm.add_child('items', {
                            delivery_order: note.name,
                            recipient_name: note.recipient,
                            grand_total: note.grand_total,
                            remaining_amount: remaining,
                            received_amount: remaining
                        })
                    })
                    // frm.save() 
                    calculateTotal(frm) 
					$('.modal').modal('hide');
                })
            }
        })
    }, __("Add"))
}

function setBankTansactionButton(frm) {
    if (frm.doc.docstatus != 1) {
        return false
    }
    frm.add_custom_button(__("Sales Invoice"), async () => {
        const payment_options = {
            payment_type: 'Receive',
            party_type: 'Employee',
            party: frm.doc.employee,
            mode_of_payment: 'Cash',
            party_name: frm.doc.employee_name,
            paid_amount: frm.doc.outstanding_amount,
            received_amount: 0,
            company: frm.doc.company,
            reference_doctype: 'Money Send Record',
            reference_docname: frm.doc.name
        }
        // console.log(frm) 
        frappe.new_doc('Sales Invoice', {
            'customer': cur_frm.doc?.customer || null,
            tms_reference_type: 'Money Send Record',
            money_send_record: cur_frm.doc.name,
            company: cur_frm.doc.company
        })
    }, __("Create"))
}
frappe.ui.form.on('Money Send Record', {
    onload(frm) {
        frm.get_field("items").grid.cannot_add_rows = true;
    },
    refresh(frm) {
        if (frm.doc.docstatus == 1) {
            setBankTansactionButton(frm)
            // setViewOrderButton(frm) 
        }
        if (frm.doc.docstatus == 0) {
            setAddOrderButton(frm)
            // setViewOrderButton(frm) 
        }
    },
}) 
frappe.ui.form.on('Money Send Record Item', {
    received_amount(frm) {
        calculateTotal(frm)
    },
    items_add(frm) {
        calculateTotal(frm)
    },
    items_remove(frm) {
        calculateTotal(frm)
    }
})