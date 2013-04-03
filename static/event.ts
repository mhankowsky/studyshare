class SSEvent {
  name: string;
  cls: string;
  startTime: Date;
  endTime: Date;
  owner: string;
  attendees: string;
  
  constructor(name, cls, startTime, endTime, owner, attendees) {
    this.name = name;
    this.cls = cls;
    this.startTime = startTime;
    this.endTime = endTime;
    this.owner = owner;
    this.attendees = attendees;
  }
}