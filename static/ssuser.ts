class SSUser {
  username: string;
  facebook: URL;
  friendsList: SSUser[];
  currentCheckin: number;
  checkinHistory: number;
  achievements: bool[];
  classes;
  ownedClasses;
  
  constructor(username: string, facebook: URL, currentCheckin: number) {
    this.username = username;
    this.facebook = facebook;
    this.currentCheckin = currentCheckin;
  }
}