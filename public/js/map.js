// When the window has finished loading create our google map below
google.maps.event.addDomListener(window, 'load', initMap);

function initMap() {
    var mapOptions = {
        // How zoomed in you want the map to start at (always required)
        zoom: 8, // The latitude and longitude to center the map (always required)
        center: new google.maps.LatLng(39.1031, -84.5120), // Philadelphia
        // How you would like to style the map.
    };
    // Get the HTML DOM element that will contain your map
    // We are using a div with id="map" seen below in the <body>
    var mapElement = document.getElementById('map');
    // Create the Google Map using our element and options defined above
    var map = new google.maps.Map(mapElement, mapOptions);
    // Let's also add a marker while we're at it
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(39.274287, -84.395428),
        map: map,
        title: 'We are here',
        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
    });
    var infoWindow = new google.maps.InfoWindow({
        content: "<h3>Russell Express LLC</h3>"
    })
    infoWindow.open(map,marker)
}
