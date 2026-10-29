// Isolated end-to-end check of anonymous workspaces using an in-memory D1 instance.
// It never calls a model provider and never touches the deployed Site database.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
const localRequire=createRequire(import.meta.url);
const wranglerRequire=createRequire(localRequire.resolve('wrangler/package.json'));
const {Miniflare}=wranglerRequire('miniflare');
const remote=process.env.LESSONBENCH_TEST_URL;
let mf;
try {
 if(!remote){const files=await readdir('dist/server',{recursive:true});const modules=['index.js',...files.filter(f=>typeof f==='string'&&f.endsWith('.js')&&f!=='index.js')].map(path=>({type:'ESModule',path:resolve('dist/server',path)}));mf=new Miniflare({modules,modulesRoot:resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'test-workspace-db'},bindings:{LESSONBENCH_PUBLIC_MODE:'1',DEEPSEEK_API_KEY:'fake-env-key',DASHSCOPE_API_KEY:'fake-env-key'}});const db=await mf.getD1Database('DB');const schema=await readFile('drizzle/0000_clumsy_agent_brand.sql','utf8');for(const sql of schema.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();}
 async function call(path,{method='GET',body,cookie}={}){const headers={...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{})};const options={method,headers,...(body?{body:JSON.stringify(body)}:{})};const res=remote?await fetch(remote+'/api/'+path,options):await mf.dispatchFetch('http://localhost/api/'+path,options);return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};}
 const a=await call('bootstrap',{method:'POST',body:{}}),b=await call('bootstrap',{method:'POST',body:{}});assert.equal(a.status,200);assert.equal(b.status,200);assert.notEqual(a.cookie,b.cookie);
 const A=(path,options={})=>call(path,{...options,cookie:a.cookie});const B=(path,options={})=>call(path,{...options,cookie:b.cookie});
 const dash=(await A('dashboard')).data;const bcfg=dash.providers.map(p=>p.id==='xai'?p:({...p,baseUrl:'https://api.b.ai/v1',model:p.id==='qwen'?'qwen3.8-flash':p.model}));assert.equal((await A('providers',{method:'POST',body:{providers:bcfg}})).status,200);assert.notEqual((await A('dashboard')).data.providers[0].baseUrl,(await B('dashboard')).data.providers[0].baseUrl);
 assert.ok((await A('dashboard')).data.providers.every(p=>!p.configured));
 const noKey=await A('runs',{method:'POST',body:{name:'未提供密钥',mode:'live',caseIds:['EDU-001'],providerIds:['deepseek','qwen'],temperature:.3,maxTokens:2048,judge:false,requestId:randomUUID()}});assert.equal(noKey.status,400);
 const created=await A('runs',{method:'POST',body:{name:'隔离测试',mode:'demo',caseIds:['EDU-001'],providerIds:['deepseek','qwen'],temperature:.3,maxTokens:2048,judge:false,requestId:randomUUID()}});assert.equal(created.status,201);const id=created.data.id;
 assert.equal((await A('runs/'+id)).status,200);assert.equal((await B('runs/'+id)).status,403);assert.equal((await B('runs/'+id+'/report')).status,403);assert.equal((await B('runs/'+id+'/step',{method:'POST',body:{keys:{}}})).status,403);
 assert.equal((await A('runs/'+id+'/step',{method:'POST',body:{keys:{}}})).status,200);const detail=(await A('runs/'+id)).data;assert.equal(detail.summary.success,2);
 const share=await A('runs/'+id+'/share');assert.equal(share.status,200);const token=share.data.token;assert.equal((await B('blind/next',{method:'POST',body:{runId:id}})).status,403);assert.equal((await B('review-runs')).data.some(x=>x.id===id),false);
 const reportGrant=await A('runs/'+id+'/report-share');assert.equal(reportGrant.status,200);const reportParams=t=>'shared-report?'+new URLSearchParams({run:id,share:t});assert.equal((await B(reportParams(''))).status,403);assert.equal((await B(reportParams(token))).status,403);const sharedReport=await B(reportParams(reportGrant.data.token));assert.equal(sharedReport.status,200);assert.equal(sharedReport.data.results,undefined);assert.equal(sharedReport.data.reviews,undefined);assert.equal(sharedReport.data.summary.success,2);
 const invited=await B('review-runs?'+new URLSearchParams({run:id,share:token}));assert.equal(invited.data.some(x=>x.id===id),true);
 const pair=await B('blind/next',{method:'POST',body:{runId:id,shareToken:token}});assert.equal(pair.status,200);assert.ok(pair.data.A&&pair.data.B);assert.equal('provider' in pair.data,false);assert.equal('left_id' in pair.data,false);
 const ratings=Object.fromEntries(['accuracy','pedagogy','instruction','clarity','safety'].map(x=>[x,4]));const vote={vote:'A',ratings:{A:ratings,B:ratings},comment:'基于内容质量进行比较'};
 assert.equal((await B('blind/'+pair.data.id,{method:'POST',body:vote})).status,403);assert.equal((await B('blind/'+pair.data.id,{method:'POST',body:{...vote,shareToken:token}})).status,200);assert.equal((await A('runs/'+id)).data.summary.reviewCount,1);
 assert.equal((await B('dashboard')).data.runs.some(x=>x.id===id),false);
 const template={title:'自定义隔离题目',task:'lesson',subject:'数学',grade:'五年级',difficulty:'基础',prompt:'请设计一份包含活动与作业的完整小学数学课堂教案。',reference:'包含正确计算、练习与评价。',keywords:[['数学']],tags:[],sectionCount:3,minutes:40,assessmentCount:1};
 const custom=await A('cases',{method:'POST',body:{cases:[template]}});assert.equal(custom.status,201);const caseId=custom.data.created[0].id;assert.equal((await A('cases')).data.some(x=>x.id===caseId),true);assert.equal((await B('cases')).data.some(x=>x.id===caseId),false);
 const forbidden=await B('runs',{method:'POST',body:{name:'跨会话题目',mode:'demo',caseIds:[caseId],providerIds:['deepseek','qwen'],temperature:.3,maxTokens:2048,judge:false,requestId:randomUUID()}});assert.equal(forbidden.status,400);
 console.log('PASS: anonymous sessions, settings, custom cases, run isolation, share-only blind review and submission');
} finally {if(mf)await mf.dispose();}
