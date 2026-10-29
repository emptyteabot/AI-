// Boots the production Node/SQLite build with a disposable database and runs anonymous isolation checks.
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=await mkdtemp(join(tmpdir(),'lessonbench-test-'));
const port=String(43000+Math.floor(Math.random()*1000));
const env={...process.env,LESSONBENCH_PUBLIC_MODE:'1',LESSONBENCH_DB_FILE:join(dir,'test.sqlite'),DEEPSEEK_API_KEY:'fake-env-key',DASHSCOPE_API_KEY:'fake-env-key',NEXT_TELEMETRY_DISABLED:'1'};
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',port],{env,stdio:['ignore','pipe','pipe']});
let log='';server.stdout.on('data',x=>{log+=x});server.stderr.on('data',x=>{log+=x});
try{
 let ready=false;for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error('Node server exited: '+log);try{const r=await fetch(`http://127.0.0.1:${port}/api/health`,{signal:AbortSignal.timeout(1000)});if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}if(!ready)throw Error('Node server did not become ready: '+log);
 const test=spawn(process.execPath,['tests/anonymous-integration.mjs'],{env:{...env,LESSONBENCH_TEST_URL:`http://127.0.0.1:${port}`},stdio:'inherit'});
 const code=await new Promise((resolve,reject)=>{test.on('exit',resolve);test.on('error',reject)});if(code!==0)throw Error(`Node integration tests failed (${code})`);console.log('PASS: production Node server and persistent SQLite adapter');
}finally{server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));await rm(dir,{recursive:true,force:true});}
