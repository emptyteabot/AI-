import {mkdir,writeFile} from 'node:fs/promises';
const args=process.argv.slice(2);const arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const base=arg('--url','http://localhost:5173').replace(/\/$/,'');
const endpoint=new URL(base);if(endpoint.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(endpoint.hostname))throw new Error('Use HTTPS, or loopback for local development.');
const live=args.includes('--live'),judge=live&&args.includes('--judge');
const keys={};
const selectedProviders=arg('--providers','deepseek,qwen,glm').split(',').map(x=>x.trim());
if(new Set(selectedProviders).size!==selectedProviders.length||selectedProviders.length<2||selectedProviders.some(x=>!['deepseek','qwen','glm','openai'].includes(x)))throw new Error('Choose 2–4 unique providers from deepseek,qwen,glm,openai.');
const auth=process.env.LESSONBENCH_SERVICE_TOKEN;
async function call(p,body){const r=await fetch(base+'/api/'+p,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(auth?{'OAI-Sites-Authorization':'Bearer '+auth}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(230000)});const data=await r.json();if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);return data;}
await call('bootstrap',{});
let id=arg('--run',null);
if(live){const configs=id?(await call('runs/'+id)).run.config.providers:(await call('dashboard')).providers.filter(p=>selectedProviders.includes(p.id));for(const p of configs){const base=p.baseUrl.replace(/\/$/,'');const envName=base==='https://api.b.ai/v1'?'BAI_API_KEY':base==='https://api.siliconflow.cn/v1'?'SILICONFLOW_API_KEY':p.envKey;keys[p.id]=process.env[envName]||'';}}
if(!id){let cases=await call('cases');const task=arg('--task',null);if(task)cases=cases.filter(c=>c.task===task);const limit=Number(arg('--limit',cases.length));cases=cases.slice(0,limit);const planned=cases.length*selectedProviders.length*(judge?2:1);const max=Number(arg('--max-calls','150'));if(!cases.length||planned>max)throw new Error(`Planned ${planned} generation/judge calls exceeds --max-calls ${max}, or no cases selected.`);
 const r=await call('runs',{name:arg('--name',live?'三厂商真实教育评测':'CLI 流程验收 · 演示'),mode:live?'live':'demo',caseIds:cases.map(c=>c.id),providerIds:selectedProviders,temperature:.3,maxTokens:Number(arg('--max-tokens','4096')),judge,keys,requestId:crypto.randomUUID()});id=r.id;console.log('Experiment:',id,'planned calls:',planned,'(network retries may add calls)');
}
let detail=await call('runs/'+id);if(detail.run.status==='paused')await call(`runs/${id}/control`,{action:'resume'});
while(['queued','running','paused'].includes(detail.run.status)){await call(`runs/${id}/step`,{keys});detail=await call('runs/'+id);console.log(`${detail.summary.completed}/${detail.summary.total} · ${detail.run.status} · failed=${detail.summary.failed}`);}
const output=arg('--output','outputs/evaluation');await mkdir(output,{recursive:true});
for(const format of ['md','json','csv']){const r=await fetch(`${base}/api/runs/${id}/report?format=${format}`,{headers:auth?{'OAI-Sites-Authorization':'Bearer '+auth}:{}});if(!r.ok)throw new Error(`Report export failed: ${r.status}`);await writeFile(`${output}/${id}.${format}`,await r.text());}
console.log('Saved report, raw results and CSV to',output);if(detail.run.status!=='completed')process.exitCode=2;
