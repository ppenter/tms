# Copyright (c) 2023, Jarupak and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class DeliveryOrderTransfer(Document):
	
	def validate(self):
		# frappe.throw(("Delivery Order Cannot Be More Than 5"))
		for i, item in enumerate(sorted(self.items, key=lambda item: item.delivery_order), start=1):
			item.idx = i
    	# for i, item in enumerate(sorted(self._range, key=lambda item: item.grade), start=1):
        # 	item.idx = i