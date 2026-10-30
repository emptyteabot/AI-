import {z} from 'zod';
import * as s from '@/lib/eval/server';
import {env} from 'lessonbench-runtime';
import {PUBLIC_RUN_IDS,workspaceCookie} from '@/lib/eval/access';
export const dynamic='force-dynamic';
async function handle(request:Request){
 const url=new URL(request.url),path=url.pathname.replace(/^\/api\//,'').split('/');
 const cookie=workspaceCookie(request.headers.get('cookie'));const reviewer=cookie||crypto.randomUUID();
 const headers:Record<string,string>={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(!cookie)headers['Set-Cookie']=`lb_reviewer=${reviewer}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${url.protocol==='https:'?'; Secure':''}`;
 const json=(value:any,status=200)=>Response.json(value,{status,headers});
 try{
  let data:any={};if(request.method==='POST'){
   const origin=request.headers.get('origin');if(origin&&origin!==url.origin)throw new s.HttpError(403,'跨站写入被拒绝');
   const raw=await request.text();if(raw.length>2_000_000)throw new s.HttpError(413,'导入内容过大');try{data=raw?JSON.parse(raw):{};}catch{throw new s.HttpError(400,'JSON 无效');}
  }
  const vars=env as unknown as Record<string,string|undefined>;
 const publicMode=vars.LESSONBENCH_PUBLIC_MODE==='1';
 const workspace=publicMode?reviewer:undefined;
 if(path[0]==='access'&&request.method==='GET')return json({publicMode,anonymous:publicMode});
 if(workspace&&path[0]==='runs'&&path[1]){
  const readBaseline=request.method==='GET'&&PUBLIC_RUN_IDS.includes(path[1])&&path[2]!=='share';
  if(!readBaseline&&!await s.ownsRun(path[1],workspace))throw new s.HttpError(403,'该实验不属于当前浏览器工作区');
 }
 if(path[0]==='health')return json({ok:true,app:'LessonBench',version:'1.0.0'});
  if(request.method==='POST'){
   if(path[0]==='bootstrap'){await s.bootstrap();return json({ok:true});}
   if(path[0]==='cases')return json(await s.addCases(data.cases,workspace),201);
   if(path[0]==='providers'&&path[1]==='models')return json(await s.listBAIModels(data,workspace));
   if(path[0]==='providers'&&path[1]==='test')return json(await s.testProvider(data,workspace));
   if(path[0]==='providers')return json(await s.saveProviders(data.providers,workspace));
   if(path[0]==='runs'&&!path[1])return json(await s.createRun(data,workspace),201);
   if(path[0]==='runs'&&path[2]==='step')return json(await s.runStep(path[1],data.keys||{}));
   if(path[0]==='runs'&&path[2]==='control')return json(await s.controlRun(path[1],data.action));
   if(path[0]==='blind'&&path[1]==='next'){if(workspace&&!await s.canReviewRun(data.runId,workspace,data.shareToken))throw new s.HttpError(403,'盲评链接无效或已失效');return json(await s.nextBlind(data.runId,reviewer));}
   if(path[0]==='blind'&&path[1]){const runId=await s.reviewAssignmentRun(path[1],reviewer);if(!runId)throw new s.HttpError(409,'该任务不属于当前评审会话');if(workspace&&!await s.canReviewRun(runId,workspace,data.shareToken))throw new s.HttpError(403,'盲评链接无效或已失效');return json(await s.submitBlind(path[1],reviewer,data,runId));}
  }else if(request.method==='GET'){
   if(path[0]==='shared-report'||path[0]==='review-runs')await s.bootstrap();
   if(path[0]==='shared-report'){const id=url.searchParams.get('run')||'',token=url.searchParams.get('share')||'';if(!await s.canViewReport(id,token))throw new s.HttpError(403,'报告链接无效或已失效');const detail=PUBLIC_RUN_IDS.includes(id)?await s.publicRunDetail(id):await s.runDetail(id);return json({run:detail.run,summary:detail.summary});}
   if(path[0]==='review-runs'){const runId=url.searchParams.get('run')||'',token=url.searchParams.get('share')||'';const shared=workspace&&runId&&await s.canReviewRun(runId,workspace,token)?runId:undefined;return json(await s.reviewRuns(reviewer,workspace,shared));}
   if(path[0]==='dashboard')return json({...await s.dashboard(workspace),access:{publicMode,anonymous:publicMode}});
   if(path[0]==='cases')return json(await s.allCases(workspace));
   if(path[0]==='runs'&&path[1]){
    if(path[2]==='share'||path[2]==='report-share'){if(!workspace)throw new s.HttpError(400,'本地运行暂不提供分享链接');return json(path[2]==='share'?await s.reviewShare(path[1],workspace):await s.reportShare(path[1],workspace));}
    const detail=workspace&&PUBLIC_RUN_IDS.includes(path[1])?await s.publicRunDetail(path[1]):await s.runDetail(path[1]);
    if(path[2]==='report'){
     const format=url.searchParams.get('format')||'md';let text:string,type:string;
     if(format==='json'){text=JSON.stringify(detail,null,2);type='application/json';}
     else if(format==='csv'){const escape=(v:any)=>{let t=String(v??'');if(/^[=+\-@\t\r]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"';};const table=[['case_id','provider','source','status','rule_score','judge_score','latency_ms','total_tokens','estimated_cost_cny','error'],...detail.results.map((r:any)=>[r.case_id,r.provider,r.data?.source,r.status,r.data?.rules?.score,r.data?.judge?.score,r.data?.record?.latencyMs,r.data?.record?.usage?.total_tokens,r.data?.record?.estimatedCost,r.error||r.data?.judgeError])];text='\ufeff'+table.map(row=>row.map(escape).join(',')).join('\r\n');type='text/csv';}
     else{text=s.reportMarkdown(detail);type='text/markdown';}
     return new Response(text,{headers:{...headers,'Content-Type':type+'; charset=utf-8','Content-Disposition':`attachment; filename="LessonBench-${detail.run.mode}-${path[1]}.${['json','csv'].includes(format)?format:'md'}"`}});
    }
    return json(detail);
   }
  }
  throw new s.HttpError(404,'接口不存在');
 }catch(e){if(e instanceof z.ZodError)return json({error:'字段校验失败',details:e.issues.map(i=>`${i.path.join('.')}: ${i.message}`).slice(0,6)},400);if(e instanceof s.HttpError)return json({error:e.message},e.status);if((e as any).code)return json({error:`${(e as any).code}: ${(e as Error).message}`},400);console.error('LessonBench request failed:',(e as Error).message);return json({error:'服务暂时不可用，请检查数据库迁移或稍后重试'},500);}
}
export const GET=handle;
export const POST=handle;
