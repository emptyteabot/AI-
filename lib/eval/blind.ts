const j=(v:any)=>typeof v==='string'?JSON.parse(v):v;
export function blindPayload(pair:any,a:any,b:any,mode:string){const c=j(a.snapshot);return {id:pair.id,caseId:c.id,title:c.title,task:c.task,grade:c.grade,subject:c.subject,prompt:c.prompt,reference:c.reference,mode,A:j(a.data).text,B:j(b.data).text};}
