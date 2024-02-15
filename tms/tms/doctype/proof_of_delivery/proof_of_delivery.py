# Copyright (c) 2024, Jarupak and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class ProofOfDelivery(Document):
	def validate(self):
		frappe.set_value("Delivery Order", self.delivery_order, "delivered", 1)
	def after_delete(self):
		frappe.set_value("Delivery Order", self.delivery_order, "delivered", 0)
