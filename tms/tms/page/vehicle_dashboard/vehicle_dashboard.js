frappe.pages['vehicle-dashboard'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Vehicle Dashboards',
		single_column: true
	});

	wrapper = $(wrapper).find('.layout-main-section');
	wrapper.append(`
			<div id="chart">asd</div>
		`);
		
		const data = {
			datasets: [
			  {
				name: "Some Data",
				values: [],
			  },
			],
		  };
		  
		  // Realtime Chart initialization
		//   let chart = new frappe.ui.RealtimeChart("#chart", "test_event", 8, {
		// 	title: "My Realtime Chart",
		// 	data: data,
		// 	type: "line",
		// 	height: 250,
		// 	colors: ["#7cd6fd", "#743ee2"]
		//   });
}