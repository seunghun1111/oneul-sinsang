import {appendFileSync} from "node:fs";
import {scheduleDelay} from "./lib/schedule-delay.mjs";
const result=scheduleDelay(process.env.GITHUB_EVENT_NAME);
const minutes=result?.delayMinutes??0,day=result?.day??"";
if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,`delay_minutes=${minutes}\nscheduled_day=${day}\n`);
if(result){
 console.log(JSON.stringify(result));
 if(result.late)console.log(`::warning::Daily collection started ${minutes} minutes after the scheduled time.`);
 if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,`### Daily collection schedule\nScheduled: ${result.intendedAt}\n\nJob check: ${result.startedAt}\n\nDelay: ${minutes} minutes (threshold: 60)\n`);
}
