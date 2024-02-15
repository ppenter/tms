# Copyright (c) 2023, Jarupak and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

@frappe.whitelist()
def set_latitute_longitude(recipient, latitude, longitude):
	recipient = frappe.get_doc("TMS Recipient", recipient)
	recipient.latitude = latitude
	recipient.longitude = longitude
	recipient.save()
	return recipient
	

class TMSRecipient(Document):
	def on_update(self):
		old_doc = self.get_doc_before_save()
		# check if latitude or longitude has changed
		if old_doc and (old_doc.latitude != self.latitude or old_doc.longitude != self.longitude):
			# update the location
			self.last_update_location_by = frappe.session.user
			self.last_update_location_date = frappe.utils.now()

