import {connect,listRooms,MultiplayerError} from './vendor/gf-multiplayer/index.js';
import type {Connection} from './vendor/gf-multiplayer/index.js';
export {listRooms,MultiplayerError};
export type {Connection};
let conn:Connection|null=null;
export async function join(room?:string):Promise<Connection>{
 conn?.leave();conn=null;
 conn=await connect(room?{room}:{});
 return conn;
}
export function current():Connection|null{return conn;}
export function leave():void{conn?.leave();conn=null;}
