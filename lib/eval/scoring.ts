import {z} from 'zod';
import type {BenchmarkCase,ModelAnswer,RuleCheck,RuleResult} from './types.ts';
import {DIMENSIONS} from './types.ts';
export const RUBRIC_VERSION='edu-rubric-v1.1';
const nonempty=z.string().trim().min(1);
export const answerSchema=z.object({title:nonempty,objectives:z.array(nonempty),content:z.array(z.object({heading:nonempty,text:nonempty,minutes:z.number().optional()})),assessment:z.array(z.object({question:nonempty,answer:nonempty,explanation:nonempty})),differentiation:z.string(),safety_note:z.string()});
export function parseAnswer(text:string):ModelAnswer|null {try{const value=JSON.parse(text.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));const result=answerSchema.safeParse(value);return result.success?result.data:null;}catch{return null;}}
export function evaluateRules(text:string,c:BenchmarkCase):RuleResult {
 let strict=false;try{strict=answerSchema.safeParse(JSON.parse(text)).success;}catch{}
 const a=parseAnswer(text);const sum=a?.content.reduce((s,x)=>s+(x.minutes||0),0)||0;
 const count=a?.content.length||0;const found=c.keywords.filter(terms=>terms.some(t=>text.toLowerCase().includes(t.toLowerCase())));
 const checks:RuleCheck[]=[
 {id:'schema',label:'JSON 字段与类型',weight:15,passed:strict,evidence:strict?'严格 JSON 与字段类型校验通过':'不是严格 JSON 或存在必需字段类型错误'},
 {id:'structure',label:c.minutes?'环节数量与总课时':'内容数量',weight:25,passed:!!a&&count===c.sectionCount&&(!c.minutes||(sum===c.minutes&&a.content.every(x=>Number.isInteger(x.minutes)&&(x.minutes||0)>0))),evidence:`要求 ${c.sectionCount} 项，实际 ${count} 项${c.minutes?`；总时长要求 ${c.minutes} 分钟，实际 ${sum} 分钟`:''}`},
 {id:'objectives',label:'目标与分层支持',weight:15,passed:!!a&&a.objectives.length>=2&&a.differentiation.trim().length>=15,evidence:!a?'无法解析':`${a.objectives.length} 条目标；分层支持 ${a.differentiation.trim().length} 字`},
 {id:'assessment',label:'检测题与解析完整性',weight:20,passed:!!a&&a.assessment.length===c.assessmentCount&&a.assessment.every(x=>x.explanation.trim().length>=10),evidence:`要求 ${c.assessmentCount} 题并附解释，实际 ${a?.assessment.length||0} 题`},
 {id:'keywords',label:'关键概念提及',weight:15,passed:found.length===c.keywords.length,evidence:`命中 ${found.length}/${c.keywords.length} 组参考词；仅检查提及，不判断事实正确性`},
 {id:'safety_note',label:'安全说明与手机号扫描',weight:10,passed:!!a&&a.safety_note.trim().length>=10&&!/(?<!\d)1[3-9]\d{9}(?!\d)/.test(text),evidence:'检查安全说明存在且未匹配大陆手机号模式；不等于完成语义安全审核'},
 ];
 if(c.tags.includes('零剧透')){
  const compact=text.toLowerCase().replace(/\s/g,'');
  const exclusion=/(?:k(?:≠|!=|!==|不等于|不能等于|不为|排除)1|k-1(?:≠|!=|!==)0)/.test(compact);
  const interval=/[（(]0[,，]1[)）].{0,12}[∪u或].{0,12}[（(]1[,，](?:\+?∞|\+?infinity)[)）]/.test(compact);
  const leak=exclusion||interval;
  checks.push({id:'answer_leak',label:'启发式答疑：直接泄露条件',weight:0,passed:!leak,evidence:leak?'命中直接排除条件或完整答案的常见表达，需人工复核':'未命中常见泄露表达；不能证明未以其他方式泄露，仍需人工复核'});
 }
 return {score:checks.reduce((s,c)=>s+(c.passed?c.weight:0),0),passed:checks.every(c=>c.passed),checks,version:RUBRIC_VERSION};
}
export const judgeSchema=z.object({evidence:z.string().min(10),scores:z.object({accuracy:z.number().int().min(1).max(5),pedagogy:z.number().int().min(1).max(5),instruction:z.number().int().min(1).max(5),clarity:z.number().int().min(1).max(5),safety:z.number().int().min(1).max(5)}),issues:z.array(z.string()),needsHuman:z.boolean()});
export function weightedScore(scores:Record<string,number>):number{return Math.round(DIMENSIONS.reduce((s,d)=>s+(scores[d.id]-1)/4*d.weight*100,0)*10)/10;}
export function mean(xs:number[]):number|null{return xs.length?Math.round(xs.reduce((a,b)=>a+b,0)/xs.length*10)/10:null;}
export function percentile(xs:number[],p:number):number|null {if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.ceil(a.length*p)-1)];}
export function wilson(wins:number,n:number):[number,number]|null {if(!n)return null;const z=1.96,p=wins/n,center=(p+z*z/(2*n))/(1+z*z/n),half=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/(1+z*z/n);return [Math.round((center-half)*1000)/10,Math.round((center+half)*1000)/10];}
export async function digest(value:unknown):Promise<string>{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,'0')).join('');}
