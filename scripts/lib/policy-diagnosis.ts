/** Diagnose public robots responses without interpreting a failed policy as permission. */
export function diagnosePolicyResponse(response:{status:number;contentType:string|null;location:string|null},origin:string){
 const {status,contentType,location}=response;
 if(status>=300&&status<400){
  if(!location)return {status:"invalid_redirect",httpStatus:status};
  try{const target=new URL(location??"",origin);return {status:target.pathname==="/"?"homepage_redirect":"policy_redirect",httpStatus:status};}catch{return {status:"invalid_redirect",httpStatus:status};}
 }
 if(status===404||status===410)return {status:"not_provided",httpStatus:status};
 if(status===401||status===403)return {status:"access_denied",httpStatus:status};
 if(status<200||status>=300)return {status:"http_error",httpStatus:status};
 if(contentType&&!/text\/plain|application\/octet-stream/i.test(contentType))return {status:"invalid_content_type",httpStatus:status};
 return {status:"body_verification_required",httpStatus:status};
}
