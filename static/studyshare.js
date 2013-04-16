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
function updateProfileDom() {
    $(".profile_page").html("<h style='padding=5px'>Classes</h>");
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
    $(".profile_page").append("<h 'padding=5px'>Friends</h>");
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
$(function () {
    updateProfileInformation();
    var newsFeedState = new State($(".news_feed"), updateNewsFeedDom);
    var profilePageState = new State($(".profile_page"), updateProfileDom);
    currentState = newsFeedState;
    newsFeedState.refreshDom();
    $("#friends").click(function () {
        State.switchState(profilePageState);
    });
    $("#logo").click(function () {
        State.switchState(newsFeedState);
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
