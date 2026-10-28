import {z} from 'zod';
import * as s from '@/lib/eval/server';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {PUBLIC_RUN_ID,isOwner,publicRouteAllowed} from '@/lib/eval/access';
export const dynamic='force-dynamic';
async function handle(request:Request){
 const url=new URL(request.url),path=url.pathname.replace(/^\/api\//,'').split('/');
 const cookie=request.headers.get('cookie')?.match(/(?:^|;\s*)lb_reviewer=([a-f0-9-]{36})(?:;|$)/)?.[1];const reviewer=cookie||crypto.randomUUID();
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
 const user=publicMode?await getChatGPTUser():null;
 const admin=isOwner(publicMode,vars.LESSONBENCH_OWNER_EMAIL,user?.email);
 if(path[0]==='access'&&request.method==='GET')return json({publicMode,admin});
 const visitor=publicMode&&!admin;
 if(visitor&&!publicRouteAllowed(request.method,path,data))throw new s.HttpError(403,'公开演示仅展示样例；管理员登录后可管理实验');
 if(path[0]==='health')return json({ok:true,app:'LessonBench',version:'1.0.0'});
  if(request.method==='POST'){
   if(path[0]==='bootstrap'){await s.bootstrap();return json({ok:true});}
   if(path[0]==='cases')return json(await s.addCases(data.cases),201);
   if(path[0]==='providers'&&path[1]==='test')return json(await s.testProvider(data));
   if(path[0]==='providers')return json(await s.saveProviders(data.providers));
   if(path[0]==='runs'&&!path[1])return json(await s.createRun(data),201);
   if(path[0]==='runs'&&path[2]==='step')return json(await s.runStep(path[1],data.keys||{}));
   if(path[0]==='runs'&&path[2]==='control')return json(await s.controlRun(path[1],data.action));
   if(path[0]==='blind'&&path[1]==='next')return json(await s.nextBlind(data.runId,reviewer));
   if(path[0]==='blind'&&path[1])return json(await s.submitBlind(path[1],reviewer,data,visitor?PUBLIC_RUN_ID:undefined));
  }else if(request.method==='GET'){
   if(path[0]==='review-runs'){const runs=await s.reviewRuns(reviewer);return json(visitor?runs.filter(r=>r.id===PUBLIC_RUN_ID):runs);}
   if(path[0]==='dashboard')return json({...await (visitor?s.publicDashboard():s.dashboard()),access:{publicMode,admin}});
   if(path[0]==='cases')return json(await (visitor?s.publicCases():s.allCases()));
   if(path[0]==='runs'&&path[1]){
    const detail=visitor?await s.publicRunDetail():await s.runDetail(path[1]);
    if(path[2]==='report'){
     const format=url.searchParams.get('format')||'md';let text:string,type:string;
     if(format==='json'){text=JSON.stringify(detail,null,2);type='application/json';}
     else if(format==='csv'){const escape=(v:any)=>{let t=String(v??'');if(/^[=+\-@\t\r]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"';};const table=[['case_id','provider','source','status','rule_score','judge_score','latency_ms','total_tokens','estimated_cost_cny','error'],...detail.results.map((r:any)=>[r.case_id,r.provider,r.data?.source,r.status,r.data?.rules.score,r.data?.judge?.score,r.data?.record?.latencyMs,r.data?.record?.usage?.total_tokens,r.data?.record?.estimatedCost,r.error||r.data?.judgeError])];text='\ufeff'+table.map(row=>row.map(escape).join(',')).join('\r\n');type='text/csv';}
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
