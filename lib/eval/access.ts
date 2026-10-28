export const PUBLIC_RUN_ID='demo-baseline-v1';
export function isOwner(publicMode:boolean,ownerEmail:string|undefined,userEmail:string|undefined):boolean {
 if(!publicMode)return true;
 return !!ownerEmail&&!!userEmail&&ownerEmail.trim().toLowerCase()===userEmail.trim().toLowerCase();
}
export function publicRouteAllowed(method:string,path:string[],body:any):boolean {
 if(method==='GET'){
  if(['health','access','dashboard','cases','review-runs'].includes(path[0]))return true;
  return path[0]==='runs'&&path[1]===PUBLIC_RUN_ID;
 }
 if(method==='POST'){
  if(path[0]==='bootstrap')return true;
  if(path[0]==='blind'&&path[1]==='next')return body?.runId===PUBLIC_RUN_ID;
  if(path[0]==='blind'&&path[1])return true; // Submission is additionally constrained to PUBLIC_RUN_ID in SQL.
 }
 return false;
}
