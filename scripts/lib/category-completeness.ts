import type {CuCategoryCheck} from "./cu-collector.ts";
export type CategoryIssue={label:string;reason:string;failureSince:string};
/** A completeness failure is never evidence that missing products lost NEW. */
export function categoryCompleteness(existing:{brand:string;subCategory?:string;isActive:boolean;newStatus?:string}[],checks:CuCategoryCheck[],checkedAt:string,previous:CategoryIssue[]=[]){
 const issues:CategoryIssue[]=[];
 for(const check of checks){
  const baseline=existing.filter(product=>product.brand==="CU"&&product.isActive&&product.newStatus!=="removed"&&product.subCategory===check.label).length;
  const reason=!check.complete?check.reason??"incomplete":baseline>0&&check.newCount===0?"unexpected_empty":baseline>=10&&check.newCount<baseline*.5?"sharp_drop":undefined;
  if(reason)issues.push({label:check.label,reason,failureSince:previous.find(item=>item.label===check.label&&item.reason===reason)?.failureSince??checkedAt});
 }
 return {issues,verifiedCategories:new Set(checks.filter(check=>check.complete&&!issues.some(issue=>issue.label===check.label)).map(check=>check.label))};
}
