/// <reference path="./jquery.d.ts" />

var fullName : string;
var facebookId : string;
var currentState : State;


class State {
  domObject: JQuery;
  refreshDom: () => void;

  constructor(domObject : JQuery, refreshDom : () => void) {
    this.domObject = domObject;
    this.refreshDom = refreshDom;
  }

  static switchState(newState : State) : void {
    currentState.domObject.hide("fast");
    newState.domObject.show("fast");
    newState.refreshDom();
    currentState = newState;
  }

};

function getCurrentState() : State {
  return currentState;
}

function updateProfileInformation() {
  $.ajax({
    type: "get",
    url: "/account",
    success: function(response) {
      facebookId = response.user.facebookId;
      fullName = response.user.fullName;
      $("#userName").text(fullName);
      $("#personal_picture").attr("src", response.user.profilePicture);
    },
    failure: function() {

    }
  });
}

//TODO instead of querying to facebook every time, only send request if explicitly want to refresh friends list
function updateFriendsListDom() {
  $(".friends_list").html("loading...");
  $.ajax({
    type: "get",
    url: "/facebook_friends",
    success: function(response) {
      $(".friends_list").html("");
      var i;
      for(i = 0; i < response.length; i++) {
        var friend = $("<li>");
        var picture = $("<img>").addClass("profile_thumb").attr("src", response[i].profilePicture);
        var friendName = $("<span>").html(response[i].fullName);
        friend.append(friendName);
        friend.append(picture);
        $(".friends_list").append(friend);
      }
    }
  });
}

function queryNewsFeed() {

}

function updateNewsFeedDom() {
  $(".news_feed").html("loading...");

  var containerDiv = $("<div>").addClass("content-box");
  var pictureImg = $("<img>").addClass("profile_thumb").attr("src", "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-ash4/369611_1338030563_1155334149_q.jpg");
  var eventDiv = $("<div>").addClass("name_class");
  var nameAnchor = $("<a>").addClass("name").attr("href", "#").text("Daniel Deutsch");
  var textSpan = $("<span>").text(" is studying ");
  var classAnchor = $("<a>").addClass("current_class").attr("href", "#").text(" 15-237");
  var timeSpan = $("<span>").addClass("time").text(" Tuesday, Monday 14 at 4:28pm");
  var infoP = $("<p>").addClass("info").text("Working on term project.  Come join me on the 7th floor!");

  containerDiv.append(pictureImg);
  containerDiv.append(eventDiv);
  eventDiv.append(nameAnchor);
  eventDiv.append(textSpan);
  eventDiv.append(classAnchor);
  eventDiv.append(timeSpan);
  containerDiv.append(infoP);

  $(".news_feed").html("");
  $(".news_feed").append(containerDiv);
}

$(function() {
  updateProfileInformation();
  var newsFeedState : State = new State($(".news_feed"), updateNewsFeedDom);
  var friendsListState : State = new State($(".friends_list"), updateFriendsListDom);
  currentState = newsFeedState;
  newsFeedState.refreshDom();
  $("#friends").click(function() {
    State.switchState(friendsListState);
  });
  $("#logo").click(function() {
    State.switchState(newsFeedState);
  });

  var hammertime = new Hammer($(".toucharea"));
  hammertime.on("swiperight swipeleft", function(ev) {
  if (ev.type === "swiperight") {
    $("#menu").show("slow");
  } else if (ev.type === "swipeleft") {
    $("#menu").hide("slow");
  }
  });
});