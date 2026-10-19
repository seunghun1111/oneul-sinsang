export const DELAY_THRESHOLD_MINUTES=60;
export function scheduleDelay(event,now=new Date()){
 if(event!=="schedule")return null;
 if(!Number.isFinite(now.getTime()))throw Error("invalid_time");
 const intended=new Date(now);intended.setUTCHours(21,30,0,0);
 if(intended>now)intended.setUTCDate(intended.getUTCDate()-1);
 const minutes=Math.floor((now-intended)/60000);
 const day=new Date(intended.getTime()+9*3600000).toISOString().slice(0,10);
 return {day,intendedAt:intended.toISOString(),startedAt:now.toISOString(),delayMinutes:minutes,late:minutes>=DELAY_THRESHOLD_MINUTES};
}
