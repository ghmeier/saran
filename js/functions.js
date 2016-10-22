/* globals $, _, window, document Materialize, Clusterize */
/* eslint-disable no-var, object-shorthand, prefer-arrow-callback */

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
		success: function () {}
	});
};
/* eslint-enable camelcase */

var delay = (function () {
	var timer = 0;
	return function (callback, ms) {
		clearTimeout(timer);
		timer = setTimeout(callback, ms);
	};
})();

var getUrlParameter = function (sParam) {
	var sPageURL = decodeURIComponent(window.location.search.substring(1));
	var sURLVariables = sPageURL.split('&');
	var sParameterName;
	var i = 0;

	for (i = 0; i < sURLVariables.length; i++) {
		sParameterName = sURLVariables[i].split('=');

		if (sParameterName[0] === sParam) {
			return sParameterName[1] === undefined ? true : sParameterName[1];
		}
	}
};
/* eslint-disable no-unused-vars */

var MyMlhDash = function (app, secret) {
	this.data = {};
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
	var i = 0;
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

MyMlhDash.prototype.getTags = function (data) {
	var md = [];
	var keys = Object.keys(data[0]);
	var i = 0;

	for (i = 0; i < keys.length; i++) {
		if (keys[i]) {
			$('#' + keys[i]).show();
		}
	}
	/* eslint-disable camelcase */
	for (i = 0; i < data.length; i++) {
		var cur = data[i];
		cur.school_name = cur.school.name;

		if (cur.major) {
			var major_list = cur.major.split(',');
			for (var j = 0; j < major_list.length; j++) {
				var cur_major = major_list[j];
				if (!this.majors[cur_major]) {
					this.majors[cur_major] = 0;
				}
				this.majors[cur_major]++;
			}
		}

		if (cur.shirt_size) {
			var cur_size = cur.shirt_size.replace(/\s/g, '');
			if (!this.sizes[cur_size]) {
				this.sizes[cur_size] = 0;
			}
			this.sizes[cur_size]++;
		}

		if (cur.school_name) {
			var cur_school = cur.school_name;
			if (!this.schools[cur_school]) {
				this.schools[cur_school] = 0;
			}
			this.schools[cur_school]++;
		}
		md.push(this.getEl(cur));
	}
	/* eslint-enable camelcase */

	return md;
};

MyMlhDash.prototype.getEl = function (user) {
	var el = '';
	if (typeof user.checked_in === 'boolean') {
		var checkedIn = '<td><input onclick=\'checkIn("' + user.mlh_id + '")\' type=\'checkbox\'  id=\'' + user.mlh_id + '\'';
		if (user.checked_in) {
			checkedIn += 'checked';
		}
		checkedIn += '/><label style=\'height:15px;margin-left:0px;padding-left:0px\' for=\'' + user.mlh_id + '\'></label>';
		el += checkedIn;
	}
	el = this.addTDProperty(user.email);
	el = this.addTDProperty(user.first_name);
	el = this.addTDProperty(user.last_name);
	el = this.addTDProperty(user.major);
	el = this.addTDProperty(user.shirt_size);
	el = this.addTDProperty(user.dietary_restrictions);
	el = this.addTDProperty(user.school_name);
	el = this.addTDProperty(user.school_name);
	el = this.addTDProperty(user.phone_number);
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
	var i = 0;
	for (i = 0; i < this.data.length; i++) {
		var updatedDate = new Date(this.data[i].updated_at);
		var datestring = String(updatedDate.getFullYear()) +
						String(updatedDate.getMonth()) +
						String(updatedDate.getDate());
		if (!categories[datestring]) {
			categories[datestring] = {};
			categories[datestring].val = 0;
			categories[datestring].name = String(updatedDate.getFullYear()) + '-' +
										String(updatedDate.getMonth()) + '-' +
										String(updatedDate.getDate());
		}

		categories[datestring].val++;
	}

	var names = [];
	var vals = [];

	for (i = 0; i < Object.keys(categories).length; i++) {
		var key = Object.keys(categories)[i];

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
		if (column !== 'id' && this.data[i][column].search(new RegExp(term.toLowerCase(), 'i')) === 0) {
			matched.push(this.data[i]);
		} else if (column === 'id' && this.data[i][column] === parseInt(term, 10)) {
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
