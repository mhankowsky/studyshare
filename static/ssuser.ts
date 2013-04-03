/// <reference path="ssclass.ts" />

class SSUser {
  username: string;
  facebook: string;
  friends: SSUser[];
  currentCheckin: number;
  checkinHistory: number;
  achievements: bool[];
  classes: SSClass[];
  ownedClasses: SSClass[];
  
  constructor(username: string, facebook: string, currentCheckin: number) {
    this.username = username;
    this.facebook = facebook;
    this.currentCheckin = currentCheckin;
  }
  
  equals(user: SSUser) {
    if (this.facebook === user.facebook) {
      return true;
    } else {
      return false;
    }
  }
  
  addFriend(user: SSUser) {
    this.friends.forEach(function(x) {
      if(user.equals(x)) {
        return false;
      }
    });
    
    this.friends.push(user);
    return true;
  }
  
  deleteFriend(user: SSUser) {
    for(var i = 0; i < this.friends.length; i++) {
      if (user.equals(this.friends[i])) {
        return this.friends.splice(i, 1);
      }
    }
    
    return null;
  }
  
  addClass(newClass: SSClass) {
    this.classes.forEach(function(x) {
      if (newClass.equals(x)) {
        return false;
      }
    });
    
    this.classes.push(newClass);
    return true;
  }
  
  deleteClass(cls: SSClass) {
    for(var i = 0; i < this.classes.length; i++) {
      if (cls.equals(this.classes[i])) {
        return this.classes.splice(i, 1);
      }
    }
    
    return null;
  }
  
  ownClass(newClass: SSClass) {
    this.ownedClasses.forEach(function(x) {
      if(newClass.equals(x)) {
        return false;
      }
    });
  
    this.ownedClasses.push(newClass);
    return true;
  }
  
  unownClass(cls: SSClass) {
    for(var i = 0; i < this.ownedClasses.length; i++) {
      if (cls.equals(this.ownedClasses[i])) {
        return this.ownedClasses.splice(i, 1);
      }
    }
    
    return null;
  }
}