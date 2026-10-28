import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import path from 'node:path';
const root=process.cwd();
function run(args){const r=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
// The clean distribution uses the starter's portable profile on all platforms.
if(!process.env.SITES_MANAGED_LINUX_CONTAINER){mkdirSync('.sites-runtime',{recursive:true});writeFileSync('.sites-runtime/execution-profile.json',JSON.stringify({executionProfile:'portable'}));}
run(['scripts/run-framework.mjs','build']);
const config=JSON.parse(readFileSync('dist/server/wrangler.json','utf8'));
config.d1_databases=config.d1_databases.map(x=>({...x,migrations_dir:path.resolve('drizzle')}));
writeFileSync('dist/server/wrangler.local.json',JSON.stringify(config,null,2));
run(['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','DB','--local','--config','dist/server/wrangler.local.json','--persist-to','.wrangler/state']);
console.log('Local database ready. Run npm run dev and open http://localhost:5173.');
