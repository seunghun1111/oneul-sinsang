import {collectionFetch} from "./collection-http.ts";
import {parsePulmuoneDetail} from "../../chatgpt-site/lib/collectors/pulmuone.ts";
import {parseOrionDetail} from "../../chatgpt-site/lib/collectors/orion.ts";
import {parseMaeilDetail} from "../../chatgpt-site/lib/collectors/maeil.ts";
import {parseSamyangDetail} from "../../chatgpt-site/lib/collectors/samyang.ts";
import {parseBinggraeDetail} from "../../chatgpt-site/lib/collectors/binggrae.ts";
import {normalizeProductName} from "../../src/lib/normalize-product-name.ts";
import {robotsAllows} from "./manual-brand-collector.ts";
import type {Product} from "../../src/types/product.ts";

const sources:Record<string,{host:string;path:string;key:string;parse:typeof parsePulmuoneDetail|typeof parseOrionDetail|typeof parseMaeilDetail|typeof parseSamyangDetail|typeof parseBinggraeDetail}>={
  "풀무원":{host:"news.pulmuone.co.kr",path:"/pulmuone/newsroom/viewNewsroom.do",key:"id",parse:parsePulmuoneDetail},
  "오리온":{host:"www.orionworld.com",path:"/board/view/87",key:"boardno",parse:parseOrionDetail},
  "매일유업":{host:"www.maeil.com",path:"/news/press_view.jsp",key:"idx",parse:parseMaeilDetail},
  "삼양식품":{host:"samyangfoods.com",path:"/kor/publicity/press/view.do",key:"seq",parse:parseSamyangDetail},
  "빙그레":{host:"www.bing.co.kr",path:"/news/news_announced_view",key:"anno_idx",parse:parseBinggraeDetail},
};

function sourceFor(product:Product) {
  const source=sources[product.brand];
  if(!source||product.sourceType!=="press_release")return null;
  try {
    const url=new URL(product.sourceUrl);
    return url.protocol==="https:"&&!url.username&&!url.password&&!url.port&&url.hostname===source.host&&url.pathname===source.path&&/^\d+$/.test(url.searchParams.get(source.key)??"")?{...source,url}:null;
  }catch{return null;}
}

function plain(value:string) {
  const named:Record<string,string>={amp:"&",quot:'"',apos:"'",nbsp:" ",lt:"<",gt:">",lsquo:"‘",rsquo:"’",ldquo:"“",rdquo:"”",hellip:"…",middot:"·"};
  return value.replace(/<[^>]*>/g," ").replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi,(entity,code:string)=>{
    if(!code.startsWith("#"))return named[code.toLowerCase()]??entity;
    const n=code[1]?.toLowerCase()==="x"?parseInt(code.slice(2),16):parseInt(code.slice(1),10);
    return Number.isFinite(n)&&n>=0&&n<=0x10ffff?String.fromCodePoint(n):entity;
  }).replace(/\s+/g," ").trim();
}

// Metadata is read from the article itself, never from an old product date or URL filename.
export function recheckPressArticle(product:Product,html:string) {
  const source=sourceFor(product);if(!source)return null;
  let title="",date="";
  if(product.brand==="풀무원") {
    const heading=html.match(/<div\s+class=["']news_titwrap02["'][^>]*>([\s\S]*?)<div\s+class=["']news_cnt["']/)?.[1]??"";
    title=plain(heading.match(/<div\s+class=["']news_intit["'][^>]*>[\s\S]*?<h1>([\s\S]*?)<\/h1>/)?.[1]??"");
    const parts=heading.match(/<div\s+class=["']news_indata["'][^>]*>[\s\S]*?(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    if(parts)date=`${parts[1]}-${parts[2].padStart(2,"0")}-${parts[3].padStart(2,"0")}`;
  }else {
    const patterns:Record<string,[RegExp,RegExp]>={
      "오리온":[/<h4>([\s\S]*?)<\/h4>/,/<p\s+class=["']date["'][^>]*>[\s\S]*?(\d{4}-\d{2}-\d{2})\s*<\/p>/],
      "매일유업":[/<h1\s+class=["']h wBk["'][^>]*>([\s\S]*?)<\/h1>/i,/<p\s+class=["']data["'][^>]*>\s*(\d{4}\.\d{2}\.\d{2})/i],
      "삼양식품":[/<p\s+class=["']title["'][^>]*>([\s\S]*?)<\/p>/,/<p\s+class=["']date["'][^>]*>\s*(\d{4}\.\d{2}\.\d{2})\s*<\/p>/],
      "빙그레":[/<span\s+class=["']tit["'][^>]*>([\s\S]*?)<\/span>/,/<p\s+class=["']date["'][^>]*>\s*(\d{4}-\d{2}-\d{2})\s*<\/p>/],
    };
    const [titlePattern,datePattern]=patterns[product.brand];
    title=plain(html.match(titlePattern)?.[1]??"");date=(html.match(datePattern)?.[1]??"").replaceAll(".","-");
  }
  if(!title||!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
  const timestamp=Date.parse(date+"T00:00:00Z");
  if(!Number.isFinite(timestamp)||new Date(timestamp).toISOString().slice(0,10)!==date)return null;
  const parsed=source.parse(html,{id:source.url.searchParams.get(source.key)!,title,date,url:product.sourceUrl});
  return parsed&&normalizeProductName(parsed.name)===normalizeProductName(product.name)?parsed:null;
}

async function boundedText(response:Response) {
  if(!response.body)throw Error("empty_response");
  const reader=response.body.getReader(),decoder=new TextDecoder();let bytes=0,text="";
  try {
    while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>1_500_000){await reader.cancel();throw Error("response_too_large");}text+=decoder.decode(chunk.value,{stream:true});}
    return text+decoder.decode();
  }finally{reader.releaseLock();}
}

export function createPressRechecker(fetcher:typeof fetch=collectionFetch) {
  const policies=new Map<string,{text:string;state:"allowed"|"not_provided"}>();
  const init={redirect:"manual" as const,headers:{"user-agent":"OneulSinsang/1.0 (+non-commercial product index)"}};
  return async(product:Product)=>{
    const source=sourceFor(product);if(!source)throw Error("unsupported_source");
    let policy=policies.get(source.url.origin);
    if(!policy){
      const response=await fetcher(source.url.origin+"/robots.txt",{...init,signal:AbortSignal.timeout(15000)});
      if(response.ok){const text=await boundedText(response);if(/<html|<!doctype/i.test(text))throw Error("invalid_policy");policy={text,state:"allowed"};}
      else if([404,410].includes(response.status))policy={text:"",state:"not_provided"};
      else throw Error("policy_unavailable");
      policies.set(source.url.origin,policy);
    }
    if(!robotsAllows(policy.text,product.sourceUrl))throw Error("policy_restricted");
    const response=await fetcher(product.sourceUrl,{...init,signal:AbortSignal.timeout(15000)});
    if(!response.ok||!response.headers.get("content-type")?.includes("text/html"))throw Error("source_unavailable");
    const candidate=recheckPressArticle(product,await boundedText(response));
    if(!candidate)return null;
    return {...candidate,reviewEvidence:{...candidate.reviewEvidence,robots:policy.state}};
  };
}
