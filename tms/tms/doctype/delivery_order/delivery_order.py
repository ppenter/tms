# Copyright (c) 2023, Jarupak and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

def update_link_doc(doc):
	# Money Send Record
	mn_sends = frappe.db.get_all('Money Send Record Item',
								filters={'delivery_order': doc.name,
									'parenttype': 'Money Send Record'},
								fields=['name'])

	for record_name in mn_sends:
		frappe.db.set_value('Money Send Record Item', record_name,
							{'recipient_name': doc.recipient})

	# Delivery Order Transfer

	do_transfers = frappe.db.get_all('Delivery Order Transfer Item',
									filters={'delivery_order': doc.name,
									'parenttype': 'Delivery Order Transfer'},
									fields=['name', 'posting_date','source_warehouse','sender','recipient','recipient_in_line_address','hand_bill_no','recipient_county','recipient_province','grand_total','grand_total_qty','grand_total_weight','grand_total_volume','cash_on']
									)
	if len(do_transfers) > 0:
		for record in do_transfers:
			frappe.db.set_value('Delivery Order Transfer Item', record.name, {
				'posting_date': doc.posting_date,
				'source_warehouse': doc.source_warehouse,
				'sender': doc.sender_id,
				'recipient': doc.recipient_id,
				'recipient_in_line_address': doc.recipient_in_line_address,
				'hand_bill_no': doc.hand_bill_no,
				'recipient_county': doc.recipient_county,
				'recipient_province': doc.recipient_province,
				'grand_total': doc.grand_total,
				'grand_total_qty': doc.grand_total_qty,
				'grand_total_weight': doc.grand_total_weight,
				'grand_total_volume': doc.grand_total_volume,
				'cash_on': doc.cash_on,
				})

	# Delivery Order Trip

	do_trips = frappe.db.get_all('Delivery Order Trip Item',
								filters={
									'delivery_order': doc.name,
									'parenttype': 'Delivery Order Trip'
								},
								fields=['name', 'posting_date','source_warehouse','sender','recipient','recipient_in_line_address','hand_bill_no','recipient_county','recipient_province','grand_total','grand_total_qty','grand_total_weight','grand_total_volume','cash_on']
								)

	if len(do_trips) > 0:
		for record in do_trips:
			frappe.db.set_value('Delivery Order Trip Item', record.name, {
				'posting_date': doc.posting_date,
				'source_warehouse': doc.source_warehouse,
				'sender': doc.sender_id,
				'recipient': doc.recipient_id,
				'recipient_in_line_address': doc.recipient_in_line_address,
				'hand_bill_no': doc.hand_bill_no,
				'recipient_county': doc.recipient_county,
				'recipient_province': doc.recipient_province,
				'grand_total': doc.grand_total,
				'grand_total_qty': doc.grand_total_qty,
				'grand_total_weight': doc.grand_total_weight,
				'grand_total_volume': doc.grand_total_volume,
				'cash_on': doc.cash_on,
			})

def check_has_price_and_update(doc):

	for child in doc.items:
		filter_options = {
					"sender_id": doc.sender_id,
					"recipient_id": doc.recipient_id,
					"cash_on": doc.cash_on,
					"item": child.get('item_code'),
					"uom": child.get('uom'),
		}
		if float(child.get('rate')) != 0 and doc.save_rate == 1:
			# list = frappe.db.get_all('TMS Price List', pluck='name', filters=filter_options)
			exist = frappe.db.exists("TMS Price List", {
					"sender_id": doc.sender_id,
					"recipient_id": doc.recipient_id,
					"cash_on": doc.cash_on,
					"item": child.get('item_code'),
					"uom": child.get('uom')
			})
			# frappe.throw(exist)
			if(exist):
				frappe.db.set_value('TMS Price List', exist, 'rate', child.get('rate'))
			else:
				new_doc = frappe.get_doc({
					'doctype': 'TMS Price List',
					'sender_id': doc.sender_id,
					'recipient_id': doc.recipient_id,
					'cash_on': doc.cash_on,
					'item': child.get('item_code'),
					'uom': child.get('uom'),
					'rate': child.get('rate')
				})
				new_doc.insert()

def calculate_total(doc):
	grand_total = 0
	grand_qty = 0
	for item in doc.items:
		grand_total = grand_total + item.amount
		grand_qty = grand_qty + item.qty

	doc.grand_total = grand_total + doc.county_extended_price
	doc.grand_total_qty = grand_qty
				

class DeliveryOrder(Document):

	def before_submit(self):
		# frappe.msgprint(("before_submit"))
		self.transfer_target_warehouse = None
		self.status = 'Submitted'

		self.current_warehouse = self.source_warehouse
		self.transfer_status = 'Open'
		frappe.enqueue(check_has_price_and_update, queue='long', doc=self)

	def before_update_after_submit(self):
		# frappe.msgprint(("before_update_after_submit"))

		if len(self.items) > 5:
			frappe.throw(("Delivery Order Cannot Be More Than 5"))
			
		if self.money_received_amount == self.grand_total - self.commission and self.grand_total != 0:
			self.sending_money_status = 'Close'
		else:
			self.sending_money_status = 'Open'
		
		frappe.enqueue(update_link_doc, queue='long', doc=self)
		frappe.enqueue(check_has_price_and_update, queue='long', doc=self)
	
	def on_cancel(self):
		# frappe.msgprint(("on_cancel"))
		self.status = 'Cancelled'

	def on_change(self):
		calculate_total(self)