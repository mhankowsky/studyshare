var el = $("#toucharea");

var hammertime = new Hammer(el);
hammertime.on("swiperight tap", function(ev) {
  if (ev.type === "swiperight") {
    el.html("<p>" + "Success! Tap to try again!" + "</p>");
  } else if (ev.type === "tap") {
    el.html("<p>" + "Swipe to the right!" + "</p>");
  }
});