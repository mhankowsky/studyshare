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
    SSEvent.prototype.removeAttendee = function (user) {
        for(var i = 0; i < this.attendees.length; i++) {
            if(user.equals(this.attendees[i])) {
                this.attendees.splice(i, 1);
                return;
            }
        }
    };
    return SSEvent;
})();
