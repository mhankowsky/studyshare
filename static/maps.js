//api key: AIzaSyD6W9Xvy_LP3F0_p0F0lZOjM0LZAqc5cCM
$(function() {
  if(!navigator.geolocation) {
    alert("No geolocation detected.");
    return;
  }
  $("#locationButton").click(function() {
    navigator.geolocation.getCurrentPosition(function(position) {
      $("#coordinates").html("longitude: " + position.coords.longitude + ", latitude: " + position.coords.latitude);
      var mapString = "http://maps.googleapis.com/maps/api/staticmap?center=";
      mapString = mapString + position.coords.latitude + "," + position.coords.longitude;
      mapString += "&maptype=hybrid&zoom=14&size=400x400&sensor=true&markers=size:mid|color:red|40.443078,-79.942092";
      mapString += "&markers=size:mid|color:blue|" + position.coords.latitude + "," + position.coords.longitude;
      $("#map").attr("src", mapString);
      //$("#distance").html(calculateDistance(position.coords.longitude, position.coords.latitude) + " km");
    });
  });
});


//code from http://www.movable-type.co.uk/scripts/latlong.html
function calculateDistance(lon1, lat1) {
  lon2 = -79.942092;
  lat2 = 40.443078;
  var R = 6371; // km
  var dLat = (lat2-lat1) * Math.PI / 180;
  var dLon = (lon2-lon1) * Math.PI / 180;
  var lat1 = lat1 * Math.PI / 180;
  var lat2 = lat2 * Math.PI / 180;

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}