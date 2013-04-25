/// <reference path="./jquery.d.ts" />

declare var Hammer;

var fullName : string;
var facebookID : string;
var mongoID : string;
var currentState : State;

var classIDs : string[];
var classNames : string[];

var userPageState : State;
var classPageState : State;
var curUserDisplay : SSUser;
var curClassDisplay : SSClass;

var newsFeedState : State;
var profilePageState : State;
var addEventState : State;
var addClassState : State;
var currentLong : number;
var currentLat : number;

var MILLI_IN_HOUR = 60*60*1000;

class aLocation {
  lat : number;
  long : number;
}
var userProfilePicture: string;

class SSUser {
  fullName : string;
  facebookID : string;
  classIDs : string[];
  classNames : string[];
}

class SSClass {
  name: string;
  num: number;
  deptNum: number;
  classNum: number;
  ownerName: string;
  ownerID: string;
  studentNames: string[];
  studentIDs: string[];
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
      mongoID = response.user._id;
      fullName = response.user.fullName;
      classIDs = response.user.classIDs;
      classNames = response.user.classNames;
      userProfilePicture = response.user.profilePicture;
      $("#userName").text(response.user.fullName);
      $("#personal_picture").attr("src", response.user.profilePicture);
    },
    failure: function() {

    }
  });
}

//code adapted from http://www.movable-type.co.uk/scripts/latlong.html
function calculateDistance(loc1, loc2) {
  var lon1 = loc1.long;
  var lat1 = loc1.lat;
  var lon2 = loc2.long;
  var lat2 = loc2.lat;
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

function precise_round(num,decimals) {
  return Math.round(num*Math.pow(10,decimals))/Math.pow(10,decimals);
}


//TODO fix with function below but AHH DEADLINE SHITTY CODE
function updateBuildings() {
  $.ajax({
    type: "get",
    url: "/buildings",
    success: function(response) {
      var buildings = response;
      var i;
      $(".building").html("");
      for(i = 0; i < buildings.length; i++) {
        var option = $("<option>").attr("value", buildings[i].lat + "," + buildings[i].long).attr("id", buildings[i].name);
        var distance;
        if(currentLong !== undefined) {
          var currentLoc = new aLocation();
          currentLoc.long = currentLong;
          currentLoc.lat = currentLat;
          var buildingLoc = new aLocation();
          buildingLoc.long = buildings[i].long;
          buildingLoc.lat = buildings[i].lat;
          distance = calculateDistance(currentLoc, buildingLoc);
          option.text(buildings[i].name + " (Distance: " + precise_round(distance, 3) + " km)");
        } else {
          option.text(buildings[i].name);
        }
        $(".building").append(option);
      }
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
      $(".building").html("");
      for(i = 0; i < buildings.length; i++) {
        var option = $("<option>").attr("value", buildings[i].lat + "," + buildings[i].long).attr("id", buildings[i].name);
        var distance;
        if(currentLong !== undefined) {
          var currentLoc = new aLocation();
          currentLoc.long = currentLong;
          currentLoc.lat = currentLat;
          var buildingLoc = new aLocation();
          buildingLoc.long = buildings[i].long;
          buildingLoc.lat = buildings[i].lat;
          distance = calculateDistance(currentLoc, buildingLoc);
          option.text(buildings[i].name + " (Distance: " + distance + " km)");
        } else {
          option.text(buildings[i].name);
        }
        $(".building").append(option);
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
      $("#ACclass").html("");
      for(i = 0; i < classes.length; i++) {
        if(classes[i].name !== "Other") {
          var option = $("<option>").attr("value", classes[i].name).text(classes[i].name);// + " (" + classes[i].num + ")");
          $("#class").append(option);
          $("#ACclass").append(option);
        }
      }
    }
  });
}

function updateProfileDom() {
  updateProfileInformation();
  $(".profile_page").html("");
  
  var nameDiv = $("<div id='nameTitle'>");
  var nameTitle = $("<h>").text(fullName); 
  var userProfilePic = $("<img>").addClass("userPic").attr("src", userProfilePicture);
  nameDiv.append(userProfilePic);
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
      var className = $("<a>").addClass("ssclass").attr("id", classIDs[i]).attr("href", "#").text(classNames[i]);
      ssclass.append(className);
      listClasses.append(ssclass);
    }
    classesDiv.append(listClasses);
  }
  $(".profile_page").append(classesDiv);
  
  var friendsDiv = $("<div id='friendsList'>");
  friendsDiv.append("<h>Friends</h>");
  var listFriends = $("<ul>");
  listFriends.text("Loading friends list...");
  friendsDiv.append(listFriends);

  $(".profile_page").append(friendsDiv);
  $.ajax({
    type: "get",
    url: "/facebook_friends",
    success: function(response) {
      listFriends.text("");
      var i;
      for(i = 0; i < response.length; i++) {
        var friend = $("<li>");
        var picture = $("<img>").addClass("profile_thumb").attr("src", response[i].profilePicture);
        var friendName = $("<a>").addClass("name").attr("id", response[i]._id.toString()).attr("href", "#").text(response[i].fullName);
        friend.append(friendName);
        friend.append(picture);
        listFriends.append(friend);
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
      
      $(".ssclass").click(function() {
        var id : string = $(this).attr("id");
        
        $.ajax({
          type: "get",
          url: "/classes/" + id,
          success: function(response) {
            curClassDisplay = new SSClass();
            curClassDisplay.name = response.name;
            curClassDisplay.num = response.num;
            curClassDisplay.deptNum = response.deptNum;
            curClassDisplay.classNum = response.classNum;
            var current_event = $("<span>").addClass("currMarker");
            //containerDiv.append(current_event);
            curClassDisplay.ownerName = response.ownerName;
            curClassDisplay.ownerID = response.ownerID;
            curClassDisplay.studentNames = response.studentNames;
            curClassDisplay.studentIDs = response.studentIDs;
            State.switchState(classPageState);
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
    var className = $("<a>").addClass("ssclass").attr("id", curUserDisplay.classIDs[i]).attr("href", "#").text(curUserDisplay.classNames[i]);
    ssclass.append(className);
    listClasses.append(ssclass);
  }
  classesDiv.append(listClasses);
  $(".user_page").append(classesDiv);
  
  var friendsDiv = $("<div id='friendsList'>");
  friendsDiv.append("<h>Friends</h>");

  var listFriends = $("<ul>");
  listFriends.text("Loading friends list...");
  friendsDiv.append(listFriends);

  $(".user_page").append(friendsDiv);

  $.ajax({
    type: "get",
    url: "/facebook_friends/" + curUserDisplay.facebookID,
    success: function(response) {
      listFriends.text("");
      var i;
      for(i = 0; i < response.length; i++) {
        var friend = $("<li>");
        var picture = $("<img>").addClass("profile_thumb").attr("src", response[i].profilePicture);
        var friendName = $("<a>").addClass("name").attr("id", response[i]._id.toString()).attr("href", "#").text(response[i].fullName);
        friend.append(friendName);
        friend.append(picture);
        listFriends.append(friend);
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
      
      $(".ssclass").click(function() {
        var id : string = $(this).attr("id");
        
        $.ajax({
          type: "get",
          url: "/classes/" + id,
          success: function(response) {
            curClassDisplay = new SSClass();
            curClassDisplay.name = response.name;
            curClassDisplay.num = response.num;
            curClassDisplay.deptNum = response.deptNum;
            curClassDisplay.classNum = response.classNum;
            curClassDisplay.ownerName = response.ownerName;
            curClassDisplay.ownerID = response.ownerID;
            curClassDisplay.studentNames = response.studentNames;
            curClassDisplay.studentIDs = response.studentIDs;
            State.switchState(classPageState);
          }
        });
      });
    }
  });
}

function updateClassPageDom() {
  $(".class_page").html("");
	
  var nameDiv = $("<div id='nameTitle'>");
  var nameTitle = $("<h1>").text(curClassDisplay.name);
  nameDiv.append(nameTitle);
  $(".class_page").append(nameDiv);
  var studentsDiv = $("<div id='studentsList' >");
  studentsDiv.append("<h3>Students</h3>");
  var i;
  var listUsers = $("<ul>");
  for(i = 0; i < curClassDisplay.studentNames.length; i++) {
    var user = $("<li>").addClass("studentButton");
    //var picture = $("<img>").addClass("profile_thumb").attr("src", response[i].profilePicture);
    var userName = $("<a>").addClass("name").attr("id", curClassDisplay.studentIDs[i].toString()).attr("href", "#").text(curClassDisplay.studentNames[i]);
    user.append(userName);
    //friend.append(picture);
    listUsers.append(user);
  }
      
  studentsDiv.append(listUsers);
  $(".class_page").append(studentsDiv);
      
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

function addJoinClick(joinEvent, _id) {
  joinEvent.click(function() {
    $.ajax({
      type: "post",
      url: "/join_event",
      data: {
        event_id : _id
      },
      success: function(response) {
        if(response.alreadyJoined) {
          joinEvent.parent().children(".error-center").eq(0).text("Error: you have already joined this event.");
        } else if(response.alreadyEnded) {
          joinEvent.parent().children(".error-center").eq(0).text("Error: you cannot join an event that has ended.");
        } else {
          var attendee = $("<li>");
          var attendeeText = $("<a>").addClass("name").attr("id", mongoID).attr("href", "#").text(fullName);
          attendee.append(attendeeText);
          joinEvent.parent().children("ul").eq(0).append(attendee);
          attendeeText.click(function() {
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
          
          var joinOrLeave = joinEvent.parent().find(".joinOrLeave");
          joinOrLeave.unbind('click');
          joinOrLeave.attr("id", "leave").text("Leave Event");
          addLeaveClick(joinOrLeave, _id);
        }
      }
    });
  });
}

function addLeaveClick(leaveEvent, _id) {
  leaveEvent.click(function() {
    $.ajax({
      type: "put",
      url: "/leave_event",
      data: {
        event_id : _id
      },
      success: function(response) {
        leaveEvent.parent().children("ul").find("#" + mongoID).remove();
        var joinOrLeave = leaveEvent.parent().find(".joinOrLeave");
        joinOrLeave.unbind('click');
        joinOrLeave.attr("id", "join").text("Join Event");
        addJoinClick(joinOrLeave, _id);
      }
    });
  });
}

function updateNewsFeedDom() {
  $(".news_feed").html("loading...");
  var now = new Date();

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
        var classAnchor;
        if(response[i].clsName === "Other") {
          classAnchor = $("<span>").attr("id", response[i].clsID.toString()).text("Other");
        } else {
          classAnchor = $("<a>").addClass("ssclass").attr("id", response[i].clsID.toString()).attr("href", "#").text(response[i].clsName + " (" + response[i].clsNum + ")");
        }
        var textSpan2 = $("<span>").text(" in ");
        var buildingAnchor = $("<a>").attr("href", "#").text(response[i].buildingName);
        
        var startTime = new Date(response[i].startTime);

        if (startTime.getTime() < now.getTime()) {
          containerDiv.attr("id", "now");
          var current_event = $("<span>").addClass("currMarker");
          containerDiv.append(current_event);
        }
        var startTimeSpan = $("<span>").addClass("time").text("Start: " + startTime.toLocaleString());
        
        var endTime = new Date(response[i].endTime);
        var endTimeSpan = $("<span>").addClass("time").text("End : " + endTime.toLocaleString());
        
        var infoP = $("<p>").addClass("info").text(response[i].info);
        
        var joinOrLeave = $("<div>").addClass("joinOrLeave");
        if (response[i].attendeesIDs.indexOf(mongoID) === -1) {
          joinOrLeave.attr("id", "join").text("Join Event");
          addJoinClick(joinOrLeave, response[i]._id);
        } else {
          joinOrLeave.attr("id", "leave").text("Leave Event");
          addLeaveClick(joinOrLeave, response[i]._id);
        }

        var textSpan3 = $("<span>").text("List of attendees: ");
        var listAttendees = $("<ul>").addClass("event_attendees");

        var errorMessage = $("<p>").addClass("error").text("").addClass("event_attendees");

        var j;
        for(j = 0; j < response[i].attendeesNames.length; j++) {
          var attendee = $("<li>");
          var attendeeText = $("<a>").addClass("name").attr("id", response[i].attendeesIDs[j]).attr("href", "#").text(response[i].attendeesNames[j]);
          attendee.append(attendeeText);
          listAttendees.append(attendee);
        }

        containerDiv.append(pictureImg);
        containerDiv.append(eventDiv);
        eventDiv.append(nameAnchor);
        eventDiv.append(textSpan);
        eventDiv.append(classAnchor);
        eventDiv.append(textSpan2);
        eventDiv.append(buildingAnchor);
        eventDiv.append(startTimeSpan);
        eventDiv.append(endTimeSpan);
        containerDiv.append(infoP);
        containerDiv.append(textSpan3);
        containerDiv.append(listAttendees);
        containerDiv.append(joinOrLeave);
        containerDiv.append(errorMessage);

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
      
      $(".ssclass").click(function() {
        var id : string = $(this).attr("id");
        
        $.ajax({
          type: "get",
          url: "/classes/" + id,
          success: function(response) {
            curClassDisplay = new SSClass();
            curClassDisplay.name = response.name;
            curClassDisplay.num = response.num;
            curClassDisplay.deptNum = response.deptNum;
            curClassDisplay.classNum = response.classNum;
            curClassDisplay.ownerName = response.ownerName;
            curClassDisplay.ownerID = response.ownerID;
            curClassDisplay.studentNames = response.studentNames;
            curClassDisplay.studentIDs = response.studentIDs;
            State.switchState(classPageState);
          }
        });
      });
    }
  });

}

function updateEventDom() {
  $("#submit_event_error").text("");
  var currDate = new Date();
  var currDatePlusHour = new Date();
  currDatePlusHour.setTime(currDate.getTime() + MILLI_IN_HOUR);
  
  $("#class").html("");
  for(var i = 0; i < classNames.length; i++) {
    var option = $("<option>").attr("value", classNames[i]).text(classNames[i]);// + " (" + classes[i].num + ")");
    $("#class").append(option);
  }
  var other = $("<option>").attr("value", "Other").text("Other");
  $("#class").append(other);

  var defaultStartTime = currDate.toTimeString().split(" ")[0];
  var defaultEndTime = currDatePlusHour.toTimeString().split(" ")[0];
  $("#start_date").val(dateToString(currDate));
  $("#start_time").val(defaultStartTime);
  $("#end_date").val(dateToString(currDatePlusHour));
  $("#end_time").val(defaultEndTime);
  updateCurrentPosition(true);
}

function updateCurrentPosition(withMap) {
  if(!navigator.geolocation) {
    return;
  } else {
    navigator.geolocation.getCurrentPosition(function(position) {
      currentLong = position.coords.longitude;
      currentLat = position.coords.latitude;
      if(withMap) {
        var loc = new aLocation();
        loc.lat = $("#buildingSelect").val().split(",")[0];
        loc.long = $("#buildingSelect").val().split(",")[1];
        updateMap(loc);
      }
      updateBuildings();
    });
  }
}

function updateMap(loc : aLocation) {
  var mapString = "http://maps.googleapis.com/maps/api/staticmap?center=";
  mapString = mapString + currentLat + "," + currentLong;
  mapString += "&maptype=hybrid&zoom=16&size=400x400&sensor=true";
  mapString += "&markers=size:large|color:blue|" + currentLat + "," + currentLong;
  if(loc !== null) {
    mapString += "&markers=size:mid|color:red|" + loc.lat + "," + loc.long;
  }
  $("#map").attr("src", mapString);
  $("#map").show();
  $("#loading_map").hide();
}

function dateToString(date : Date) : string {
  var month : number = (date.getMonth() + 1);
  var day : number = date.getDate();
  var monthStr : string = "";
  var dayStr : string = "";
  
  if(month < 10) {
    monthStr = "0" + month;
  } else {
    monthStr = "" + month;
  }
  if(day < 10) {
    dayStr = "0" + day;
  } else {
    dayStr = "" + day;
  }
  
  return (date.getFullYear() + '-'+ monthStr + '-' + dayStr);
}

function updateClassDom() {
  $("#class_feedback_message").text("");
}

function initializeInformationOnLoad() {
  updateProfileInformation();
  updateBuildingsClasses();
  updateCurrentPosition(false);
}

function setupStateTransitionsOnLoad() {
  newsFeedState = new State($(".news_feed"), updateNewsFeedDom);
  profilePageState = new State($(".profile_page"), updateProfileDom);
  addEventState = new State($(".event_creation"), updateEventDom);
  addClassState = new State($(".add_class"), updateClassDom);
  userPageState = new State($(".user_page"), updateUserPageDom);
  classPageState = new State($(".class_page"), updateClassPageDom);
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
}

function setupAddEventButtonActionsOnLoad() {
  $("#buildingSelect").change(function() {
    var loc = new aLocation();
    var coords = $(this).val();
    loc.lat = coords.split(",")[0];
    loc.long = coords.split(",")[1];
    updateMap(loc);
  });

  $("#submit_event").click(function() {
    var curDate = new Date();
    var offset = curDate.getTimezoneOffset();
    
    var startDate = new Date($("#start_date").val());
    startDate.setMinutes(offset);
    var timeStr = $("#start_time").val().split(":");
    startDate.setHours(timeStr[0]);
    startDate.setMinutes(timeStr[1]);
    
    var endDate = new Date($("#end_date").val());
    endDate.setMinutes(offset);
    var timeStr = $("#end_time").val().split(":");
    endDate.setHours(timeStr[0]);
    endDate.setMinutes(timeStr[1]);
    
    if (endDate.getTime() < startDate.getTime()) {
      $("#submit_event_error").text("The end date/time must occur after the start date/time.");
    } else if (endDate.getTime() < curDate.getTime()) {
      $("#submit_event_error").text("The event cannot end before the current time.");
    } else {  
      $.ajax({
        type: "post",
        url: "/submit_event",
        data: {
          class: $("#class").val(),
          building: $("#buildingSelect").find(":selected").attr("id"),
          info: $("#info").val(),
          start_date: $("#start_date").val(),
          start_time: $("#start_time").val(),
          end_date: $("#end_date").val(),
          end_time: $("#end_time").val(),
          offset: offset
        },
        success: function(response) {
          State.switchState(newsFeedState);
        }
      });
    }
  });
}

function setupAddClassButtonFunctionalityOnLoad() {
  $("#add_class").click(function() {
    $.ajax({
      type: "put",
      url: "/add_class",
      data: {
        class: $("#ACclass").val(),
      },
      success: function(response) {
        updateProfileInformation();
        if(response.alreadyInClass) {
          $("#class_feedback_message").text("You have already joined that class!").css("color", "red");
        } else {
          $("#class_feedback_message").text("Successfully joined " + $("#ACclass").val()).css("color", "green");
        }
      }
    });
  });
}

function setupSwipeGestureOnLoad() {
  var hammertime = new Hammer($(".toucharea"));
  hammertime.on("swiperight swipeleft", function(ev) {
  if (ev.type === "swiperight") {
    $("#menu").show("slow");
  } else if (ev.type === "swipeleft") {
    $("#menu").hide("slow");
  }
  });
}

//On Load
$(function() {
  initializeInformationOnLoad();
  setupStateTransitionsOnLoad();
  setupAddEventButtonActionsOnLoad();
  setupAddClassButtonFunctionalityOnLoad();
  setupSwipeGestureOnLoad();
});
