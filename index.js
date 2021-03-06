
mapboxgl.accessToken = 'pk.eyJ1IjoiY2FzaGVsbCIsImEiOiJja2Ryaml2bzQwOWloMnlvN2htdXdra2c3In0.eZwWsYuro0bwKk16bScIbw';
var map = new mapboxgl.Map({
style: 'mapbox://styles/mapbox/light-v10',
center: [-74.0066, 40.7135],
zoom: 3,
pitch: 45,
bearing: -17.6,
container: 'map',
antialias: true
});

map.on('load', function() {
// Add a new source from our GeoJSON data and
// set the 'cluster' option to true. GL-JS will
// add the point_count property to your source data.
map.addSource('dev', {
type: 'geojson',
// Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
// from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
data:
'https://opendata.arcgis.com/datasets/02ac3c6cad154141905b1b7a4d4f90da_0.geojson',
cluster: true,
clusterMaxZoom: 14, // Max zoom to cluster points on
clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
});
 
map.addLayer({
id: 'clusters',
type: 'circle',
source: 'dev',
'layout': {
// make layer visible by default
'visibility': 'visible'
},
filter: ['has', 'point_count'],
paint: {
// Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
// with three steps to implement three types of circles:
//   * Blue, 20px circles when point count is less than 100
//   * Yellow, 30px circles when point count is between 100 and 750
//   * Pink, 40px circles when point count is greater than or equal to 750
'circle-color': [
'step',
['get', 'point_count'],
'#51bbd6',100,'#f1f075',750,
'#f28cb1'],
'circle-radius': [
'step',
['get', 'point_count'],20,100,30,750,40
]
}
});
 
map.addLayer({
id: 'cluster-count',
type: 'symbol',
source: 'dev',
filter: ['has', 'point_count'],
layout: {
'visibility': 'visible',
'text-field': '{point_count_abbreviated}',
'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
'text-size': 12
}
});
 
map.addLayer({
id: 'unclustered-point',
type: 'circle',
source: 'dev',
filter: ['!', ['has', 'point_count']],
'layout': {
// make layer visible by default
'visibility': 'visible'
},
paint: {
'circle-color': '#11b4da',
'circle-radius': 4,
'circle-stroke-width': 1,
'circle-stroke-color': '#fff'
}
});
 
// inspect a cluster on click
map.on('click', 'clusters', function(e) {
var features = map.queryRenderedFeatures(e.point, {
layers: ['clusters']
});
var clusterId = features[0].properties.cluster_id;
map.getSource('dev').getClusterExpansionZoom(
clusterId,
function(err, zoom) {
if (err) return;
 
map.easeTo({
center: features[0].geometry.coordinates,
zoom: zoom
});
}
);
});
 
// When a click event occurs on a feature in
// the unclustered-point layer, open a popup at
// the location of the feature, with
// description HTML from its properties.
map.on('click', 'unclustered-point', function(e) {
var coordinates = e.features[0].geometry.coordinates.slice();
var name = e.features[0].properties.PROJECT_NAME;

 
// Ensure that if the map is zoomed out such that
// multiple copies of the feature are visible, the
// popup appears over the copy being pointed to.
while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
}

new mapboxgl.Popup()
.setLngLat(coordinates)
.setHTML(
'Name: ' + name
)
.addTo(map);
});
 
map.on('mouseenter', 'clusters', function() {
map.getCanvas().style.cursor = 'pointer';
});
map.on('mouseleave', 'clusters', function() {
map.getCanvas().style.cursor = '';
});
});


map.addControl(
new MapboxGeocoder({
accessToken: mapboxgl.accessToken,
mapboxgl: mapboxgl
})
);

map.on('load', function() {
// Add a geojson point source.
// Heatmap layers also work with a vector tile source.
map.addSource('consumption', {
'type': 'geojson',
'data':
'https://opendata.arcgis.com/datasets/0b93a92428fa4491bab79359bbde8d8e_0.geojson'
});
 
map.addLayer(
{
'id': 'land-consumption-rate',
'type': 'heatmap',
'source': 'consumption',
'maxzoom': 9,
'layout': {
// make layer visible by default
'visibility': 'visible'
},
'paint': {
// Increase the heatmap weight based on frequency and property magnitude
'heatmap-weight': [
'interpolate',
['linear'],
['get', 'Change_in_Built_Up_Area_2000_20'],
0,
0,
6,
1
],
// Increase the heatmap color weight weight by zoom level
// heatmap-intensity is a multiplier on top of heatmap-weight
'heatmap-intensity': [
'interpolate',
['linear'],
['zoom'],
0,
1,
9,
3
],
// Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
// Begin color ramp at 0-stop with a 0-transparancy color
// to create a blur-like effect.
'heatmap-color': [
'interpolate',
['linear'],
['heatmap-density'],
0,
'rgba(33,102,172,0)',
0.2,
'rgb(103,169,207)',
0.4,
'rgb(209,229,240)',
0.6,
'rgb(253,219,199)',
0.8,
'rgb(239,138,98)',
1,
'rgb(178,24,43)'
],
// Adjust the heatmap radius by zoom level
'heatmap-radius': [
'interpolate',
['linear'],
['zoom'],
0,
2,
9,
20
],
// Transition from heatmap to circle layer by zoom level
'heatmap-opacity': [
'interpolate',
['linear'],
['zoom'],
7,
1,
9,
0
]
}
},
'waterway-label'
);
 
map.addLayer(
{
'id': 'consumption_point',
'type': 'circle',
'source': 'consumption',
'minzoom': 7,
'layout': {
// make layer visible by default
'visibility': 'visible'
},
'paint': {
// Size circle radius by earthquake magnitude and zoom level
'circle-radius': [
'interpolate',
['linear'],
['zoom'],
7,
['interpolate', ['linear'], ['get', 'mag'], 1, 1, 6, 4],
16,
['interpolate', ['linear'], ['get', 'mag'], 1, 5, 6, 50]
],
// Color circle by earthquake magnitude
'circle-color': [
'interpolate',
['linear'],
['get', 'Change_in_Built_Up_Area_2000_20'],
0,
'rgba(33,102,172,0)',
20,
'rgb(103,169,207)',
40,
'rgb(209,229,240)',
60,
'rgb(253,219,199)',
80,
'rgb(239,138,98)',
10,
'rgb(178,24,43)'
],
'circle-stroke-color': 'white',
'circle-stroke-width': 1,
// Transition from heatmap to circle layer by zoom level
'circle-opacity': [
'interpolate',
['linear'],
['zoom'],
7,
0,
8,
1
]
}
},
'waterway-label'
);
});


map.on('load', function() {
  map.addSource('res', {
type: 'geojson',
// Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
// from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
data:
'https://services5.arcgis.com/mv4wB4q9dMbOaZn3/ArcGIS/rest/services/residential_property_price_indicators/FeatureServer/0/query?where=ObjectID%3E0&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnHiddenFields=false&returnGeometry=true&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=Erew2u_2FbpdC_7xiV0ywrLX_Kl8Q604poXx_wxqWbT6_9NvubD_p65HRiwPk9IzgFjLQ_G5GEWMtQDnVfOKIGhSceZXhDmj1WseprKYLxE4Ek93WPpHF7TKTcKj7eGKiayXjU5PRLompJUBZHf5r0dmDZplwM24_Gehkj6m3CCX-QrTPe4tPaJxpNIHmGlHKX-WCYoQDYxBMCzF-ulpTZTnDxWX4saO4a5BZ_AM-cY.',
});

// map.addLayer({
// 'id': 'res',
// 'type': 'line',
// 'source': 'res',
// 'layout': {
// // make layer visible by default
// 'visibility': 'visible'
// },
// 'paint': {
// 'line-color': '#088'}
// });

map.addLayer({
'id': 'Residential Property Price Indicators',
'type': 'line',
'source': 'res',
'layout': {},
'paint': {
'line-color': '#627BC1',
'line-width': 3
}
});

var toggleableLayerIds = [ 'clusters', 'cluster-count', 'unclustered-point'];

var link = document.createElement('a');
link.href = '#';
link.className = 'active';
link.textContent = "US Public Housing";
link.onclick = function (e) {
    for(var index in toggleableLayerIds) {
      var clickedLayer = toggleableLayerIds[index];
      e.preventDefault();
      e.stopPropagation();

      var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

      if (visibility === 'visible') {
          map.setLayoutProperty(clickedLayer, 'visibility', 'none');
          this.className = '';
      } else {
          this.className = 'active';
          map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
      }
};
};
                var layers = document.getElementById('menu');
layers.appendChild(link);
});

const {MapboxLayer, ScatterplotLayer} = deck;

map.on('load', () => {
      const firstLabelLayerId = map.getStyle().layers.find(layer => layer.type === 'symbol').id;

      map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#aaa',

            // use an 'interpolate' expression to add a smooth transition effect to the
            // buildings as the user zooms in
            'fill-extrusion-height': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "height"]
            ],
            'fill-extrusion-base': [
                "interpolate", ["linear"], ["zoom"],
                15, 0,
                15.05, ["get", "min_height"]
            ],
            'fill-extrusion-opacity': .6
        }
      }, firstLabelLayerId);
    });

var toggleableLayerIds = ['Residential Property Price Indicators', 'Proportion of Population Living in Slums', 'Social Impact Housing'];
 
// set up the corresponding toggle button for each layer
for (var i = 0; i < toggleableLayerIds.length; i++) {
var id = toggleableLayerIds[i];
 
var link = document.createElement('a');
link.href = '#';
link.className = 'active';
link.textContent = id;
 
link.onclick = function(e) {
var clickedLayer = this.textContent;
e.preventDefault();
e.stopPropagation();
 
var visibility = map.getLayoutProperty(clickedLayer, 'visibility');
 
// toggle layer visibility by changing the layout object's visibility property
if (visibility === 'visible') {
map.setLayoutProperty(clickedLayer, 'visibility', 'none');
this.className = '';
} else {
this.className = 'active';
map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
}
};
 
var layers = document.getElementById('menu');
layers.appendChild(link);
}

var toggleableLayerIds = [ 'land-consumption-rate', 'consumption_point'];

var link = document.createElement('a');
link.href = '#';
link.className = 'active';
link.textContent = "Change In Built Up Area 2000-2020";
link.onclick = function (e) {
    for(var index in toggleableLayerIds) {
      var clickedLayer = toggleableLayerIds[index];
      e.preventDefault();
      e.stopPropagation();

      var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

      if (visibility === 'visible') {
          map.setLayoutProperty(clickedLayer, 'visibility', 'none');
          this.className = '';
      } else {
          this.className = 'active';
          map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
      }
}
};
                var layers = document.getElementById('menu');
layers.appendChild(link);

map.on('load', function() {
// Add an image to use as a custom marker
map.loadImage(
'https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png',
function(error, image) {
if (error) throw error;
map.addImage('custom-marker', image);
map.addSource('Proportion of Population Living in Slums', {
'type': 'geojson',
'data':
'https://services5.arcgis.com/mv4wB4q9dMbOaZn3/ArcGIS/rest/services/slums_percentage/FeatureServer/0/query?where=ObjectID%3E0&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnHiddenFields=false&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=DnhHEy1TVAoIgmR4DIVMn6wTDau_TO0H5WRdnqZaq_j4peNk2R-B2VrEWzxdsT3eJYFsWAOxMoWaAmTERRneiNjHX_1AHXomZW8KePKSEH-6gmKBVBDMHG7hfoUnUTGR6hfPnI-yihGycEgAHccGSFjGrLwMszHRHCT1A1i7iuJ_xjlsN_OqvscsLiQ6fiilBZeR7_Dxd_XnSXhoQ-ii_PmSxTL4HkH9k38e1WuQcfA.'
});
 
// Add a symbol layer
map.addLayer({
'id': 'Proportion of Population Living in Slums',
'type': 'symbol',
'source': 'Proportion of Population Living in Slums',
'layout':{
  'icon-image': 'custom-marker'
}
});
});
});

map.on('click', 'Proportion of Population Living in Slums', function(e) {
var coordinates = e.features[0].geometry.coordinates.slice();
var country = e.features[0].properties.geoAreaName;
var description = e.features[0].properties.series_description;
var value = e.features[0].properties.last_5_years_mean;
// Ensure that if the map is zoomed out such that multiple
// copies of the feature are visible, the popup appears
// over the copy being pointed to.
while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
}
 
new mapboxgl.Popup()
.setLngLat(coordinates)
.setHTML(country + description + value)
.addTo(map);
});
 
// Change the cursor to a pointer when the mouse is over the places layer.
map.on('mouseenter', 'Proportion of Population Living in Slums', function() {
map.getCanvas().style.cursor = 'pointer';
});
 
// Change it back to a pointer when it leaves.
map.on('mouseleave', 'Proportion of Population Living in Slums', function() {
map.getCanvas().style.cursor = '';
});

var size = 200;
 
// implementation of CustomLayerInterface to draw a pulsing dot icon on the map
// see https://docs.mapbox.com/mapbox-gl-js/api/#customlayerinterface for more info
var pulsingDot = {
width: size,
height: size,
data: new Uint8Array(size * size * 4),
 
// get rendering context for the map canvas when layer is added to the map
onAdd: function() {
var canvas = document.createElement('canvas');
canvas.width = this.width;
canvas.height = this.height;
this.context = canvas.getContext('2d');
},
 
// called once before every frame where the icon will be used
render: function() {
var duration = 1000;
var t = (performance.now() % duration) / duration;
 
var radius = (size / 2) * 0.3;
var outerRadius = (size / 2) * 0.7 * t + radius;
var context = this.context;
 
// draw outer circle
context.clearRect(0, 0, this.width, this.height);
context.beginPath();
context.arc(
this.width / 2,
this.height / 2,
outerRadius,
0,
Math.PI * 2
);
context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
context.fill();
 
// draw inner circle
context.beginPath();
context.arc(
this.width / 2,
this.height / 2,
radius,
0,
Math.PI * 2
);
context.fillStyle = 'rgba(255, 100, 100, 1)';
context.strokeStyle = 'white';
context.lineWidth = 2 + 4 * (1 - t);
context.fill();
context.stroke();
 
// update this image's data with data from the canvas
this.data = context.getImageData(
0,
0,
this.width,
this.height
).data;
 
// continuously repaint the map, resulting in the smooth animation of the dot
map.triggerRepaint();
 
// return `true` to let the map know that the image was updated
return true;
}
};
 
map.on('load', function() {
map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });
 
map.addSource('Social Impact Housing', {
'type': 'geojson',
'data': 'https://services5.arcgis.com/mv4wB4q9dMbOaZn3/arcgis/rest/services/reall_data_explorer_2020_08_03_11_02_40/FeatureServer'
});
map.addLayer({
'id': 'Social Impact Housing',
'type': 'symbol',
'source': 'Social Impact Housing',
'layout': {
'icon-image': 'pulsing-dot'
}
});

map.on('click', 'Social Impact Housing', function(e) {
var coordinates = e.features[0].geometry.coordinates.slice();
var description = e.features[0].properties.Name;
 
// Ensure that if the map is zoomed out such that multiple
// copies of the feature are visible, the popup appears
// over the copy being pointed to.
while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
}
 
new mapboxgl.Popup()
.setLngLat(coordinates)
.setHTML(description)
.addTo(map);
});
 
// Change the cursor to a pointer when the mouse is over the places layer.
map.on('mouseenter', 'places', function() {
map.getCanvas().style.cursor = 'pointer';
});
 
// Change it back to a pointer when it leaves.
map.on('mouseleave', 'places', function() {
map.getCanvas().style.cursor = '';
});
});

map.on('load', function() {
map.addSource('states', {
'type': 'geojson',
'data':
'https://services5.arcgis.com/mv4wB4q9dMbOaZn3/ArcGIS/rest/services/admin1/FeatureServer/0/query?where=ObjectID%3E0&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnHiddenFields=false&returnGeometry=true&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=MVq-mZKi7H3IG90i7rjL2dmv_v82LzBNwwHVZ5dSBbCEnO49uErhXd0NpVQOoPrwL6MSiMWpwqe9TUyGuFI7FO-_getFIZFG9IzyW0UppxIefijgAg2wj9taxzdGXutXt8W3oOtC3fOrrhkTzRv0hCydM2FQsbwzyQ76eLLOFdadtZnZocuK6sp_fNXUDYyUoHEPtJ1oR2Fr89v9GtBhuBl91w3IaRhNba-jE8654X0.'
});
 
// The feature-state dependent fill-opacity expression will render the hover effect
// when a feature's hover state is set to true.
map.addLayer({
'id': 'state-fills',
'type': 'fill',
'source': 'states',
'layout': {},
'paint': {
'fill-color': '#627BC1',
'fill-opacity': [
'case',
['boolean', ['feature-state', 'hover'], false],
1,
0.5
]
}
});
 
map.addLayer({
'id': 'state-borders',
'type': 'line',
'source': 'states',
'layout': {},
'paint': {
'line-color': '#627BC1',
'line-width': 2
}
});
 
// When the user moves their mouse over the state-fill layer, we'll update the
// feature state for the feature under the mouse.
map.on('mousemove', 'state-fills', function(e) {
if (e.features.length > 0) {
if (hoveredStateId) {
map.setFeatureState(
{ source: 'states', id: hoveredStateId },
{ hover: false }
);
}
hoveredStateId = e.features[0].id;
map.setFeatureState(
{ source: 'states', id: hoveredStateId },
{ hover: true }
);
}
});
 
// When the mouse leaves the state-fill layer, update the feature state of the
// previously hovered feature.
map.on('mouseleave', 'state-fills', function() {
if (hoveredStateId) {
map.setFeatureState(
{ source: 'states', id: hoveredStateId },
{ hover: false }
);
}
hoveredStateId = null;
});
});


