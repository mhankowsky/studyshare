/// <reference path="./jquery.d.ts" />

/*******************************************************************************************/
//Global variables

declare var Hammer;

var fullName : string;
var facebookID : string;
var mongoID : string;
var currentState : State;

var classIDs : string[];
var classNames : string[];
var classNums : string[];

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

var mapString : string = undefined;

var classes;

var MILLI_IN_MINUTE = 60 * 1000
var MILLI_IN_HOUR = MILLI_IN_MINUTE * 60;

/*******************************************************************************************/
//typescript classes

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
  profilePicture : string;
}

class SSClass {
  name: string;
  num: string;
  deptNum: string;
  classNum: string;
  ownerName: string;
  ownerID: string;
  studentNames: string[];
  studentIDs: string[];
  _id: string;
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

  static switchStateWithoutRefresh(newState : State) : void {
    currentState.domObject.hide("fast");
    newState.domObject.show("fast");
    currentState = newState;
  }
};

function getCurrentState() : State {
  return currentState;
}

/*******************************************************************************************/

//Fills out global variable clientside with info from serverside database
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
      classNums = response.user.classNums;
      userProfilePicture = response.user.profilePicture;
      updateYourClasses();
      $("#userName").text(response.user.fullName);
    },
  });
}

//GPS code
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

//Fills out two HTML option lists with all buildings
function updateBuildings() {
  $.ajax({
    type: "get",
    url: "/buildings",
    success: function(response) {
      var buildings = response;
      var i;
      var optionButtonArray = [];
      var optionDistancesArray = [];
      $(".building").html("");
      for(i = 0; i < buildings.length; i++) {
        var option = $("<option>").attr("value", buildings[i].lat + "," + buildings[i].long).attr("id", buildings[i]._id).attr("name", buildings[i].name);
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
          optionButtonArray.push(option);
          optionDistancesArray.push([i, precise_round(distance, 3)]);
        } else {
          option.text(buildings[i].name);
          optionButtonArray.push(option);
          optionDistancesArray.push([i, Number.MAX_VALUE]);
        }
      }
      optionDistancesArray.sort(function(x, y) {
        return x[1] - y[1];
      });
      for(i = 0; i < optionDistancesArray.length; i++) {
        $(".building").append(optionButtonArray[optionDistancesArray[i][0]]);
      }
    }
  });
}

//Updates classes lists with all classes from database
function updateAllClasses() {
  $.ajax({
    type: "get",
    url: "/classes",
    success: function(response) {
      classes = response;
      $(".allClassesPlusOtherList").html("");
      $(".allClassesList").html("");

      for(var i = 0; i < classes.length; i++) {
        var option1 = $("<option>").attr("value", classes[i]._id).text("" + classes[i].deptNum + "-" + classes[i].classNum + " : " + classes[i].name);
        //wow wtf if you try to append a jQuery object to two things it removes it from the first.  Duplicate of other option button.
        var option2 = $("<option>").attr("value", classes[i]._id).text("" + classes[i].deptNum + "-" + classes[i].classNum + " : " + classes[i].name);
        $(".allClassesPlusOtherList").append(option1);
        if(classes[i].name !== "Other") {
          $(".allClassesList").append(option2);
        }
      }
    }
  });
}

//grabs your specific classes that you have added from the database adn appends to appropriate lists.
function updateYourClasses() {
  $(".yourClassListPlusOther").html("");
  for(var i = 0; i < classNames.length; i++) {
    var valString = "" + classNums[i].substring(0, 2) + "-" + classNums[i].substring(2, 5) + " : " + classNames[i];
    var option = $("<option>").attr("value", classIDs[i]).text(valString);
    $(".yourClassListPlusOther").append(option);
  }
}

/*******************************************************************************************/
//Main updateDom functions, one for each "page" in the app.

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
 
  var listClasses = $("<ul>");
  for(var i = 0; i < classNames.length; i++) {
    if(classNames[i] !== "Other") {
      var ssclass = $("<li>");
      var className = $("<a>").addClass("ssclass").attr("id", classIDs[i]).attr("href", "#").text(classNames[i]);
      ssclass.append(className);
      listClasses.append(ssclass);
    }
  }
  classesDiv.append(listClasses);

  var addClasses_Button = $("<span>").text("Join Classes").addClass("classes_Button button");
    
  addClasses_Button.click(function() {
    State.switchState(addClassState);
  });

  classesDiv.append(addClasses_Button);
  
  $(".profile_page").append(classesDiv);
  
  var friendsDiv = $("<div id='friendsList'>");
  friendsDiv.append("<h>Friends</h>");
  var listFriends = $("<ul>");
  listFriends.text("Loading friends list...");
  friendsDiv.append(listFriends);

  $(".profile_page").append(friendsDiv);
  $.ajax({
    type: "get",
    url: "/facebook_friends/" + facebookID,
    success: function(response) {
      listFriends.text("");
      var i;
      for(i = 0; i < response.length; i++) {
        var friend = $("<li>").addClass("profileStudentButton");
        var picture = $("<img>").addClass("profile_thumb").attr("src", response[i].profilePicture);
        var friendName = $("<a>").addClass("name").attr("id", response[i]._id.toString()).attr("href", "#").text(response[i].fullName);
        friend.append(picture);
        friend.append(friendName);
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
            curClassDisplay._id = response._id;
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
  var nameTitle = $("<h>").text(curUserDisplay.fullName).addClass("profileName");
  var userProfilePic = $("<img>").addClass("userPic").attr("src", curUserDisplay.profilePicture);
  nameDiv.append(userProfilePic);
  nameDiv.append(nameTitle);
  $(".user_page").append(nameDiv); 
  
  var classesDiv = $("<div id='classesList'>");
  classesDiv.append("<h>Classes</h>");
  var listClasses = $("<ul>");
  for(var i = 0; i < curUserDisplay.classNames.length; i++) {
    if(curUserDisplay.classNames[i] !== "Other") {
      var ssclass = $("<li>");
      var className = $("<a>").addClass("ssclass").attr("id", curUserDisplay.classIDs[i]).attr("href", "#").text(curUserDisplay.classNames[i]);
      ssclass.append(className);
      listClasses.append(ssclass);
    }
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
        var friend = $("<li>").addClass("profileStudentButton");
        var picture = $("<img>").addClass("profile_thumb").attr("src", response[i].profilePicture);
        var friendName = $("<a>").addClass("name").attr("id", response[i]._id.toString()).attr("href", "#").text(response[i].fullName);
        friend.append(picture);
        friend.append(friendName);
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
            curUserDisplay.profilePicture = response.profilePicture;
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
            curClassDisplay._id = response._id;
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
  
  var addOrRemove = $("<a>").addClass("addOrRemove button");
  if (curClassDisplay.studentIDs.indexOf(mongoID) === -1) {
    addOrRemove.attr("id", "addThisClass").text("Add Class");
    addAddClick(addOrRemove, curClassDisplay._id);
  } else {
    addOrRemove.attr("id", "removeThisClass").text("Remove Class");
    addRemoveClick(addOrRemove, curClassDisplay._id);
  }
  $(".class_page").append(addOrRemove);
  
  var studentsDiv = $("<div id='studentsList' >");
  studentsDiv.append("<h3 class='studentText'>Students</h3>");
  var i;
  var listUsers = $("<ul>");
  for(i = 0; i < curClassDisplay.studentNames.length; i++) {
    var user = $("<li>").addClass("studentButton");
    var userName = $("<a>").addClass("name").attr("id", curClassDisplay.studentIDs[i].toString()).attr("href", "#").text(curClassDisplay.studentNames[i]);
    user.append(userName);
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
        curUserDisplay.profilePicture = response.profilePicture;
        State.switchState(userPageState);
      }
    });
  });
}

//sets all profile pictures
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

//add-class button
function addAddClick(addEvent, _id) {
  addEvent.click(function() {
    $.ajax({
      type: "put",
      url: "/add_class",
      data: {
        _id: _id,
      },
      success: function(response) {
        updateProfileInformation();
        updateYourClasses();
        
        var attendee = $("<li>");
        var attendeeText = $("<a>").addClass("name").addClass("studentButton").attr("id", mongoID).attr("href", "#").text(fullName);
        attendee.append(attendeeText);
        addEvent.parent().children("#studentsList").children("ul").eq(0).append(attendee);
        
        var addOrRemove = addEvent.parent().find(".addOrRemove");
        addOrRemove.unbind('click');
        addOrRemove.attr("id", "remove").text("Remove Class");
        addRemoveClick(addOrRemove, _id);
      }
    });
  });
}

//leave-class button
function addRemoveClick(removeEvent, _id) {
  removeEvent.click(function() {
    $.ajax({
      type: "put",
      url: "/leave_class",
      data: {
        _id: _id,
      },
      success: function(response) {
        updateProfileInformation();
        updateYourClasses();
        
        removeEvent.parent().children("#studentsList").children("ul").find("#" + mongoID).parent().remove();
        
        var addOrRemove = removeEvent.parent().find(".addOrRemove");
        addOrRemove.unbind('click');
        addOrRemove.attr("id", "add").text("Add Class");
        addAddClick(addOrRemove, _id);
      }
    });
  });
}

//join-event button
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
                curUserDisplay.profilePicture = response.profilePicture;
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

//leave-event button
function addLeaveClick(leaveEvent, _id) {
  leaveEvent.click(function() {
    $.ajax({
      type: "put",
      url: "/leave_event",
      data: {
        event_id : _id
      },
      success: function(response) {
        leaveEvent.parent().children("ul").find("#" + mongoID).parent().remove();
        if (leaveEvent.parent().children("ul").children().length == 0) {
          leaveEvent.parent().remove();
        } else {
          var joinOrLeave = leaveEvent.parent().find(".joinOrLeave");
          joinOrLeave.unbind('click');
          joinOrLeave.attr("id", "join").text("Join Event");
          addJoinClick(joinOrLeave, _id);
        }
      }
    });
  });
}

//updates news feed with loading text while request is sent
function updateNewsFeedDom() {
  var query = {};
  $(".news_feed").html("loading...");
  updateNewsFeedWithQuery(query);
}

//adds single event to news feed
function addEventToDom(theEvent) {
  var containerDiv = $("<div>").addClass("content-box");
  var pictureImg = $("<img>").addClass("profile_thumb").addClass(theEvent.ownerID.toString());
  setPicture(pictureImg, theEvent);
  var eventDiv = $("<div>").addClass("name_class");
  var nameAnchor = $("<a>").addClass("name").attr("id", theEvent.ownerID.toString()).attr("href", "#").text(theEvent.ownerName);
  var classeventDiv = $("<div>").addClass("class_display ellipsis_text");
  var textSpan = $("<span>").text("Class: ");
  var classAnchor;
  if(theEvent.clsName === "Other") {
    classAnchor = $("<span>").attr("id", theEvent.clsID.toString()).text("Other");
  } else {
    classAnchor = $("<a>").addClass("ssclass").attr("id", theEvent.clsID.toString()).attr("href", "#").text(theEvent.clsName + " (" + theEvent.clsNum + ")");
  }
  classeventDiv.append(textSpan);
  classeventDiv.append(classAnchor);
  
  var buildingeventDiv = $("<div>").addClass("building_display ellipsis_text");
  var textSpan2 = $("<span>").text("At: ");
  var buildingAnchor = $("<a>").attr("href", "#").text(theEvent.buildingName);

  buildingeventDiv.append(textSpan2);
  buildingeventDiv.append(buildingAnchor);
  
  var startTime = new Date(theEvent.startTime);
  var now = new Date();

  if (startTime.getTime() < now.getTime()) {
    containerDiv.attr("id", "now");
    var current_event = $("<span>").addClass("currMarker");
    containerDiv.append(current_event);
  }
  var startTimeSpan = $("<span>").addClass("time").text("Start: " + startTime.toLocaleString());
  
  var endTime = new Date(theEvent.endTime);
  var endTimeSpan = $("<span>").addClass("time").text("End : " + endTime.toLocaleString());

  var timeRemainingSpan = $("<span>").addClass("time");
  if(startTime.getTime() < now.getTime()) {
    var rawTimeRemaining = endTime.getTime() - now.getTime();
    var minutesRemaining = Math.round(rawTimeRemaining / MILLI_IN_MINUTE);
    if(minutesRemaining >= 60) {
      var hoursRemaining = Math.round(rawTimeRemaining / MILLI_IN_HOUR);
      if(hoursRemaining === 1) {
        timeRemainingSpan.text(hoursRemaining + " hour remaining");
      } else {
        timeRemainingSpan.text(hoursRemaining + " hours remaining");
      }
    } else {
      if(minutesRemaining === 1) {
        timeRemainingSpan.text(minutesRemaining + " minute remaining");
      } else {
        timeRemainingSpan.text(minutesRemaining + " minutes remaining");
      }
    }
  }
  
  var infoP = $("<p>").addClass("info").text(theEvent.info);
  
  var joinOrLeave = $("<div>").addClass("joinOrLeave");
  if (theEvent.attendeesIDs.indexOf(mongoID) === -1) {
    joinOrLeave.attr("id", "join").text("Join Event");
    addJoinClick(joinOrLeave, theEvent._id);
  } else {
    joinOrLeave.attr("id", "leave").text("Leave Event");
    addLeaveClick(joinOrLeave, theEvent._id);
  }

  var textSpan3 = $("<span>").text("List of attendees: ");
  var listAttendees = $("<ul>").addClass("event_attendees");

  var errorMessage = $("<p>").addClass("error").text("").addClass("event_attendees");

  var j;
  for(j = 0; j < theEvent.attendeesNames.length; j++) {
    var attendee = $("<li>");
    var attendeeText = $("<a>").addClass("name").attr("id", theEvent.attendeesIDs[j]).attr("href", "#").text(theEvent.attendeesNames[j]);
    attendee.append(attendeeText);
    listAttendees.append(attendee);
  }

  containerDiv.append(eventDiv);
  eventDiv.append(pictureImg);
  eventDiv.append(nameAnchor);
  eventDiv.append(classeventDiv);
  eventDiv.append(buildingeventDiv);
  eventDiv.append(startTimeSpan);
  eventDiv.append(endTimeSpan);
  eventDiv.append(timeRemainingSpan);
  containerDiv.append(infoP);
  containerDiv.append(textSpan3);
  containerDiv.append(listAttendees);
  containerDiv.append(joinOrLeave);
  containerDiv.append(errorMessage);

  $(".news_feed").append(containerDiv);
}

//updates news feed with specific query specifying which events to filter out
function updateNewsFeedWithQuery(query) {
  var popular = [];
  var hasStartedAndTimeRemaining = [];
  var hasStartedEndingSoon = [];
  var remaining = [];

  var POPULAR = 5;  //number of attendees needed at an event to be deemed "popular"

  $.ajax({
    type: "get",
    url: "/events/" + JSON.stringify(query),
    success: function(response) {
      var i;
      var now = new Date().getTime();
      $(".news_feed").html("");
      response.sort(function(event1, event2) {
        return new Date(event1.endTime).getTime() - new Date(event2.endTime).getTime();
      });

      for(i = response.length - 1; i >= 0; i--) {
        var start = new Date(response[i].startTime).getTime();
        var end = new Date(response[i].endTime).getTime();
        if(response[i].attendeesIDs.length >= POPULAR) {
          popular.unshift(response[i]);
          response.splice(i, 1);
        } else if(start < now && now + MILLI_IN_MINUTE * 30 < end) {
          hasStartedAndTimeRemaining.unshift(response[i]);
          response.splice(i, 1);
        } else if(start < now) {
          hasStartedEndingSoon.unshift(response[i]);
          response.splice(i, 1);
        } else {
          remaining.unshift(response[i]);
          response.splice(i, 1);
        }
      }

      var popularDiv = $("<div>").text("Popular events:");
      $(".news_feed").append(popularDiv);
      for(i = 0; i < popular.length; i++) {
        addEventToDom(popular[i]);
      }

      var hasStartedAndTimeRemainingDiv = $("<div>").text("Current events:");
      $(".news_feed").append(hasStartedAndTimeRemainingDiv);
      for(i = 0; i < hasStartedAndTimeRemaining.length; i++) {
        addEventToDom(hasStartedAndTimeRemaining[i]);
      }

      var hasStartedEndingSoonDiv = $("<div>").text("Ending soon:");
      $(".news_feed").append(hasStartedEndingSoonDiv);
      for(i = 0; i < hasStartedEndingSoon.length; i++) {
        addEventToDom(hasStartedEndingSoon[i]);
      }

      var remainingDiv = $("<div>").text("Future events:");
      $(".news_feed").append(remainingDiv);
      for(i = 0; i < remaining.length; i++) {
        addEventToDom(remaining[i]);
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
            curUserDisplay.profilePicture = response.profilePicture;
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
            curClassDisplay._id = response._id;
            State.switchState(classPageState);
          }
        });
      });
    }
  });
}

//resets add-event page to default values
function updateEventDom() {
  $("#submit_event_error").text("");
  var currDate = (new Date());
  currDate.setSeconds(0);
  var currDatePlusHour = new Date();
  currDatePlusHour.setTime(currDate.getTime() + MILLI_IN_HOUR);
  

  var defaultStartTime = currDate.toTimeString().split(" ")[0];
  var defaultEndTime = currDatePlusHour.toTimeString().split(" ")[0];
  $("#start_date").val(dateToString(currDate));
  $("#start_time").val(defaultStartTime);
  $("#end_date").val(dateToString(currDatePlusHour));
  $("#end_time").val(defaultEndTime);
  $("#info").val("");
  updateCurrentPosition(true);
}

//gets GPS coordinates
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

//updates static Google Map with your location along with building you have selected and all events nearby
function updateMap(loc : aLocation) {
  mapString = "http://maps.googleapis.com/maps/api/staticmap?center=";
  mapString = mapString + currentLat + "," + currentLong;
  mapString += "&maptype=hybrid&zoom=16&size=200x200&sensor=true";
  mapString += "&markers=size:large|color:green|" + currentLat + "," + currentLong;
  if(loc !== null) {
    mapString += "&markers=size:mid|color:red|" + loc.lat + "," + loc.long;
  }
  $.ajax({
    type: "get",
    url: "/events/{}",
    success: function(events) {
      for(var i = 0; i < events.length; i++) {
        if(i === 0) {
          mapString += "&markers=size:small|color:blue"
        }
        mapString += "|" + events[i].lat + "," + events[i].long;
      }
      $("#map").attr("src", mapString);
      $("#map").show();
      $("#zoom-in").show();
      $("#zoom-out").show();
      $("#loading_map").hide();
    }
  });
}

function zoomMapWithoutRefresh(zoom) {
  if(mapString !== undefined) {
    var firstHalf = mapString.split("&zoom=")[0] + "&zoom=";
    var zoomLevel = parseInt(mapString.split("&zoom=")[1].split("&size=")[0]);
    var secondHalf = "&size=" + mapString.split("&zoom=")[1].split("&size=")[1];
    if(zoom === "in" && zoomLevel < 21) {
      zoomLevel++;
    }
    if(zoom === "out" && zoomLevel > 13) {
      zoomLevel--;
    }
    mapString = firstHalf + zoomLevel.toString() + secondHalf;
    $("#map").attr("src", mapString);
  }
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
  $("#ACclass").html("");
  $("#class_feedback_message").text("");
  $("#classPageFilter").val("");
}

function initializeInformationOnLoad() {
  updateProfileInformation();
  updateBuildings();
  updateAllClasses();
  updateCurrentPosition(false);
}

//sets state transitions when clicking buttons
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
  $("#userName").click(function() {
    $("#menu").css("display", "none");
    State.switchState(profilePageState);
  });
  $("#logo").click(function() {
    State.switchState(newsFeedState);
  });
  $("#create_event").click(function() {
    State.switchState(addEventState);
  });
  $("#classes_Button").click(function() {
    State.switchState(addClassState);
  });
}

//return true if there is an error, false otherwise
function errorCheckDates() : bool {
  $("#start_date, #start_time, #end_date, #end_time").css("background-color", "#ddd");
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
  
  if (startDate.toDateString() === "Invalid Date") {
    $("#start_date").css("background-color", "red");
    $("#submit_event_error").text("The start date is not a valid date.");
    return true;
  } else if (endDate.toDateString() === "Invalid Date") {
    $("#end_date").css("background-color", "red");
    $("#submit_event_error").text("The end date is not a valid date.");
    return true;
  } else if (endDate.getTime() < startDate.getTime()) {
    $("#submit_event_error").text("The end date/time must occur after the start date/time.");
    $("#start_date, #start_time, #end_date, #end_time").css("background-color", "red");
    return true;
  } else if (endDate.getTime() < curDate.getTime()) {
    $("#submit_event_error").text("The event cannot end before the current time.");
    $("#end_date, #end_time").css("background-color", "red");
    return true;
  } else {
    $("#submit_event_error").text("");
    return false;
  }
}

//adds actions to adding-event page
function setupAddEventButtonActionsOnLoad() {
  $("#buildingSelect").change(function() {
    var loc = new aLocation();
    var coords = $(this).val();
    loc.lat = coords.split(",")[0];
    loc.long = coords.split(",")[1];
    updateMap(loc);
  });

  $("#start_date, #start_time, #end_date, #end_time").change(function() {
    errorCheckDates();
  });
  
  $("#submit_event").click(function() {
    var offset = (new Date()).getTimezoneOffset();
    var start_date = $("#start_date").val();
    var start_time = $("#start_time").val();
    var end_date = $("#end_date").val();
    var end_time = $("#end_time").val();

    var startDate = new Date(start_date);
    startDate.setMinutes(offset);
    var timeStr = start_time.split(":");
    startDate.setHours(timeStr[0]);
    startDate.setMinutes(timeStr[1]);
    
    var endDate = new Date(end_date);
    endDate.setMinutes(offset);
    var timeStr = end_time.split(":");
    endDate.setHours(timeStr[0]);
    endDate.setMinutes(timeStr[1]);

    var buildingString = $("#buildingSelect").find(":selected").attr("name");

    if((new Date()) > startDate && currentLong !== undefined && currentLat !== undefined) {
      //assume current location is correct
      if(!(errorCheckDates())) {
        $.ajax({
          type: "post",
          url: "/submit_event",
          data: {
            class: $("#class").val(),
            building: buildingString,
            info: $("#info").val(),
            startTime: startDate,
            endTime: endDate,
            lat: currentLat,
            long: currentLong,
            offset: offset
          },
          success: function(response) {
            State.switchState(newsFeedState);
          }
        });
      }
    } else {
      //get location from building
      $.ajax({
        type : "get",
        url: "/building/" + buildingString,
        success: function(building) {
          if(building !== undefined) {
            if(!(errorCheckDates())) {
              $.ajax({
                type: "post",
                url: "/submit_event",
                data: {
                  class: $("#class").val(),
                  building: buildingString,
                  info: $("#info").val(),
                  startTime: startDate,
                  endTime: endDate,
                  //fuzz coordinates by small amount
                  lat: building.lat + Math.random() * .0004 - .0002,
                  long: building.long + Math.random() * .0004 - .0002,
                  offset: offset
                },
                success: function(response) {
                  State.switchState(newsFeedState);
                }
              });
            }
          }
        }
      });
    }
  });
}

//add-class button initialization
function setupAddClassButtonFunctionalityOnLoad() {
  $("#add_class").click(function() {
    if ($("#ACClass").val() == "") {
      $("#class_feedback_message").text("Please add a valid class!").css("color", "red");
    } else {
      $.ajax({
        type: "put",
        url: "/add_class",
        data: {
          _id: $("#ACclass").val(),
        },
        success: function(response) {
          updateProfileInformation();
          updateYourClasses();
          if(response.alreadyInClass) {
            $("#class_feedback_message").text("You have already joined that class!").css("color", "red");
          } else {
            $("#class_feedback_message").text("Successfully joined " + $("#ACclass option:selected").text()).css("color", "green");
          }
        }
      });
    }
  });
}

//hammer.js swipe initialization
 function setupSwipeGestureOnLoad() {
  var hammertime = new Hammer($(".toucharea"));
  hammertime.on("swiperight swipeleft", function(ev) {
  if (ev.type === "swiperight") {
      $("#menu").css("display", "inline-block");
  } else if (ev.type === "swipeleft") {
      $("#menu").css("display", "none");
  }
  });
}

function toggleEnabledClass(elem) {
  if(elem.hasClass("filterEnabled")) {
    elem.removeClass("filterEnabled");
  } else {
    elem.addClass("filterEnabled");
  }
}

//initialize option list for "duration" filter with values from 0 minutes to 120 minutes
function populateDurationTimes() {
  for(var i = 0; i <= 12; i++) {
    var option = $("<option>").attr("value", i * 10).text(i * 10 + " minutes");
    $("#durationFilterOptions").append(option);
  }
}

//initialize button clicks for the sidebar menu
function setupMenuOnLoad() {
  $(".filter").click(function() {
    toggleEnabledClass($(this));
  }); 
  $("#search").click(function() {
    var query : any = {};
    if($("#classFilter").hasClass("filterEnabled")) {
      query.class = $("#classFilterOptions").val();
    }
    if($("#buildingFilter").hasClass("filterEnabled")) {
      query.building = $("#buildingFilterOptions").find(":selected").attr("id");
    }
    if($("#durationFilter").hasClass("filterEnabled")) {
      query.duration = $("#durationFilterOptions").val();
    }
    $("#menu").css("display", "none");
    State.switchStateWithoutRefresh(newsFeedState);
    updateNewsFeedWithQuery(query);
  });
  populateDurationTimes();
  $("#durationFilter").click(function() {
    $("#durationFilterOptions").fadeToggle("fast");
  });
  $("#buildingFilter").click(function() {
    $("#buildingFilterOptions").fadeToggle("fast");
  });
  $("#classFilter").click(function() {
    $("#classFilterOptions").fadeToggle("fast");
  });

  $("#sidemenu_button").click(function () {
    if($("#menu").css("display") === "block"){
      $("#menu").css("display", "none");
    }
    else{
      $("#menu").css("display", "inline-block");
    }
  });
}

function setupMapZoom() {
  $("#zoom-in").click(function() {
    zoomMapWithoutRefresh("in");
  });
  $("#zoom-out").click(function() {
    zoomMapWithoutRefresh("out");
  });
}

function setupSearchOnLoad() {
  $("#classsearch").click(function() {
    var search = $.trim($("#classPageFilter").val());
  	var regex = new RegExp(search,"gi");
  	$("#ACclass").html("");
  	 
  	classes.forEach(function(opt) {
  	  if (opt.name != "Other") {
  	    var clsString = "" + opt.deptNum + "-" + opt.classNum + " : " + opt.name;
  	    if(clsString.match(regex) !== null) {
  	      $("#ACclass").append($('<option>').text(clsString).val(opt._id));
  	    }
  	  }
  	});
  });
}

//On Load
$(function() {
  initializeInformationOnLoad();
  setupStateTransitionsOnLoad();
  setupAddEventButtonActionsOnLoad();
  setupAddClassButtonFunctionalityOnLoad();
  setupSearchOnLoad();
  setupSwipeGestureOnLoad();
  setupMapZoom();
  setupMenuOnLoad();
});
