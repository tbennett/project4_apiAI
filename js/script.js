
//fetch the data
var cityArray = ["San Francisco", "San Rafael", "Orinda", "Hayward", "Sunnyvale"];
var ecityArray = ["Seattle", "Ashland", "San Diego", "Moab", "South Lake Tahoe"];
var origin = document.getElementById("startCitySelect");
var destination = document.getElementById("endCitySelect");

buildDropdown(cityArray, origin);
buildDropdown(ecityArray, destination);

function buildDropdown(array, select){
    for(var i = 0; i < array.length; i++) {
        var opt = document.createElement('option');
        opt.value = array[i];
        opt.innerHTML = array[i];
        select.appendChild(opt);
    }
}

const map = L.map('map').setView([ 37.77429453858274, -122.43597088905996], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var submitBtn = document.getElementById('searchButton');

submitBtn.addEventListener('click', generateRoute);

function generateRoute(){
  let originCity = origin.value;
  let destinationCity = destination.value;

  // fetch coordinates for origin and destination
  //array of promises
  Promise.all([
    fetch(`https://basic-api-proxy-server.cnico078.repl.co/geocode?city=${originCity}`, {method: 'GET'}),
    fetch(`https://basic-api-proxy-server.cnico078.repl.co/geocode?city=${destinationCity}`, {method: 'GET'})
  ])
  //transform obj into json
  .then(([originResponse, destinationResponse]) => Promise.all([originResponse.json(), destinationResponse.json()]))
  //handle data
  .then(([originData, destinationData]) => {
    let originCoords = originData.items[0].position;
    let destinationCoords = destinationData.items[0].position;

  // Use Proxy server to calculate a route
  return fetch('https://basic-api-proxy-server.cnico078.repl.co/routes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ origin: originCoords, destination: destinationCoords })
  })
//obj to json
  .then(response => response.json())
  //do something w data
  .then(routeData => ({ 
    routeData,
    originCoords,
    destinationCoords,
    routeCoordinates: routeData.routes[0].sections.map(section => polyline.decode(section.polyline))
  }));
})
// draw line from origin to destination - this is straight line :(
.then (({routeData, originCoords, destinationCoords, routeCoordinates}) => {
  console.log(routeData)
  let allPoints = [];
  addRouteShapeToMap(routeCoordinates, map);
})
  //let polyline = L.polyline(routeData.coordinates, {color: 'blue'}).addTo(map);
  .catch(error => console.error('Error:', error));
}

function addRouteShapeToMap(routeCoordinates, map) {
  routeCoordinates.sections.forEach((coordinates) => {
    // decode LineString from the flexible polyline
    let linestring = new H.geo.LineString();

    coordinates.forEach((coord) => {
      linestring.pushPoint({lat: coord[0], lng: coord[1]});
    });

    // Create a polyline to display the route:
    let polyline = new H.map.Polyline(linestring, {
      style: {
        lineWidth: 4,
        strokeColor: 'rgba(0, 128, 255, 0.7)'
      }
    });

    // Add the polyline to the map
    map.addObject(polyline);
    // And zoom to its bounding rectangle
    map.getViewModel().setLookAtData({
      bounds: polyline.getBoundingBox()
    });
  });
}

