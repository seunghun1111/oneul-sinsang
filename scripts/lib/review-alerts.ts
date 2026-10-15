import { createHash } from "node:crypto";
import { reasons, type AutoReport } from "./auto-review.ts";
export type Alert={key:string;text:string};
export function reviewAlerts(report:AutoReport, decisions:Record<string,unknown>, sent:Record<string,string>, failures:string[]=[]):Alert[] {
  const alerts:Alert[]=[];
  for(const [id,p] of Object.entries(report.products)) {
    if(p.decision!=="pending" || decisions[id]) continue;
    for(const code of p.codes.filter(code=>["identity","source","robots"].includes(code))) alerts.push({key:`product:${id}:${code}`,text:`${id}: ${reasons[code]??code}`});
  }
  failures.forEach(source=>alerts.push({key:`collector:${source}`,text:`수집 확인 필요: ${source}`}));
  return alerts.filter(alert=>!sent[alert.key]);
}
export const alertMarker=(key:string)=>`<!-- oneul-review:${createHash("sha256").update(key).digest("hex")} -->`;
