/// <reference path="ssuser.ts" />

class SSClass {
  name: string;
  deptNum: number;
  classNum: number;
  owner: SSUser;
  students: SSUser[];
  
  constructor(name: string, deptNum: number, classNum: number) {
    this.name = name;
    this.deptNum = deptNum;
    this.classNum = classNum;
  }
}