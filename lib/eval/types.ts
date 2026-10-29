export type ProviderId="deepseek"|"qwen"|"glm"|"openai"|"xai"|"anthropic";
export type TaskType="lesson"|"slides"|"exercise"|"feedback";
export interface BenchmarkCase {id:string;title:string;task:TaskType;subject:string;grade:string;difficulty:"基础"|"进阶"|"挑战";prompt:string;reference:string;keywords:string[][];tags:string[];sectionCount:number;minutes?:number;assessmentCount:number;version:string;source:string;}
export interface ProviderConfig {id:ProviderId;name:string;vendor:string;model:string;baseUrl:string;envKey:string;color:string;inputPrice:number|null;cachePrice:number|null;outputPrice:number|null;priceDate:string;}
export interface RunConfig {caseIds:string[];providers:ProviderConfig[];temperature:number;maxTokens:number;judge:boolean;rubricVersion:string;benchmarkVersion:string;concurrency:number;}
export interface RuleCheck {id:string;label:string;passed:boolean;weight:number;evidence:string}
export interface RuleResult {score:number;passed:boolean;checks:RuleCheck[];version:string}
export interface ModelAnswer {title:string;objectives:string[];content:{heading:string;text:string;minutes?:number}[];assessment:{question:string;answer:string;explanation:string}[];differentiation:string;safety_note:string;}
export interface CallRecord {text:string;model:string;responseId:string|null;finishReason:string|null;usage:{prompt_tokens?:number;completion_tokens?:number;total_tokens?:number;prompt_cache_hit_tokens?:number;prompt_cache_miss_tokens?:number;prompt_tokens_details?:{cached_tokens?:number};[k:string]:unknown}|null;latencyMs:number;attempts:number;estimatedCost:number|null;startedAt:string;endedAt:string;requestParameters?:Record<string,unknown>;}
export const DIMENSIONS=[
{id:"accuracy",name:"知识准确性",weight:0.3,description:"结论正确、无事实错误，明确知识边界"},
{id:"pedagogy",name:"教学适切性",weight:0.25,description:"符合学段，有支架与可执行的教学活动"},
{id:"instruction",name:"指令遵循",weight:0.2,description:"覆盖任务目标、格式、数量与时间约束"},
{id:"clarity",name:"表达与结构",weight:0.15,description:"层次清楚、表述简练，教师能直接使用"},
{id:"safety",name:"教育安全",weight:0.1,description:"保护隐私，无标签化、危险指导或歧视"},
] as const;
export const TASKS:Record<TaskType,{name:string;description:string;color:string}>={
lesson:{name:"教案写作",description:"目标、活动与课堂评价",color:"#d97757"},
slides:{name:"课件生成",description:"结构化课件与页面脚本",color:"#729585"},
exercise:{name:"习题生成",description:"分层题目、答案与解析",color:"#9a8cbe"},
feedback:{name:"作业反馈",description:"错因定位与引导式反馈",color:"#c79c55"},
};
