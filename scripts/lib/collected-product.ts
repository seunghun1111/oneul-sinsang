import type {Product} from "../../src/types/product.ts";

const blockedHosts=/(^|\.)(kakaocorp\.com|kakao\.com|daum\.net|daumcorp\.com|kakaosecure\.net|dakao\.io|9rum\.cc|onkakao\.net|daumkakao\.io|daumkakao\.com|daumtools\.com|localhost|local)$/i;

/** Shared by every brand at the two catalog persistence boundaries. No network requests. */
export function normalizeImageUrl(value:unknown,sourceUrl:string):string|undefined {
  if(typeof value!=="string"||!value.trim())return undefined;
  try {
    const url=new URL(value.trim().replace(/&amp;/g,"&"),sourceUrl);
    // Images are public assets, never credentials, executable/data URLs or internal hosts.
    if(url.protocol!=="https:"||url.username||url.password||url.port||blockedHosts.test(url.hostname)||url.hostname.includes(":")||/^\d+(?:\.\d+){3}$/.test(url.hostname)||!url.hostname.includes("."))return undefined;
    url.hash="";
    return url.href;
  }catch{return undefined;}
}

export function normalizeCollectedProduct(candidate:Product,previous?:Product):Product {
  const product={...candidate};
  delete product.price;
  // Press photographs remain excluded under the existing publication policy.
  const imageUrl=product.sourceType==="official_site"
    ?normalizeImageUrl(candidate.imageUrl,candidate.sourceUrl)??normalizeImageUrl(previous?.imageUrl,candidate.sourceUrl):undefined;
  delete product.imageUrl;
  if(imageUrl)product.imageUrl=imageUrl;
  if(previous){
    product.id=previous.id;
    product.firstDetectedAt=previous.firstDetectedAt;
    product.createdAt=previous.createdAt;
    if(previous.reviewStatus)product.reviewStatus=previous.reviewStatus;
    if(previous.reviewedAt)product.reviewedAt=previous.reviewedAt;
    if(previous.detectionKind)product.detectionKind=previous.detectionKind;
    if(previous.discoveryReferences&&!candidate.discoveryReferences)product.discoveryReferences=previous.discoveryReferences;
  }
  return product;
}

export function auditCollectedImages(products:Product[]) {
  const brands=new Map<string,{brand:string;officialProducts:number;withImage:number;missingImage:number}>();
  for(const product of products){
    if(!product.isActive||product.newStatus==="removed"||product.sourceType!=="official_site")continue;
    const row=brands.get(product.brand)??{brand:product.brand,officialProducts:0,withImage:0,missingImage:0};
    row.officialProducts++;
    if(normalizeImageUrl(product.imageUrl,product.sourceUrl))row.withImage++;else row.missingImage++;
    brands.set(product.brand,row);
  }
  return [...brands.values()].sort((a,b)=>a.brand.localeCompare(b.brand,"ko"));
}
