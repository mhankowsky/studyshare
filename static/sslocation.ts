/// <reference path="ssbuilding.ts" />

class SSLocation {
  name: string;
  building: SSBuilding;
  lat: number;
  long: number;
  
  constructor(name: string, building: SSBuilding, lat: number, long: number) {
    this.name = name;
    this.building = building;
    this.lat = lat;
    this.long = long;
  }
}