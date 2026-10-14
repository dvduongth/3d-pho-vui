export type Catch={species:string;weight:number;coins:number;accuracy:number};
export function needleAt(seconds:number,traverse:number):number{const t=(seconds/traverse)%2;return t<=1?t:2-t;}
export function judgePull(position:number,zone:number,best:number):Catch|null{
 const d=Math.abs(position-0.5);if(d>zone/2)return null;
 const accuracy=1-d/(zone/2),species=d<=best/2?'Cá lóc':accuracy>=0.42?'Cá chép':'Cá rô';
 return {species,accuracy,weight:0.25+2.95*accuracy,coins:species==='Cá lóc'?22:species==='Cá chép'?14:8};
}
