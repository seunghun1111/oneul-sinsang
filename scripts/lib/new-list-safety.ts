import type {BrandCollectionStatus} from "./brand-collection-run.ts";
type Existing={brand:string;isActive:boolean};
type Candidate={brand:string};
export function safeNewListBrands(existing:Existing[],candidates:Candidate[],checkedBrands:string[]) {
  const active=new Set(existing.filter(product=>product.isActive).map(product=>product.brand));
  const observed=new Set(candidates.map(product=>product.brand));
  // HTTP success and page headings alone cannot prove an existing NEW list is now empty.
  return checkedBrands.filter(brand=>!active.has(brand)||observed.has(brand));
}
export function guardEmptyNewLists(existing:Existing[],candidates:Candidate[],report:{checkedAt:string;results:BrandCollectionStatus[]},previous:BrandCollectionStatus[]=[]) {
  const checked=report.results.filter(result=>result.status==="success").map(result=>result.brand);
  const safe=new Set(safeNewListBrands(existing,candidates,checked));
  return {...report,results:report.results.map(result=>{
    if(result.status!=="success"||safe.has(result.brand)) return result;
    const prior=previous.find(item=>item.brand===result.brand);
    return {...result,status:"failed" as const,reasonCode:"unexpected_empty" as const,
      failureSince:prior?.status==="failed"&&prior.failureSince?prior.failureSince:report.checkedAt};
  })};
}
