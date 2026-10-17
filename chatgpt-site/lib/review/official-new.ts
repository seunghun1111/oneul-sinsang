type NewItem={brand:string;sourceUrl:string;reviewEvidence?:{sourceUrl?:string;officialNewListing?:string}};
/** Only the verified Kyochon new-menu tab is an accepted listing exception. */
export function hasOfficialNewTab(product:NewItem){
 return product.brand==="교촌치킨"&&product.sourceUrl==="https://www.kyochon.com/menu/chicken.asp?code=21"
  &&product.reviewEvidence?.sourceUrl===product.sourceUrl&&product.reviewEvidence.officialNewListing==="kyochon_code_21";
}
