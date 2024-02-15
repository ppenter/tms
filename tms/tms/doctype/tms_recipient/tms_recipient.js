// Copyright (c) 2023, Jarupak and contributors
// For license information, please see license.txt

frappe.ui.form.on('TMS Recipient', {
	refresh: function(frm) {
		$(frm.fields_dict.map.wrapper).html(`<a href="https://www.google.com/maps/place/${frm.doc.latitude},${frm.doc.longitude}" target="_blank">Google Map</a>`)
	}
});
