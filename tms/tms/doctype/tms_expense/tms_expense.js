async function getDoc(type, name){
    try{
        const task = await frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: type,
            name: name,
        },
        callback(r) {
            if(r.message) {
                var task = r.message;
                return task.message || null
            }
        }
    })
    }catch(e){
        return null
    }
}

function setCreatePurchaseInvoiceButton(frm){
    if(frm.doc.docstatus != 1){
        return false
    }
    frm.add_custom_button(__("Purchase Invoice"), async () => {
        // const user_setting = await getDoc('TMS User Setting', `${frm.doc.owner} - ${frm.doc.abbr}`)
        // const company = await getDoc('Company', `${frm.doc.company}`)
        frappe.new_doc('Purchase Invoice', {
            "supplier": frm.doc.supplier,
            "tms_reference_type": "TMS Expense",
            "ref_tms_expense": frm.doc.name
        })
        },__("Create"))
}

function calculateChild(frm, cdt, cdn){
    let total = 0
    frm.doc.items.map(item => {
        const amount = item.qty * item.rate
        total += amount
        item.amount = amount
    })
    frm.doc.payment_total = total
    frm.refresh()
    return total
}

frappe.ui.form.on('TMS Expense', {
	refresh(frm) {
    console.log(frm)
		setCreatePurchaseInvoiceButton(frm)
	}
})

frappe.ui.form.on('TMS Expense Item Table', {
	refresh(frm) {
		// your code here
		console.log(frm)
	},
	rate(frm, cdt, cdn){
	   calculateChild(frm, cdt, cdn)
	},
	qty(frm, cdt, cdn){
	   calculateChild(frm, cdt, cdn)
	},
	amount(frm, cdt, cdn){
	    calculateChild(frm, cdt, cdn)
	},
	items_remove(frm, cdt, cdn){
	    calculateChild(frm, cdt, cdn)
	}
})