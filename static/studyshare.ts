/// <reference path="./jquery.d.ts" />

var fullName : string;
var facebookID : string;
var currentState : State;

var classIDs : string[];
var classNames : string[];

var userPageState : State;
var curUserDisplay : SSUser;

var currentLong : number;
var currentLat : number;

class SSUser {
  fullName : string;
  facebookID : string;
  classIDs : string[];
  classNames : string[];
}

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
      facebookID = response.user.facebookID;
      fullName = response.user.fullName;
      classIDs = response.user.classIDs;
      classNames = response.user.classNames;
      $("#userName").text(response.user.fullName);
      $("#personal_picture").attr("src", response.user.profilePicture);
    },
    failure: function() {

    }
  });
}

function updateBuildingsClasses() {
  $.ajax({
    type: "get",
    url: "/buildings",
    success: function(response) {
      var buildings = response;
      var i;
      $("#building").html("");
      for(i = 0; i < buildings.length; i++) {
        var option = $("<option>").attr("value", buildings[i].name).text(buildings[i].name);
        $("#building").append(option);
      }
    }
  });

  $.ajax({
    type: "get",
    url: "/classes",
    success: function(response) {
      var classes = response;
      var i;
      $("#class").html("");
      for(i = 0; i < classes.length; i++) {
        var option = $("<option>").attr("value", classes[i].name).text(classes[i].name);// + " (" + classes[i].num + ")");
        $("#class").append(option);
      }
      $("#ACclass").html("");
      for(i = 0; i < classes.length; i++) {
        var option = $("<option>").attr("value", classes[i].name).text(classes[i].name);// + " (" + classes[i].num + ")");
        $("#ACclass").append(option);
      }
    }
  });
}

function updateProfileDom() {
  $(".profile_page").html("");
  
  var nameDiv = $("<div id='nameTitle'>");
  var nameTitle = $("<h>").text(fullName); 
  nameDiv.append(nameTitle);
  $(".profile_page").append(nameDiv); 
  
  var classesDiv = $("<div id='classesList'>");
  classesDiv.append("<h>Classes</h>");
  if (classNames.length === 0) {
    classesDiv.append("<p>Join Classes</p>");
  } else {
    var listClasses = $("<ul>");
    for(var i = 0; i < classNames.length; i++) {
      var ssclass = $("<li>");
      ssclass.append(classNames[i]);
      listClasses.append(ssclass);
    }
    classesDiv.append(listClasses);
  }
  $(".profile_page").append(classesDiv);
  
  var friendsDiv = $("<div id='friendsList'>");
  friendsDiv.append("<h>Friends</h>");
  $.ajax({
    type: "get",
    url: "/facebook_friends",
    success: function(response) {
      var i;
      var listFriends = $("<ul>");
      for(i = 0; i < response.length; i++) {
        var friend = $("<li>");
        var picture = $("<img>").addClass("profile_thumb").attr("src", response[i].profilePicture);
        var friendName = $("<a>").addClass("name").attr("id", response[i]._id.toString()).attr("href", "#").text(response[i].fullName);
        friend.append(friendName);
        friend.append(picture);
        listFriends.append(friend);
      }
      friendsDiv.append(listFriends);
      $(".profile_page").append(friendsDiv);
      $(".name").click(function() {
      var id : string = $(this).attr("id");
        
      $.ajax({
        type: "get",
        url: "/user/" + id,
        success: function(response) {
          curUserDisplay = new SSUser();
          curUserDisplay.fullName = response.fullName;
          curUserDisplay.facebookID = response.facebookID;
          curUserDisplay.classIDs = response.classIDs
          curUserDisplay.classNames = response.classNames;
          State.switchState(userPageState);
          }
        });
      });
    }
  });
}

function updateUserPageDom() {
  $(".user_page").html("");
  
  var nameDiv = $("<div id='nameTitle'>");
  var nameTitle = $("<h>").text(curUserDisplay.fullName);
  nameDiv.append(nameTitle);
  $(".user_page").append(nameDiv); 
  
  var classesDiv = $("<div id='classesList'>");
  classesDiv.append("<h>Classes</h>");
  var listClasses = $("<ul>");
  for(var i = 0; i < curUserDisplay.classNames.length; i++) {
    var ssclass = $("<li>");
    ssclass.append(curUserDisplay.classNames[i]);
    listClasses.append(ssclass);
  }
  classesDiv.append(listClasses);
  $(".user_page").append(classesDiv);
  
  var friendsDiv = $("<div id='friendsList'>");
  friendsDiv.append("<h>Friends</h>");
  $.ajax({
    type: "get",
    url: "/facebook_friends/" + curUserDisplay.facebookID,
    success: function(response) {
      var i;
      var listFriends = $("<ul>");
      for(i = 0; i < response.length; i++) {
        var friend = $("<li>");
        var picture = $("<img>").addClass("profile_thumb").attr("src", response[i].profilePicture);
        var friendName = $("<a>").addClass("name").attr("id", response[i]._id.toString()).attr("href", "#").text(response[i].fullName);
        friend.append(friendName);
        friend.append(picture);
        listFriends.append(friend);
      }
      friendsDiv.append(listFriends);
      $(".user_page").append(friendsDiv);
      
      $(".name").click(function() {
        var id : string = $(this).attr("id");
        
        $.ajax({
          type: "get",
          url: "/user/" + id,
          success: function(response) {
            curUserDisplay = new SSUser();
            curUserDisplay.fullName = response.fullName;
            curUserDisplay.facebookID = response.facebookID;
            curUserDisplay.classIDs = response.classIDs
            curUserDisplay.classNames = response.classNames;
            State.switchState(userPageState);
          }
        });
      });
    }
  });
}

function queryNewsFeed() {

}

function setPicture(pictureElement, theEvent) {
  $.ajax({
    type: "get",
    url: "/user/" + theEvent.ownerID.toString(),
    success: function(response) {
      pictureElement.attr("src"), response.profilePicture;
      $(".profile_thumb." + theEvent.ownerID.toString()).attr("src", response.profilePicture);
    }
  });
}

function updateNewsFeedDom() {
  $(".news_feed").html("loading...");

  $.ajax({
    type: "get",
    url: "/events",
    success: function(response) {
      var i;
      $(".news_feed").html("");
      for(i = 0; i < response.length; i++) {
        var containerDiv = $("<div>").addClass("content-box");
        var pictureImg = $("<img>").addClass("profile_thumb").addClass(response[i].ownerID.toString());
        setPicture(pictureImg, response[i]);
        var eventDiv = $("<div>").addClass("name_class");
        var nameAnchor = $("<a>").addClass("name").attr("id", response[i].ownerID.toString()).attr("href", "#").text(response[i].ownerName);
        var textSpan = $("<span>").text(" is studying ");
        var classAnchor = $("<a>").addClass("current_class").attr("href", "#").text(response[i].clsName + " (" + response[i].clsNum + ")");
        var textSpan2 = $("<span>").text(" in ");
        var buildingAnchor = $("<a>").attr("href", "#").text(response[i].buildingName);
        var timeSpan = $("<span>").addClass("time").text(response[i].startTime);
        var infoP = $("<p>").addClass("info").text(response[i].info);

        containerDiv.append(pictureImg);
        containerDiv.append(eventDiv);
        eventDiv.append(nameAnchor);
        eventDiv.append(textSpan);
        eventDiv.append(classAnchor);
        eventDiv.append(textSpan2);
        eventDiv.append(buildingAnchor);
        eventDiv.append(timeSpan);
        containerDiv.append(infoP);

        $(".news_feed").append(containerDiv);
      }
      
      $(".name").click(function() {
        var id : string = $(this).attr("id");
        
        $.ajax({
          type: "get",
          url: "/user/" + id,
          success: function(response) {
            curUserDisplay = new SSUser();
            curUserDisplay.fullName = response.fullName;
            curUserDisplay.facebookID = response.facebookID;
            curUserDisplay.classIDs = response.classIDs
            curUserDisplay.classNames = response.classNames;
            State.switchState(userPageState);
          }
        });
      });
    }
  });

}

function updateEventDom() {
  if(!navigator.geolocation) {
    return;
  } else {
    navigator.geolocation.getCurrentPosition(function(position) {
      currentLong = position.coords.longitude;
      currentLat = position.coords.latitude;
      var mapString = "http://maps.googleapis.com/maps/api/staticmap?center=";
      mapString = mapString + currentLat + "," + currentLong;
      mapString += "&maptype=hybrid&zoom=17&size=400x400&sensor=true&markers=size:mid|color:red|40.443078,-79.942092";
      mapString += "&markers=size:mid|color:blue|" + currentLat + "," + currentLong;
      $("#map").attr("src", mapString);
      $("#map").show();
      $("#loading_map").hide();
      //$("#distance").html(calculateDistance(position.coords.longitude, position.coords.latitude) + " km");
    });
  }
}

function updateClassDom() {

}

$(function() {
  updateProfileInformation();
  updateBuildingsClasses();
  var newsFeedState : State = new State($(".news_feed"), updateNewsFeedDom);
  var profilePageState : State = new State($(".profile_page"), updateProfileDom);
  var addEventState : State = new State($(".event_creation"), updateEventDom);
  var addClassState : State = new State($(".add_class"), updateClassDom);
  userPageState = new State($(".user_page"), updateUserPageDom);
  //var friendsListState : State = new State($(".friends_list"), updateFriendsListDom);
  currentState = newsFeedState;
  newsFeedState.refreshDom();
  $("#friends").click(function() {
    State.switchState(profilePageState);
  });
  $("#logo").click(function() {
    State.switchState(newsFeedState);
  });
  $("#create_event").click(function() {
    State.switchState(addEventState);
  });
  $("#classes").click(function() {
    State.switchState(addClassState);
  });

  $("#submit_event").click(function() {
    $.ajax({
      type: "post",
      url: "/submit_event",
      data: {
        class: $("#class").val(),
        building: $("#building").val(),
        info: $("#info").val()
      },
      success: function(response) {
        State.switchState(newsFeedState);
      }
    });
  });
  
  $("#add_class").click(function() {
    $.ajax({
      type: "put",
      url: "/add_class",
      data: {
        class: $("#ACclass").val(),
      },
      success: function(response) {
        updateProfileInformation();
      }
    });
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