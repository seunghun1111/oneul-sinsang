type Group={agents:string[];rules:{allow:boolean;pattern:string}[]};
export function robotsAllows(text:string,url:string,userAgent="OneulSinsang/1.0") {
  const groups:Group[]=[];let group:Group={agents:[],rules:[]},hasDirectives=false;
  for(const raw of text.split(/\r?\n/)){
    const line=raw.replace(/#.*$/,"").trim(),index=line.indexOf(":");if(index<0)continue;
    const key=line.slice(0,index).trim().toLowerCase(),value=line.slice(index+1).trim();
    if(key==="user-agent"){
      if(hasDirectives){groups.push(group);group={agents:[],rules:[]};hasDirectives=false;}
      group.agents.push(value.toLowerCase());
    }else if(["allow","disallow"].includes(key)&&group.agents.length){hasDirectives=true;if(value)group.rules.push({allow:key==="allow",pattern:value});}
  }
  groups.push(group);
  const score=(g:Group)=>Math.max(0,...g.agents.filter(a=>a!=="*"&&userAgent.toLowerCase().includes(a)).map(a=>a.length));
  const best=Math.max(0,...groups.map(score));
  const applicable=groups.filter(g=>best?score(g)===best:g.agents.includes("*"));
  const u=new URL(url),target=u.pathname+u.search;
  const matches=applicable.flatMap(g=>g.rules).filter(rule=>{
    const end=rule.pattern.endsWith("$");const pattern=end?rule.pattern.slice(0,-1):rule.pattern;
    const escaped=pattern.split("*").map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join(".*");
    return new RegExp("^"+escaped+(end?"$":"")).test(target);
  }).sort((a,b)=>b.pattern.replace(/[*$]/g,"").length-a.pattern.replace(/[*$]/g,"").length||Number(b.allow)-Number(a.allow));
  return matches[0]?.allow??true;
}
