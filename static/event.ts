/// <reference path="ssuser.ts" />
/// <reference path="ssclass.ts" />
/// <reference path="sslocation.ts" />

class SSEvent {
  name: string;
  cls: SSClass;
  loc: SSLocation;
  startTime: Date;
  endTime: Date;
  owner: SSUser;
  attendees: SSUser[];
  
  constructor(name: string, cls: SSClass, loc: SSLocation, startTime: Date,
    endTime: Date, owner: SSUser) {
    this.name = name;
    this.cls = cls;
    this.startTime = startTime;
    this.endTime = endTime;
    this.owner = owner;
  }
  
  addAttendee(user: SSUser) {
    this.attendees.push(user);
  } 
}