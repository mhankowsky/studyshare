var SSEvent = (function () {
    function SSEvent(name, cls, loc, startTime, endTime, owner) {
        this.name = name;
        this.cls = cls;
        this.startTime = startTime;
        this.endTime = endTime;
        this.owner = owner;
    }
    SSEvent.prototype.addAttendee = function (user) {
        this.attendees.push(user);
    };
    return SSEvent;
})();
