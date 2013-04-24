var fullName;
var facebookID;
var mongoID;
var currentState;
var classIDs;
var classNames;
var userPageState;
var classPageState;
var curUserDisplay;
var curClassDisplay;
var currentLong;
var currentLat;
var MILLI_IN_HOUR = 60 * 60 * 1000;
var SSUser = (function () {
    function SSUser() { }
    return SSUser;
})();
var SSClass = (function () {
    function SSClass() { }
    return SSClass;
})();
var State = (function () {
    function State(domObject, refreshDom) {
        this.domObject = domObject;
        this.refreshDom = refreshDom;
    }
    State.switchState = function switchState(newState) {
        currentState.domObject.hide("fast");
        newState.domObject.show("fast");
        newState.refreshDom();
        currentState = newState;
    };
    return State;
})();
;
function getCurrentState() {
    return currentState;
}
function updateProfileInformation() {
    $.ajax({
        type: "get",
        url: "/account",
        success: function (response) {
            facebookID = response.user.facebookID;
            mongoID = response.user._id;
            fullName = response.user.fullName;
            classIDs = response.user.classIDs;
            classNames = response.user.classNames;
            $("#userName").text(response.user.fullName);
            $("#personal_picture").attr("src", response.user.profilePicture);
        },
        failure: function () {
        }
    });
}
function updateBuildingsClasses() {
    $.ajax({
        type: "get",
        url: "/buildings",
        success: function (response) {
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
        success: function (response) {
            var classes = response;
            var i;
            $("#class").html("");
            for(i = 0; i < classes.length; i++) {
                var option = $("<option>").attr("value", classes[i].name).text(classes[i].name);
                $("#class").append(option);
            }
            $("#ACclass").html("");
            for(i = 0; i < classes.length; i++) {
                var option = $("<option>").attr("value", classes[i].name).text(classes[i].name);
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
    if(classNames.length === 0) {
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
        success: function (response) {
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
            $(".name").click(function () {
                var id = $(this).attr("id");
                $.ajax({
                    type: "get",
                    url: "/user/" + id,
                    success: function (response) {
                        curUserDisplay = new SSUser();
                        curUserDisplay.fullName = response.fullName;
                        curUserDisplay.facebookID = response.facebookID;
                        curUserDisplay.classIDs = response.classIDs;
                        curUserDisplay.classNames = response.classNames;
                        State.switchState(userPageState);
                    }
                });
            });
            $(".ssclass").click(function () {
                var id = $(this).attr("id");
                $.ajax({
                    type: "get",
                    url: "/classes/" + id,
                    success: function (response) {
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
        success: function (response) {
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
            $(".name").click(function () {
                var id = $(this).attr("id");
                $.ajax({
                    type: "get",
                    url: "/user/" + id,
                    success: function (response) {
                        curUserDisplay = new SSUser();
                        curUserDisplay.fullName = response.fullName;
                        curUserDisplay.facebookID = response.facebookID;
                        curUserDisplay.classIDs = response.classIDs;
                        curUserDisplay.classNames = response.classNames;
                        State.switchState(userPageState);
                    }
                });
            });
            $(".ssclass").click(function () {
                var id = $(this).attr("id");
                $.ajax({
                    type: "get",
                    url: "/classes/" + id,
                    success: function (response) {
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
    var nameTitle = $("<h>").text(curClassDisplay.name);
    nameDiv.append(nameTitle);
    $(".class_page").append(nameDiv);
    var studentsDiv = $("<div id='studentsList'>");
    studentsDiv.append("<h>Students</h>");
    var i;
    var listUsers = $("<ul>");
    for(i = 0; i < curClassDisplay.studentNames.length; i++) {
        var user = $("<li>");
        var userName = $("<a>").addClass("name").attr("id", curClassDisplay.studentIDs[i].toString()).attr("href", "#").text(curClassDisplay.studentNames[i]);
        user.append(userName);
        listUsers.append(user);
    }
    studentsDiv.append(listUsers);
    $(".class_page").append(studentsDiv);
    $(".name").click(function () {
        var id = $(this).attr("id");
        $.ajax({
            type: "get",
            url: "/user/" + id,
            success: function (response) {
                curUserDisplay = new SSUser();
                curUserDisplay.fullName = response.fullName;
                curUserDisplay.facebookID = response.facebookID;
                curUserDisplay.classIDs = response.classIDs;
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
        success: function (response) {
            pictureElement.attr("src") , response.profilePicture;
            $(".profile_thumb." + theEvent.ownerID.toString()).attr("src", response.profilePicture);
        }
    });
}
function addJoinClick(joinEvent, _id) {
    joinEvent.click(function () {
        $.ajax({
            type: "post",
            url: "/join_event",
            data: {
                event_id: _id
            },
            success: function (response) {
                if(response.alreadyJoined) {
                    joinEvent.parent().children(".error").eq(0).text("Error: you have already joined this event.");
                } else if(response.alreadyEnded) {
                    joinEvent.parent().children(".error").eq(0).text("Error: you cannot join an event that has ended.");
                } else {
                    var attendee = $("<li>");
                    var attendeeText = $("<a>").addClass("name").attr("id", mongoID).attr("href", "#").text(fullName);
                    attendee.append(attendeeText);
                    joinEvent.parent().children("ul").eq(0).append(attendee);
                    attendeeText.click(function () {
                        var id = $(this).attr("id");
                        $.ajax({
                            type: "get",
                            url: "/user/" + id,
                            success: function (response) {
                                curUserDisplay = new SSUser();
                                curUserDisplay.fullName = response.fullName;
                                curUserDisplay.facebookID = response.facebookID;
                                curUserDisplay.classIDs = response.classIDs;
                                curUserDisplay.classNames = response.classNames;
                                State.switchState(userPageState);
                            }
                        });
                    });
                }
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
        success: function (response) {
            var i;
            $(".news_feed").html("");
            for(i = 0; i < response.length; i++) {
                var containerDiv = $("<div>").addClass("content-box");
                var pictureImg = $("<img>").addClass("profile_thumb").addClass(response[i].ownerID.toString());
                setPicture(pictureImg, response[i]);
                var eventDiv = $("<div>").addClass("name_class");
                var nameAnchor = $("<a>").addClass("name").attr("id", response[i].ownerID.toString()).attr("href", "#").text(response[i].ownerName);
                var textSpan = $("<span>").text(" is studying ");
                var classAnchor = $("<a>").addClass("ssclass").attr("id", response[i].clsID.toString()).attr("href", "#").text(response[i].clsName + " (" + response[i].clsNum + ")");
                var textSpan2 = $("<span>").text(" in ");
                var buildingAnchor = $("<a>").attr("href", "#").text(response[i].buildingName);
                var startTime = new Date(response[i].startTime);
                if(startTime.getTime() < now.getTime()) {
                    containerDiv.attr("id", "now");
                }
                var startTimeSpan = $("<span>").addClass("time").text("Start: " + startTime.toLocaleString());
                var endTime = new Date(response[i].endTime);
                var endTimeSpan = $("<span>").addClass("time").text("End : " + endTime.toLocaleString());
                var infoP = $("<p>").addClass("info").text(response[i].info);
                var joinEvent = $("<div>").addClass("join").text("Join Event");
                addJoinClick(joinEvent, response[i]._id);
                var textSpan3 = $("<span>").text("List of attendees: ");
                var listAttendees = $("<ul>");
                var errorMessage = $("<p>").addClass("error").text("");
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
                containerDiv.append(joinEvent);
                containerDiv.append(errorMessage);
                $(".news_feed").append(containerDiv);
            }
            $(".name").click(function () {
                var id = $(this).attr("id");
                $.ajax({
                    type: "get",
                    url: "/user/" + id,
                    success: function (response) {
                        curUserDisplay = new SSUser();
                        curUserDisplay.fullName = response.fullName;
                        curUserDisplay.facebookID = response.facebookID;
                        curUserDisplay.classIDs = response.classIDs;
                        curUserDisplay.classNames = response.classNames;
                        State.switchState(userPageState);
                    }
                });
            });
            $(".ssclass").click(function () {
                var id = $(this).attr("id");
                $.ajax({
                    type: "get",
                    url: "/classes/" + id,
                    success: function (response) {
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
    var currDate = new Date();
    var currDatePlusHour = new Date();
    currDatePlusHour.setTime(currDate.getTime() + MILLI_IN_HOUR);
    var defaultStartTime = currDate.toTimeString().split(" ")[0];
    var defaultEndTime = currDatePlusHour.toTimeString().split(" ")[0];
    $("#start_date").val(dateToString(currDate));
    $("#start_time").val(defaultStartTime);
    $("#end_date").val(dateToString(currDatePlusHour));
    $("#end_time").val(defaultEndTime);
    if(!navigator.geolocation) {
        return;
    } else {
        navigator.geolocation.getCurrentPosition(function (position) {
            currentLong = position.coords.longitude;
            currentLat = position.coords.latitude;
            var mapString = "http://maps.googleapis.com/maps/api/staticmap?center=";
            mapString = mapString + currentLat + "," + currentLong;
            mapString += "&maptype=hybrid&zoom=17&size=400x400&sensor=true&markers=size:mid|color:red|40.443078,-79.942092";
            mapString += "&markers=size:mid|color:blue|" + currentLat + "," + currentLong;
            $("#map").attr("src", mapString);
            $("#map").show();
            $("#loading_map").hide();
        });
    }
}
function dateToString(date) {
    var month = (date.getMonth() + 1);
    var day = date.getDate();
    var monthStr = "";
    var dayStr = "";
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
    return (date.getFullYear() + '-' + monthStr + '-' + dayStr);
}
function updateClassDom() {
}
$(function () {
    updateProfileInformation();
    updateBuildingsClasses();
    var newsFeedState = new State($(".news_feed"), updateNewsFeedDom);
    var profilePageState = new State($(".profile_page"), updateProfileDom);
    var addEventState = new State($(".event_creation"), updateEventDom);
    var addClassState = new State($(".add_class"), updateClassDom);
    userPageState = new State($(".user_page"), updateUserPageDom);
    classPageState = new State($(".class_page"), updateClassPageDom);
    currentState = newsFeedState;
    newsFeedState.refreshDom();
    $("#friends").click(function () {
        State.switchState(profilePageState);
    });
    $("#logo").click(function () {
        State.switchState(newsFeedState);
    });
    $("#create_event").click(function () {
        State.switchState(addEventState);
    });
    $("#classes").click(function () {
        State.switchState(addClassState);
    });
    $("#submit_event").click(function () {
        var curDate = new Date();
        $.ajax({
            type: "post",
            url: "/submit_event",
            data: {
                class: $("#class").val(),
                building: $("#building").val(),
                info: $("#info").val(),
                start_date: $("#start_date").val(),
                start_time: $("#start_time").val(),
                end_date: $("#end_date").val(),
                end_time: $("#end_time").val(),
                offset: curDate.getTimezoneOffset()
            },
            success: function (response) {
                State.switchState(newsFeedState);
            }
        });
    });
    $("#add_class").click(function () {
        $.ajax({
            type: "put",
            url: "/add_class",
            data: {
                class: $("#ACclass").val()
            },
            success: function (response) {
                updateProfileInformation();
            }
        });
    });
    var hammertime = new Hammer($(".toucharea"));
    hammertime.on("swiperight swipeleft", function (ev) {
        if(ev.type === "swiperight") {
            $("#menu").show("slow");
        } else if(ev.type === "swipeleft") {
            $("#menu").hide("slow");
        }
    });
});
