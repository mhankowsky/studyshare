var SSEvent = (function () {
    function SSEvent(name, cls, startTime, endTime, owner, attendees) {
        this.name = name;
        this.cls = cls;
        this.startTime = startTime;
        this.endTime = endTime;
        this.owner = owner;
        this.attendees = attendees;
    }
    return SSEvent;
})();
