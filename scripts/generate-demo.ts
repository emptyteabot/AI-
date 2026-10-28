import {EXTENSION} from '../lib/eval/extension.ts';
import {mkdirSync,writeFileSync} from 'node:fs';
import {BENCHMARK,BENCHMARK_VERSION,demoAnswer} from '../lib/eval/benchmark.ts';
import {BASELINE_PROVIDERS} from '../lib/eval/providers.ts';
import {evaluateRules,digest,RUBRIC_VERSION} from '../lib/eval/scoring.ts';
import {summarize,reportMarkdown} from '../lib/eval/report.ts';
const date=new Date().toISOString();
const run={id:'demo-baseline-v1',name:'教育内容基础评测 · 演示',mode:'demo',status:'completed',config:{caseIds:BENCHMARK.map(c=>c.id),providers:BASELINE_PROVIDERS,temperature:.3,maxTokens:4096,judge:false,rubricVersion:RUBRIC_VERSION,benchmarkVersion:BENCHMARK_VERSION,concurrency:3},dataset_hash:await digest(BENCHMARK),created_at:date,updated_at:date};
const results=[];
for(const c of BENCHMARK)for(const [i,p]of BASELINE_PROVIDERS.entries()){const text=demoAnswer(c,i);results.push({id:`fixture-${c.id}-${p.id}`,run_id:run.id,case_id:c.id,provider:p.id,status:'success',snapshot:c,attempts:0,error:null,created_at:date,updated_at:date,data:{source:'fixture-v1',text,rules:evaluateRules(text,c),judge:null,judgeError:null,record:null,promptHash:await digest(c.prompt),note:'本地执行规则评分；人工编写的流程样例，不是厂商API输出。'}});}
const detail={run,results,summary:summarize(run,results,[]),reviews:[]};
mkdirSync('docs/evidence',{recursive:true});
writeFileSync('docs/Benchmark.json',JSON.stringify(BENCHMARK,null,2));
writeFileSync('docs/Benchmark_Extension.json',JSON.stringify(EXTENSION,null,2));
writeFileSync('docs/evidence/Demo_Raw_Results.json',JSON.stringify(detail,null,2));
writeFileSync('docs/evidence/Demo_Evaluation_Report.md',reportMarkdown(detail));
writeFileSync('docs/evidence/Demo_Scores.csv','\ufeffcase_id,channel,source,rule_score,all_checks_passed\r\n'+results.map(r=>[r.case_id,r.provider,r.data.source,r.data.rules.score,r.data.rules.passed].join(',')).join('\r\n'));
console.log(JSON.stringify(detail.summary,null,2));
