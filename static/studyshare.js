var fullName;
var facebookId;
var currentState;
var classes;
var SSClass = (function () {
    function SSClass() { }
    return SSClass;
})();
;
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
            facebookId = response.user.facebookId;
            fullName = response.user.fullName;
            classes = response.user.classes;
            $("#userName").text(fullName);
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
        }
    });
}
function updateProfileDom() {
    $(".profile_page").html("<h>Classes</h>");
    if(classes.length === 0) {
        $(".profile_page").append("<p>Join Classes</p>");
    } else {
        var listClasses = $("<ul>");
        for(var i = 0; i < classes.length; i++) {
            var ssclass = $("<li>");
            ssclass.append(classes[i].name);
            listClasses.append(ssclass);
        }
        $(".profile_page").append(listClasses);
    }
    $(".profile_page").append("<h>Friends</h>");
    $.ajax({
        type: "get",
        url: "/facebook_friends",
        success: function (response) {
            var i;
            var listFriends = $("<ul>");
            for(i = 0; i < response.length; i++) {
                var friend = $("<li>");
                var picture = $("<img>").addClass("profile_thumb").attr("src", response[i].profilePicture);
                var friendName = $("<span>").html(response[i].fullName);
                friend.append(friendName);
                friend.append(picture);
                listFriends.append(friend);
            }
            $(".profile_page").append(listFriends);
        }
    });
}
function queryNewsFeed() {
}
function updateNewsFeedDom() {
    $(".news_feed").html("loading...");
    $.ajax({
        type: "get",
        url: "/events",
        success: function (response) {
            var i;
            $(".news_feed").html("");
            for(i = 0; i < response.length; i++) {
                var containerDiv = $("<div>").addClass("content-box");
                var pictureImg = $("<img>").addClass("profile_thumb").attr("src", "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-ash4/369611_1338030563_1155334149_q.jpg");
                var eventDiv = $("<div>").addClass("name_class");
                var nameAnchor = $("<a>").addClass("name").attr("href", "#").text("Someone");
                var textSpan = $("<span>").text(" is studying ");
                var classAnchor = $("<a>").addClass("current_class").attr("href", "#").text(response[i].cls);
                var textSpan2 = $("<span>").text(" in ");
                var buildingAnchor = $("<a>").attr("href", "#").text(response[i].building);
                var timeSpan = $("<span>").addClass("time").text(" Some time");
                var infoP = $("<p>").addClass("info").text("Something something");
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
        }
    });
}
function updateEventDom() {
}
$(function () {
    updateProfileInformation();
    updateBuildingsClasses();
    var newsFeedState = new State($(".news_feed"), updateNewsFeedDom);
    var profilePageState = new State($(".profile_page"), updateProfileDom);
    var addEventState = new State($(".event_creation"), updateEventDom);
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
    $("#submit_event").click(function () {
        $.ajax({
            type: "post",
            url: "/submit_event",
            data: {
                class: $("#class").val(),
                building: $("#building").val()
            },
            success: function (response) {
                State.switchState(newsFeedState);
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
