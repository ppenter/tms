const t = frappe.listview_settings['Delivery Order']

frappe.listview_settings['Delivery Order'] = {
    ...t,
    onload(listview) {
        listview.page.add_action_item(__('Sending Money'), () => {
            let selected_docs_no_filter = listview.get_checked_items()
            console.log(selected_docs_no_filter)
            let selected_docs = listview.get_checked_items().filter((note) => {
                const rm = parseFloat(note.grand_total) - parseFloat(note.money_received_amount)
                if(note.status != 'Draft' && note.status != 'Cancelled' && note.status != 'Completed'){
                    return true
                }else{
                    return false
                }
            });
            const docnames = listview.get_checked_items(true);
            
            let d_total = 0

            for (let i = 0; i < selected_docs.length; i++) {
                console.log(selected_docs[i] )
                const remaining_mount = parseFloat(selected_docs[i].grand_total) - parseFloat(selected_docs[i].money_received_amount) - parseFloat(selected_docs[i].commission)
                console.log(remaining_mount, 'remaining')
                selected_docs[i].received_amount = remaining_mount
                    selected_docs[i].remaining_amount = remaining_mount
                    d_total += remaining_mount
            }

            const dialog = new frappe.ui.Dialog({
                title: __("Sending Money"),
                fields: [
                    {
                        fieldname: 'date',
                        fieldtype: 'Datetime',
                        in_list_view: 2,
                        label: 'Date',
                        default: 'Now',
                        reqd: true
                    },
                    {
                        label: 'Delivery Order',
                        fieldname: 'delivery_order',
                        fieldtype: 'Table',
                        cannot_add_rows: true,
                        in_place_edit: false,
                        data: selected_docs,
                        fields: [{
                                fieldname: 'name',
                                fieldtype: 'Link',
                                in_list_view: 2,
                                label: 'Delivery Order',
                                read_only: true,
                                options: 'Delivery Order'
                            },
                            {
                                fieldname: 'grand_total',
                                fieldtype: 'Currency',
                                in_list_view: 1,
                                label: 'Grand Total',
                                read_only: true
                            },
                            {
                                fieldname: 'remaining_amount',
                                fieldtype: 'Currency',
                                in_list_view: 1,
                                label: 'Remaining Amount',
                                read_only: true
                            },
                            {
                                fieldname: 'received_amount',
                                fieldtype: 'Currency',
                                in_list_view: 1,
                                label: 'Received Amount',
                        onchange: function(event) {
                                    let child_table = dialog.get_value('delivery_order');
                                    let total = 0
                                    console.log(event, dialog)
                                    for(let i = 0; i < child_table.length; i++){
                                        const item_code = child_table[i].item_code
                                        total += child_table[i].received_amount
                                    }
                                    dialog.set_value('payment_total', total)
                                    //  dialog.fields_dict.payment_total = total
                                    //  dialog.fields_dict.payment_total.grid.refresh()
                                }
                            }
                        ]
                    },
                    {
                        fieldname: 'selected_docs',
                        fieldtype: 'Int',
                        in_list_view: 2,
                        label: 'Selected Docs',
                        default: selected_docs_no_filter.length,
                        read_only: true
                    },
                    {
                        fieldname: 'sending_docs',
                        fieldtype: 'Int',
                        in_list_view: 2,
                        label: 'Sending Docs',
                        default: selected_docs.length,
                        read_only: true
                    },
                    {
                        fieldname: 'payment_total',
                        fieldtype: 'Currency',
                        label: 'Payment Total',
                        default: d_total,
                        read_only: true
                    },
                ],
                primary_action_label: 'Submit',
                primary_action(values) {
                    console.log(values)
                        frappe.call({
                            method: 'create-sending-money',
                            args: {
                                payment_total: values.payment_total,
                                date: values.date,
                                items: JSON.stringify(values.delivery_order.map((note, index) => {
                                    const ob = {
                                        delivery_order: values.delivery_order[index].name,
                                        recipient_name: values.delivery_order[index].recipient,
                                        bill_amount: values.delivery_order[index].grand_total,
                                        remaining_amount: values.delivery_order[index].remaining_amount,
                                        received_amount: values.delivery_order[index].received_amount,
                                    }
                                    console.log(ob)
                                    return ob
                                }))
                            },
                            callback: function(response) {
                                console.log(response.message, 'response');
                                frappe.set_route(['Form', 'Money Send Record', response.message])
                            }
                        })
        show_alert('Send Money !')
        
                    dialog.hide();
                    console.log(listview)
                }
            })

            dialog.show()
        });


        // listview.page.add_action_item(__('Create Delivery Trip (Use this one)'), () => {
        //     let selected_docs_no_filter = listview.get_checked_items()
        //         frappe.new_doc("Delivery Trip", {tracking_state: "Arrived"});
        // });
    },
    get_indicator(doc) {
        if (doc.status == 'Failed') {
            return [__("Failed"), "orange", "status,=,Failed"];
        } else if(doc.status == 'Completed') {
            return [__("Completed"), "green", "status,=,Completed"];
        } else if(doc.status == 'Submitted') {
            return [__("Submitted"), "blue", "status,=,Submitted"];
        } else {
            return [__(doc.status), "red", `status,=,${doc.status}`];
        }
    },
    button:{
        show: function(doc) {
            var canEdit = frappe.user_roles.indexOf('Delivery Price Manager') >= 0
            // var canEdit = true
            if(canEdit){
                return true
            }else{
                return false
            }
        },
        get_label: function() {
            return __('Edit');
        },
        get_description: function(doc) {
            return __('Edit {0}', [doc.name])
        },
        action: function(doc) {
            console.log(doc.name)
            frappe.db.get_list('Delivery Order Item', {
                filters: {
                parent: doc.name,
            },
            parent_doctype: 'Delivery Order',
            order_by: 'creation desc',
            fields: ['parent', 'item_code', 'item_name', 'qty', 'uom', 'rate', 'amount', 'name', 'creation']
            }).then(e => {
            let items = e
        let d = new frappe.ui.Dialog({
            title: 'Edit Delivery Order',
            fields: [
                {
                    label: 'Delivery Order',
                    fieldname: 'delivery_order',
                    fieldtype: 'Link',
                    options: 'Delivery Order',
                    reqd: 1,
                    default: doc.name,
                    read_only: 1
                },
                {
                        label: 'Items',
                        fieldname: 'items',
                        fieldtype: 'Table',
                        data: items,
                        get_data: () => {
                    return items;
                },
                        fields: [
                            {
                                fieldname: 'name',
                                fieldtype: 'Data',
                                in_list_view: 0,
                                label: 'ID',
                                read_only: 1,
                            },
                            {
                                fieldname: 'item_code',
                                fieldtype: 'Link',
                                in_list_view: 1,
                                label: 'Item Code',
                                read_only: 1,
                                options: 'TMS Item',
                                onchange: function(event) {
                                    let child_table = d.get_value('items');
                                    for(let i = 0; i < child_table.length; i++){
                                        const item_code = child_table[i].item_code
                                        child_table[i].amount = child_table[i].qty * child_table[i].rate
                                    }
                                    d.fields_dict.items.grid.refresh()
                                    
                                }
                            },
                            {
                                fieldname: 'item_name',
                                fieldtype: 'Data',
                                in_list_view: 2,
                                label: 'Item Name',
                                read_only: 1,
                                reqd: 1,
                            },
                            {
                                fieldname: 'qty',
                                fieldtype: 'Float',
                                in_list_view: 1,
                                label: 'Qty',
                                default: 1,
                                onchange: function(event) {
                                    let child_table = d.get_value('items');
                                    for(let i = 0; i < child_table.length; i++){
                                        const item_code = child_table[i].item_code
                                        child_table[i].amount = child_table[i].qty * child_table[i].rate
                                    }
                                    d.fields_dict.items.grid.refresh()
                                    
                                }
                            },
                            {
                                fieldname: 'uom',
                                fieldtype: 'Link',
                                in_list_view: 1,
                                label: 'UOM',
                                options: 'UOM',
                                default: 'Unit',
                                onchange: function(event) {
                                    let child_table = d.get_value('items');
                                    for(let i = 0; i < child_table.length; i++){
                                        const item_code = child_table[i].item_code
                                        child_table[i].amount = child_table[i].qty * child_table[i].rate
                                    }
                                    d.fields_dict.items.grid.refresh()
                                    
                                }
                            },
                            {
                                fieldname: 'rate',
                                fieldtype: 'Float',
                                in_list_view: 1,
                                label: 'Rate',
                                onchange: function(event) {
                                    let child_table = d.get_value('items');
                                    for(let i = 0; i < child_table.length; i++){
                                        const item_code = child_table[i].item_code
                                        child_table[i].amount = child_table[i].qty * child_table[i].rate
                                    }
                                    d.fields_dict.items.grid.refresh()
                                    
                                }
                            },
                            {
                                fieldname: 'amount',
                                fieldtype: 'Currency',
                                in_list_view: 1,
                                label: 'Amount',
                                read_only: true,
                                onchange: function(event) {
                                    let child_table = d.get_value('items');
                                    for(let i = 0; i < child_table.length; i++){
                                        const item_code = child_table[i].item_code
                                        child_table[i].amount = child_table[i].qty * child_table[i].rate
                                    }
                                    d.fields_dict.items.grid.refresh()
                                    
                                }
                            },
                        ]
                    }
            ],
            primary_action_label: 'Edit',
            primary_action(values) {
                console.log(values)
                const items = values.items
                frappe.call({
                    method: 'edit-delivery-order-items',
                    args: {
                        ...values,
                        items: items
                    },
                    callback: function(response) {
                        console.log(response.message);
                        // frappe.show_alert(response.message)
                        cur_list.refresh()
                    }
                })

                d.hide();
            }
        });
        d.show()
            })
        }
    }
}