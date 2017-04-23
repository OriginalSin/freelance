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

fetch('sia.json').then(function(response) {
		return response.json();
	}).then(function(json) {
		var featureCollection = utils.getFeatureCollection(json);
		var markers = L.markerClusterGroup({
			showCoverageOnHover: false,
			disableClusteringAtZoom: 16
		});

		var geoJsonLayer = L.geoJson(featureCollection, {
			onEachFeature: function (feature, layer) {
				var props = feature.properties;
				var html = '<strong>' + props.Name + '</strong>\
					<br>' + props.Address + '\
					<br>' + props['Phone Number'] + '\
					<a href="' + props.Website + '">WEBSITE</a>';
				layer.bindPopup(html);
			}
		});
		markers.addLayer(geoJsonLayer);

		map.addLayer(markers);
		map.fitBounds(markers.getBounds());
		map.on('moveend', function(ev) {
			var count = 0,
				bbox = map.getBounds();
			geoJsonLayer.getLayers().forEach(function(it) {
				var flag = bbox.contains(it.getLatLng()),
					node = it.feature.dom;
				if (flag) {
					count++;
					L.DomUtil.removeClass(node, 'gmx-hidden');
				} else {
					L.DomUtil.addClass(node, 'gmx-hidden');
				}
			});
			viewItemsCount.innerHTML = count;
		});
	});
var utils = {
	getFeatureCollection: function(json) {
		var columns = json.columns;
		return geoJsonData = {
			"type": "FeatureCollection", 
			"features": json.rows.map(function(arr, i) {
				var nm = i + 1,
					props = arr.reduce(function(p, c, ind) {
						p[columns[ind]] = c;
						return p;
					}, {});
				var node = L.DomUtil.create('div', 'point-detail vcard');
				node.innerHTML = '<div class="icon"><div class="name fn org overflow-controlled" title="' + props.Name + '"><a href="' + props.Website + '" target="none">' + props.Name + '</a></div><div class="caption">' + props.Description + '</div></div><div class="metadata"><strong><div class="address adr overflow-controlled" title="' + props.Address + '">' + props.Address + '</div><div class="phone tel overflow-controlled">(202) 543-9300</div><div class="url overflow-controlled"><a href="' + props.Website + '" target="_blank">Website</a></div></strong></div>';
				viewItems.appendChild(node);
				return {
						"type": "Feature", "id": nm,
						"dom": node,
						"properties": props,
						"geometry": { "type": "Point", "coordinates": [arr[1], arr[0] ] }
				}
			})
		};
	}
};
