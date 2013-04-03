/// <reference path="ssuser.ts" />
/// <reference path="ssclass.ts" />

class SSEvent {
  name: string;
  cls: SSClass;
  startTime: Date;
  endTime: Date;
  owner: SSUser;
  attendees: SSUser[];
  
  constructor(name, cls, startTime, endTime, owner, attendees) {
    this.name = name;
    this.cls = cls;
    this.startTime = startTime;
    this.endTime = endTime;
    this.owner = owner;
    this.attendees = attendees;
  }
}