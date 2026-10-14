/** One pass across the meter, then back. The centre is the ideal force. */
export function forceAt(seconds:number,traverse:number){
 const phase=(Math.max(0,seconds)/Math.max(.1,traverse))%2;
 return phase<=1?phase:2-phase;
}
export function skillResult(force:number,natural:number){
 const accuracy=Math.max(0,1-Math.abs(Math.max(0,Math.min(1,force))-.5)*2);
 return {accuracy,base:Math.round(accuracy*20),deviation:Math.round((natural-10.5)/3)};
}
