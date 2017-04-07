/* globals $, _, window, document Materialize, Clusterize */
/* eslint-disable no-var, object-shorthand, prefer-arrow-callback, block-scoped-var */

var download = function (name, text) {
	var pom = document.createElement('a');
	pom.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
	pom.setAttribute('download', name);
	pom.setAttribute('target', '_blank');

	if (document.createEvent) {
		var event = document.createEvent('MouseEvents');
		event.initEvent('click', true, true);
		pom.dispatchEvent(event);
	} else {
		pom.click();
	}
};

var delay = (function () {
	var timer = 0;
	return function (callback, ms) {
		clearTimeout(timer);
		timer = setTimeout(callback, ms);
	};
})();

/* We're using these functions in index.html */
/* eslint-disable no-unused-vars, camelcase */
var checkIn = function (id) {
	var checkedIn = $('#' + id).is(':checked');
	$.ajax({
		url: '/user/' + id + '/in',
		type: 'POST',
		dataType: 'json',
		contentType: 'application/json',
		data: JSON.stringify({checked_in: checkedIn}),
		success: function () {
			$("#checked_in_control").trigger("click", {id: id, checked: checkedIn});
		}
	});
};
/* eslint-enable camelcase */

var getUrlParameter = function (sParam) {
	var sPageURL = decodeURIComponent(window.location.search.substring(1));
	var sURLVariables = sPageURL.split('&');
	var sParameterName;

	for (var i = 0; i < sURLVariables.length; i++) {
		sParameterName = sURLVariables[i].split('=');

		if (sParameterName[0] === sParam) {
			return sParameterName[1] === undefined ? true : sParameterName[1];
		}
	}
};
/* eslint-disable no-unused-vars */

var MyMlhDash = function (app, secret) {
	this.data = {};
	this.ids = {};
	this.schools = {};
	this.sizes = {};
	this.majors = {};
	this.clusterize = null;
	this.schoolCluster = null;
	this.sizeCluster = null;
	this.majorCluster = null;

	this.APP_ID = app;
	this.SECRET = secret;
};

MyMlhDash.prototype.sortRefresh = function (key) {
	this.data = this.sortBy(this.data, key);
	var md = this.getTags(this.data);

	this.clusterize.update(md);
};

MyMlhDash.prototype.sortBy = function (data, key) {
	return _.sortBy(data, key);
};

MyMlhDash.prototype.getCountTags = function (data) {
	var md = [];
	var keys = Object.keys(data);
	var unordered = [];
	var i;

	for (i = 0; i < keys.length; i++) {
		unordered.push({name: keys[i], val: data[keys[i]]});
	}
	data = _.sortBy(unordered, function (item) {
		return -item.val;
	});

	for (i = 0; i < unordered.length; i++) {
		var el = '<tr><td>' + data[i].name +
				'</td><td>' + data[i].val +
				'</td></tr>';
		md.push(el);
	}

	return md;
};

MyMlhDash.prototype.setCheckedIn = function(id, checkedIn) {
	var index = this.ids[id];
	if (index === null) {
		return;
	}
	if (!this.data[index]){
		return;
	}
	this.data[index]["checked_in"] = checkedIn;
}

MyMlhDash.prototype.getTags = function (data) {
	var md = [];
	this.showHeaders(data);

	/* eslint-disable camelcase */
	for (var i = 0; i < data.length; i++) {
		var cur = data[i];
		if (!cur.school_name) {
			cur.school_name = cur.school.name;
		}
		delete cur.school;

		this.countMajors(cur.major);
		this.countShirtSize(cur.shirt_size);
		this.countSchool(cur.school_name);

		md.push(this.getEl(cur));
	}
	/* eslint-enable camelcase */

	return md;
};

MyMlhDash.prototype.countSchool = function (school) {
	if (!school) {
		return;
	}

	if (!this.schools[school]) {
		this.schools[school] = 0;
	}
	this.schools[school]++;
};

MyMlhDash.prototype.countShirtSize = function (shirtSize) {
	if (!shirtSize) {
		return;
	}

	var size = shirtSize.replace(/\s/g, '');
	if (!this.sizes[size]) {
		this.sizes[size] = 0;
	}
	this.sizes[size]++;
};

MyMlhDash.prototype.countMajors = function (majors) {
	if (!majors) {
		return;
	}

	var list = majors.split(',');
	for (var j = 0; j < list.length; j++) {
		var major = list[j];
		if (!this.majors[major]) {
			this.majors[major] = 0;
		}
		this.majors[major]++;
	}
};

MyMlhDash.prototype.showHeaders = function (data) {
	var keys = [];
	if (data.length > 0) {
		keys = Object.keys(data[0]);
	}

	for (var i = 0; i < keys.length; i++) {
		if (keys[i]) {
			$('#' + keys[i]).show();
		}
	}
};

MyMlhDash.prototype.getEl = function (user) {
	var el = '<tr>';
	if (user.updated_at){
		var signUpDate = new Date(user.updated_at);
		var deadline = new Date("2017-04-07T15:59:59.9999Z");
		if (signUpDate.getTime() > deadline.getTime()){
			el = '<tr style=\"border-color:red;border-width:1px;border-style:solid\">';
		}
	}
	if (typeof user.checked_in === 'boolean') {
		var checkedIn = '<td><input onClick=\'checkIn(\"'+user.mlh_id+'\")\' type=\'checkbox\'  id=\'' + user.mlh_id + '\'';

		if (user.checked_in) {
			checkedIn += 'checked';
		}
		checkedIn += '/><label style=\'height:15px;margin-left:0px;padding-left:0px\' for=\'' + user.mlh_id + '\'></label>';

		el += checkedIn;
	}
	el = this.addTDProperty(el, user.email);
	el = this.addTDProperty(el, user.first_name);
	el = this.addTDProperty(el, user.last_name);
	el = this.addTDProperty(el, user.major);
	el = this.addTDProperty(el, user.shirt_size);
	el = this.addTDProperty(el, user.dietary_restrictions);
	el = this.addTDProperty(el, user.school_name);
	el = this.addTDProperty(el, user.phone_number);
	if (user.github) {
		var uname = user.github.split('/').pop();
		el += '<td><a href="https://github.com/' + uname + '" target="_blank">' + uname + '</a></td>';
	} else {
		el += '<td></td>';
	}

	if (user.resume) {
		el += '<td><a href="' + user.resume + '" target="_blank">Resume</a></td>';
	} else {
		el += '<td></td>';
	}
	el += '</tr>';
	return el;
};

MyMlhDash.prototype.addTDProperty = function (el, value) {
	if (value) {
		el += '<td>' + value + '</td>';
	}
	return el;
};

MyMlhDash.prototype.getMyMLHData = function (token) {
	var self = this;
	var url = '/user?token=' + token;

	$('.progress').show();
	$('.input-field').hide();
	$.get(url, function (body) {
		self.data = body.data;
		if (!self.data) {
			Materialize.toast('No data Available, try reloading!', 5000);
			return;
		}
		self.data = self.sortBy(self.data, 'checked_in').reverse();

		var md = self.getTags(self.data);
		$('.progress').hide();
		$('.input-field').show();

		self.clusterize = new Clusterize({
			rows: md,
			scrollId: 'scrollArea',
			contentId: 'contentArea'
		});

		self.schoolCluster = new Clusterize({
			rows: self.getCountTags(self.schools),
			scrollId: 'schoolScroll',
			contentId: 'schoolContent'
		});

		self.sizeCluster = new Clusterize({
			rows: self.getCountTags(self.sizes),
			scrollId: 'shirtsScroll',
			contentId: 'shirtsContent'
		});

		self.majorCluster = new Clusterize({
			rows: self.getCountTags(self.majors),
			scrollId: 'majorScroll',
			contentId: 'majorContent'
		});

		var rows = self.clusterize.getRowsAmount();
		$('#stats').text(rows);
		var totalSchools = self.schoolCluster.getRowsAmount();
		$('#totalschools').text(totalSchools);
		var totalMajors = self.majorCluster.getRowsAmount();
		$('#totalmajors').text(totalMajors);

		self.initRegistrantsChart();
	});
};

MyMlhDash.prototype.initRegistrantsChart = function () {
	var categories = {};
	var i;
	for (i = 0; i < this.data.length; i++) {
		this.ids[this.data[i].mlh_id] = i;
		var updatedDate = new Date(this.data[i].updated_at);
		var datestring = updatedDate.getFullYear()*10000 +
						(updatedDate.getMonth()+1)*100 +
						updatedDate.getDate();
		if (!categories[datestring]) {
			categories[datestring] = {};
			categories[datestring].val = 0;
			categories[datestring].name = String(updatedDate.getFullYear()) + '-' +
										String(updatedDate.getMonth()+1) + '-' +
										String(updatedDate.getDate());
		}

		categories[datestring].val++;
	}

	var names = [];
	var vals = [];
	var keys = Object.keys(categories).sort(function(a, b){
		return a - b;
	})
	for (i = 0; i < keys.length; i++) {
		var key = keys[i];

		names.push(categories[key].name);
		vals.push(categories[key].val);
	}

	$('#chart-container').highcharts({
		chart: {type: 'line'},
		title: {text: 'Registrants over time'},
		xAxis: {categories: names},
		yAxis: {plotLines: [{
			value: 0,
			width: 1,
			color: '#808080'
		}]},
		tooltip: {valueSuffix: 'users'},
		legend: {
			layout: 'vertical',
			align: 'right',
			verticalAlign: 'middle',
			borderWidth: 0
		},
		series: [{
			name: 'Registrants',
			data: vals
		}]
	});
};

MyMlhDash.prototype.searchData = function (column, term) {
	var matched = [];

	for (var i = 0; i < this.data.length; i++) {
		if (column == "checked_in") {
			if (term && this.data[i][column]){
				matched.push(this.data[i]);
			} else if (!term) {
				matched.push(this.data[i]);
			}
			continue;
		}
		if ((column !== 'id' && this.data[i][column] && this.data[i][column].search(new RegExp(term.toLowerCase(), 'i')) === 0) ||
			(column === 'id' && this.data[i][column] === parseInt(term, 10))) {
			matched.push(this.data[i]);
		}
	}

	var md = this.getTags(matched);
	$('#stats').text(matched.length);
	this.matched = matched;
	this.clusterize.update(md);
};

MyMlhDash.prototype.downloadData = function (columns) {
	var text = '';
	var data = this.data;
	if (data.length < 0) {
		return;
	}
	if (this.matched) {
		data = this.matched;
	}

	text += columns.join(',') + '\n';
	for (var i = 0; i < data.length; i++) {
		var obj = data[i];
		for (var j = 0; j < columns.length; j++) {
			text += obj[columns[j]] + ',';
		}
		text += '\n';
	}

	var filename = new Date(Date.now()).toLocaleString();
	filename = 'mymlh-' + filename;
	download(filename, text);
};

MyMlhDash.prototype.destroyData = function () {
	this.clusterize.destroy(true);
	this.majorCluster.destroy(true);
	this.schoolCluster.destroy(true);
	this.sizeCluster.destroy(true);
	this.majors = {};
	this.schools = {};
	this.sizes = {};
	this.data = {};

	$('#stats').text('');
	$('#totalschools').text('');
	$('#totalmajors').text('');
};
