function getUserName() {
  $.ajax({
    type: "get",
    url: "/account",
    success: function(response) {
      console.log(response);
    },
    failure: function() {

    }
  });
}