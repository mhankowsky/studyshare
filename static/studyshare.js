var fullName;
var facebookID;
var mongoID;
var currentState;
var classIDs;
var classNames;
var classNums;
var userPageState;
var classPageState;
var curUserDisplay;
var curClassDisplay;
var newsFeedState;
var profilePageState;
var addEventState;
var addClassState;
var currentLong;
var currentLat;
var mapString = undefined;
var classes;
var MILLI_IN_MINUTE = 60 * 1000;
var MILLI_IN_HOUR = MILLI_IN_MINUTE * 60;
var aLocation = (function () {
    function aLocation() { }
    return aLocation;
})();
var userProfilePicture;
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
            classNums = response.user.classNums;
            userProfilePicture = response.user.profilePicture;
            updateYourClasses();
            $("#userName").text(response.user.fullName);
        },
        failure: function () {
        }
    });
}
function calculateDistance(loc1, loc2) {
    var lon1 = loc1.long;
    var lat1 = loc1.lat;
    var lon2 = loc2.long;
    var lat2 = loc2.lat;
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var lat1 = lat1 * Math.PI / 180;
    var lat2 = lat2 * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function precise_round(num, decimals) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
function updateBuildings() {
    $.ajax({
        type: "get",
        url: "/buildings",
        success: function (response) {
            var buildings = response;
            var i;
            var optionButtonArray = [];
            var optionDistancesArray = [];
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
                    optionButtonArray.push(option);
                    optionDistancesArray.push([
                        i, 
                        precise_round(distance, 3)
                    ]);
                } else {
                    option.text(buildings[i].name);
                    optionButtonArray.push(option);
                    optionDistancesArray.push([
                        i, 
                        Number.MAX_VALUE
                    ]);
                }
            }
            optionDistancesArray.sort(function (x, y) {
                return x[1] - y[1];
            });
            for(i = 0; i < optionDistancesArray.length; i++) {
                $(".building").append(optionButtonArray[optionDistancesArray[i][0]]);
            }
        }
    });
}
function updateAllClasses() {
    $.ajax({
        type: "get",
        url: "/classes",
        success: function (response) {
            classes = response;
            addClassesOptions();
        }
    });
}
function addClassesOptions() {
    $(".allClassesPlusOtherList").html("");
    $(".allClassesList").html("");
    for(var i = 0; i < classes.length; i++) {
        var option1 = $("<option>").attr("value", classes[i]._id).text("" + classes[i].deptNum + "-" + classes[i].classNum + " : " + classes[i].name);
        var option2 = $("<option>").attr("value", classes[i]._id).text("" + classes[i].deptNum + "-" + classes[i].classNum + " : " + classes[i].name);
        $(".allClassesPlusOtherList").append(option1);
        if(classes[i].name !== "Other") {
            $(".allClassesList").append(option2);
        }
    }
}
function updateYourClasses() {
    $(".yourClassListPlusOther").html("");
    for(var i = 0; i < classNames.length; i++) {
        var valString = "" + classNums[i].substring(0, 2) + "-" + classNums[i].substring(2, 5) + " : " + classNames[i];
        var option = $("<option>").attr("value", classIDs[i]).text(valString);
        $(".yourClassListPlusOther").append(option);
    }
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
    addClasses_Button.click(function () {
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
                        var current_event = $("<span>").addClass("currMarker");
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
    var nameTitle = $("<h>").text(curUserDisplay.fullName).addClass("profileName");
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
    var nameTitle = $("<h1>").text(curClassDisplay.name);
    nameDiv.append(nameTitle);
    $(".class_page").append(nameDiv);
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
                    joinEvent.parent().children(".error-center").eq(0).text("Error: you have already joined this event.");
                } else if(response.alreadyEnded) {
                    joinEvent.parent().children(".error-center").eq(0).text("Error: you cannot join an event that has ended.");
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
    leaveEvent.click(function () {
        $.ajax({
            type: "put",
            url: "/leave_event",
            data: {
                event_id: _id
            },
            success: function (response) {
                leaveEvent.parent().children("ul").find("#" + mongoID).parent().remove();
                if(leaveEvent.parent().children("ul").children().length == 0) {
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
function updateNewsFeedDom() {
    var query = {
    };
    updateNewsFeedWithQuery(query);
}
function updateNewsFeedWithQuery(query) {
    $(".news_feed").html("loading...");
    var now = new Date();
    $.ajax({
        type: "get",
        url: "/events/" + JSON.stringify(query),
        success: function (response) {
            var i;
            $(".news_feed").html("");
            for(i = 0; i < response.length; i++) {
                var containerDiv = $("<div>").addClass("content-box");
                var pictureImg = $("<img>").addClass("profile_thumb").addClass(response[i].ownerID.toString());
                setPicture(pictureImg, response[i]);
                var eventDiv = $("<div>").addClass("name_class");
                var nameAnchor = $("<a>").addClass("name").attr("id", response[i].ownerID.toString()).attr("href", "#").text(response[i].ownerName);
                var classeventDiv = $("<div>").addClass("class_display ellipsis_text");
                var textSpan = $("<span>").text("Class: ");
                var classAnchor;
                if(response[i].clsName === "Other") {
                    classAnchor = $("<span>").attr("id", response[i].clsID.toString()).text("Other");
                } else {
                    classAnchor = $("<a>").addClass("ssclass").attr("id", response[i].clsID.toString()).attr("href", "#").text(response[i].clsName + " (" + response[i].clsNum + ")");
                }
                classeventDiv.append(textSpan);
                classeventDiv.append(classAnchor);
                var buildingeventDiv = $("<div>").addClass("building_display ellipsis_text");
                var textSpan2 = $("<span>").text("At: ");
                var buildingAnchor = $("<a>").attr("href", "#").text(response[i].buildingName);
                buildingeventDiv.append(textSpan2);
                buildingeventDiv.append(buildingAnchor);
                var startTime = new Date(response[i].startTime);
                if(startTime.getTime() < now.getTime()) {
                    containerDiv.attr("id", "now");
                    var current_event = $("<span>").addClass("currMarker");
                    containerDiv.append(current_event);
                }
                var startTimeSpan = $("<span>").addClass("time").text("Start: " + startTime.toLocaleString());
                var endTime = new Date(response[i].endTime);
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
                var infoP = $("<p>").addClass("info").text(response[i].info);
                var joinOrLeave = $("<div>").addClass("joinOrLeave");
                if(response[i].attendeesIDs.indexOf(mongoID) === -1) {
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
    updateCurrentPosition(true);
}
function updateCurrentPosition(withMap) {
    if(!navigator.geolocation) {
        return;
    } else {
        navigator.geolocation.getCurrentPosition(function (position) {
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
function updateMap(loc) {
    mapString = "http://maps.googleapis.com/maps/api/staticmap?center=";
    mapString = mapString + currentLat + "," + currentLong;
    mapString += "&maptype=hybrid&zoom=16&size=400x400&sensor=true";
    mapString += "&markers=size:large|color:green|" + currentLat + "," + currentLong;
    if(loc !== null) {
        mapString += "&markers=size:mid|color:red|" + loc.lat + "," + loc.long;
    }
    $.ajax({
        type: "get",
        url: "/events/{}",
        success: function (events) {
            for(var i = 0; i < events.length; i++) {
                if(i === 0) {
                    mapString += "&markers=size:small|color:blue";
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
    addClassesOptions();
    $("#class_feedback_message").text("");
    $("#classPageFilter").val("");
    $("#ACclass").each(function () {
        var select = this;
        var options = [];
        $(select).find('option').each(function () {
            options.push({
                value: $(this).val(),
                text: $(this).text()
            });
            return null;
        });
        $(select).data('options', options);
        $("#classPageFilter").bind('change keyup', function () {
            var options = $(select).empty().data('options');
            var search = $.trim($(this).val());
            var regex = new RegExp(search, "gi");
            $.each(options, function (i) {
                var option = options[i];
                if(option.text.match(regex) !== null) {
                    $(select).append($('<option>').text(option.text).val(option.value));
                }
            });
        });
        return null;
    });
}
function initializeInformationOnLoad() {
    updateProfileInformation();
    updateBuildings();
    updateAllClasses();
    updateCurrentPosition(false);
}
function setupStateTransitionsOnLoad() {
    newsFeedState = new State($(".news_feed"), updateNewsFeedDom);
    profilePageState = new State($(".profile_page"), updateProfileDom);
    addEventState = new State($(".event_creation"), updateEventDom);
    addClassState = new State($(".add_class"), updateClassDom);
    userPageState = new State($(".user_page"), updateUserPageDom);
    classPageState = new State($(".class_page"), updateClassPageDom);
    currentState = newsFeedState;
    newsFeedState.refreshDom();
    $("#userName").click(function () {
        State.switchState(profilePageState);
    });
    $("#logo").click(function () {
        State.switchState(newsFeedState);
    });
    $("#create_event").click(function () {
        State.switchState(addEventState);
    });
    $("#classes_Button").click(function () {
        State.switchState(addClassState);
    });
}
function errorCheckDates() {
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
    if(startDate.toDateString() === "Invalid Date") {
        $("#start_date").css("background-color", "red");
        $("#submit_event_error").text("The start date is not a valid date.");
        return true;
    } else if(endDate.toDateString() === "Invalid Date") {
        $("#end_date").css("background-color", "red");
        $("#submit_event_error").text("The end date is not a valid date.");
        return true;
    } else if(endDate.getTime() < startDate.getTime()) {
        $("#submit_event_error").text("The end date/time must occur after the start date/time.");
        $("#start_date, #start_time, #end_date, #end_time").css("background-color", "red");
        return true;
    } else if(endDate.getTime() < curDate.getTime()) {
        $("#submit_event_error").text("The event cannot end before the current time.");
        $("#end_date, #end_time").css("background-color", "red");
        return true;
    } else {
        $("#submit_event_error").text("");
        return false;
    }
}
function setupAddEventButtonActionsOnLoad() {
    $("#buildingSelect").change(function () {
        var loc = new aLocation();
        var coords = $(this).val();
        loc.lat = coords.split(",")[0];
        loc.long = coords.split(",")[1];
        updateMap(loc);
    });
    $("#start_date, #start_time, #end_date, #end_time").change(function () {
        errorCheckDates();
    });
    $("#submit_event").click(function () {
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
        var buildingString = $("#buildingSelect").find(":selected").attr("id");
        if((new Date()) > startDate && currentLong !== undefined && currentLat !== undefined) {
            if(!(errorCheckDates())) {
                currentLat = currentLat + Math.random() * .0004 - .0002;
                currentLong = currentLong + Math.random() * .0004 - .0002;
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
                    success: function (response) {
                        State.switchState(newsFeedState);
                    }
                });
            }
        } else {
            $.ajax({
                type: "get",
                url: "/building/" + buildingString,
                success: function (building) {
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
                                    lat: building.lat,
                                    long: building.long,
                                    offset: offset
                                },
                                success: function (response) {
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
function setupAddClassButtonFunctionalityOnLoad() {
    $("#add_class").click(function () {
        console.log($("#ACclass").val());
        $.ajax({
            type: "put",
            url: "/add_class",
            data: {
                _id: $("#ACclass").val()
            },
            success: function (response) {
                updateProfileInformation();
                updateYourClasses();
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
    hammertime.on("swiperight swipeleft", function (ev) {
        if(ev.type === "swiperight") {
            $("#menu").css("display", "inline-block");
        } else if(ev.type === "swipeleft") {
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
function populateDurationTimes() {
    for(var i = 0; i <= 12; i++) {
        var option = $("<option>").attr("value", i * 10).text(i * 10 + " minutes");
        $("#durationFilterOptions").append(option);
    }
}
function setupMenuOnLoad() {
    $(".filter").click(function () {
        toggleEnabledClass($(this));
    });
    $("#search").click(function () {
        var query = {
        };
        if($("#classFilter").hasClass("filterEnabled")) {
            query.class = $("#classFilterOptions").val();
        }
        if($("#buildingFilter").hasClass("filterEnabled")) {
            query.building = $("#buildingFilterOptions").val();
        }
        if($("#durationFilter").hasClass("filterEnabled")) {
            query.duration = $("#durationFilterOptions").val();
        }
        updateNewsFeedWithQuery(query);
    });
    populateDurationTimes();
    $("#durationFilter").click(function () {
        $("#durationFilterOptions").fadeToggle("fast");
    });
    $("#buildingFilter").click(function () {
        $("#buildingFilterOptions").fadeToggle("fast");
    });
    $("#classFilter").click(function () {
        $("#classFilterOptions").fadeToggle("fast");
    });
    $("#sidemenu_button").click(function () {
        if($("#menu").css("display") === "block") {
            $("#menu").css("display", "none");
        } else {
            $("#menu").css("display", "inline-block");
        }
    });
}
function setupMapZoom() {
    $("#zoom-in").click(function () {
        zoomMapWithoutRefresh("in");
    });
    $("#zoom-out").click(function () {
        zoomMapWithoutRefresh("out");
    });
}
$(function () {
    initializeInformationOnLoad();
    setupStateTransitionsOnLoad();
    setupAddEventButtonActionsOnLoad();
    setupAddClassButtonFunctionalityOnLoad();
    setupSwipeGestureOnLoad();
    setupMapZoom();
    setupMenuOnLoad();
});
