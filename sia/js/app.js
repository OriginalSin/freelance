var map = L.map('map').setView([20, -17.59], 2);
L.Icon.Default.imagePath = './';
var iconUrl = L.Icon.Default.imagePath + 'sia.jpg';
L.Marker = L.Marker.extend({
	options: {
		icon: new L.Icon.Default({
			iconUrl: iconUrl,
			iconSize: [50, 50],
			iconAnchor: [7, 37],
			popupAnchor: [3, -25],
			shadowUrl: iconUrl,
			shadowSize: [0, 0],
			shadowAnchor: [0, 0]
		})
	}
});

var osm = L.tileLayer('https://tilessputnik.ru/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
}).addTo(map);
var viewItems = document.getElementsByClassName('viewItems')[0],
	viewItemsCount = document.getElementsByClassName('viewItemsCount')[0];
  // export from csv http://www.csvjson.com/csv2json
fetch('data/sia6.json').then(function(response) {
		return response.json();
	}).then(function(json) {
		var featureCollection = utils.getFeatureCollection(json);
		var markers = L.markerClusterGroup({
			showCoverageOnHover: false,
			disableClusteringAtZoom: 16
		});

		var geoJsonLayer = utils.geoJsonLayer = L.geoJson(featureCollection, {
			onEachFeature: function (feature, layer) {
				var props = feature.properties,
					img = props.Image ? '<img src="' + props.Image + '" />' : '',
					html = img +
						'<br><strong>' + props.Name + '</strong>\
						<br>' + props.Address + '\
						<br>' + props['Phone Number'] + '\
						<a href="' + props.Website + '">WEBSITE</a>';
				layer.bindPopup(html);
			}
		});
		markers.addLayer(geoJsonLayer);

		map.addLayer(markers);
		map.fitBounds(markers.getBounds());
		map.on('moveend', utils.setFilter);
	});

var utils = {
	buttons: ['zipcode', 'sButton', 'searchBARS', 'searchALL', 'searchSTORE'],
	getButtonType: function(button) {
		for (var i = 0, len = utils.buttons.length; i < len; i++) {
			var type = utils.buttons[i];
			if ( L.DomUtil.hasClass(button, type)) {
				return type;
			}
		}
		return null;
	},
	setCurrentType: function(type) {
		for (var i = 2, len = utils.buttons.length; i < len; i++) {
			var name = utils.buttons[i];
				fname = type === name ? 'addClass' : 'removeClass';
			L.DomUtil[fname](document.getElementsByClassName(name)[0], 'current');
		}
	},
	setFilter: function(ev) {
		var button = ev ? ev.target : null,
			type = button && button.className ? utils.getButtonType(button) : 'searchALL',
			count = 0,
			flayers = utils.geoJsonLayer.getLayers(),
			bbox = map.getBounds();

		if (type === 'sButton') {
			var val = document.getElementsByClassName('zipcode')[0].value,
				fname = val.match(/[^\d]/) ? 'Address' : 'Zipcode';
			for (var i = 0, len = flayers.length; i < len; i++) {
				var it = flayers[i],
					pv = String(it.feature.properties[fname]);
				if (pv.indexOf(val) !== -1) {
					map.setView(it.getLatLng(), 17);
					it.openPopup();
					return;
				}
			}
		} else if (type.indexOf('search') !== -1) {
			utils.setCurrentType(type);
			flayers.forEach(function(it) {
				var feature = it.feature,
					props = feature.properties,
					node = feature.dom,
					flag = bbox.contains(it.getLatLng());

				if (type === 'searchBARS') {
					if (props.Category !== 'DRINK') { flag = false; }
				} else if (type === 'searchSTORE') {
					if (props.Category !== 'STORE') { flag = false; }
				}
				if (flag) {
					count++;
					L.DomUtil.removeClass(node, 'gmx-hidden');
				} else {
					L.DomUtil.addClass(node, 'gmx-hidden');
				}
			});
			viewItemsCount.innerHTML = count;
		}
		// console.log(type)
	},
	getFeatureCollection: function(json) {
		// var columns = json.columns;
		return {
			"type": "FeatureCollection", 
			"features": json.map(function(it, i) {
				var node = L.DomUtil.create('div', 'point-detail vcard');
				node.innerHTML = '<div class="icon"><div class="name fn org overflow-controlled" title="' + it.Name + '"><a href="' + it.Website + '" target="none">' + it.Name + '</a></div><div class="caption">' + it.Description + '</div></div><div class="metadata"><strong><div class="address adr overflow-controlled" title="' + it.Address + '">' + it.Address + '</div><div class="phone tel overflow-controlled">(202) 543-9300</div><div class="url overflow-controlled"><a href="' + it.Website + '" target="_blank">Website</a></div></strong></div>';
				viewItems.appendChild(node);
				return {
						"type": "Feature", "id": i + 1,
						"dom": node,
						"properties": it,
						"geometry": { "type": "Point", "coordinates": [it.Lng, it.Lat ] }
				}
			})
		};
	}
};

utils.buttons.forEach(function(type) {
	L.DomEvent.on(document.getElementsByClassName(type)[0], 'click', utils.setFilter);
});
