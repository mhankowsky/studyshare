/// <reference path="ssclass.ts" />
class SSUser {
  username: string;
  facebook: URL;
  friends: SSUser[];
  currentCheckin: number;
  checkinHistory: number;
  achievements: bool[];
  classes: SSClass[];
  ownedClasses: SSClass[];
  
  constructor(username: string, facebook: URL, currentCheckin: number) {
    this.username = username;
    this.facebook = facebook;
    this.currentCheckin = currentCheckin;
  }
  
  equals(user: SSUser) {
    if (this.facebook == user.facebook) {
      return true;
    } else {
      return false;
    }
  }
  
  addFriend(user: SSUser) {
    this.friends.push(user);
  }
  
  deleteFriend(user: SSUser) {
    for(var i = 0; i < this.friends.length; i++) {
      if (user.equals(this.friends[i])) {
        this.friends.splice(i, 1);
      }
    }
  }
  
  addClass(newClass: SSClass) {
    this.classes.push(newClass);
  }
  
  deleteClass(cls: SSClass) {
    for(var i = 0; i < this.classes.length; i++) {
      if (cls.equals(this.classes[i])) {
        this.classes.splice(i, 1);
      }
    }
  }
  
  ownClass(newClass: SSClass) {
    this.ownedClasses.push(newClass);
  }
  
  unownClass(cls: SSClass) {
    for(var i = 0; i < this.ownedClasses.length; i++) {
      if (cls.equals(this.ownedClasses[i])) {
        this.ownedClasses.splice(i, 1);
      }
    }
  }
}