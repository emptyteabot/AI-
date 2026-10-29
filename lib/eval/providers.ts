import type {ProviderConfig,CallRecord,RunConfig} from './types.ts';
export const DEFAULT_PROVIDERS:ProviderConfig[]=[
 {id:'deepseek',name:'DeepSeek',vendor:'深度求索',model:'deepseek-flash',baseUrl:'https://api.deepseek.com',envKey:'DEEPSEEK_API_KEY',color:'#7285b8',inputPrice:null,cachePrice:null,outputPrice:null,priceDate:''},
 {id:'qwen',name:'Qwen',vendor:'阿里云百炼',model:'qwen-plus',baseUrl:'https://dashscope.aliyuncs.com/compatible-mode/v1',envKey:'DASHSCOPE_API_KEY',color:'#9c8bbd',inputPrice:null,cachePrice:null,outputPrice:null,priceDate:''},
 {id:'glm',name:'GLM',vendor:'智谱',model:'glm-4.7',baseUrl:'https://open.bigmodel.cn/api/paas/v4',envKey:'ZAI_API_KEY',color:'#729585',inputPrice:null,cachePrice:null,outputPrice:null,priceDate:''},
 {id:'openai',name:'OpenAI',vendor:'OpenAI',model:'gpt-6-luna',baseUrl:'https://api.openai.com/v1',envKey:'OPENAI_API_KEY',color:'#d0a46e',inputPrice:null,cachePrice:null,outputPrice:null,priceDate:''},
 {id:'xai',name:'Grok',vendor:'xAI',model:'grok-4.7',baseUrl:'https://api.x.ai/v1',envKey:'XAI_API_KEY',color:'#8d89aa',inputPrice:null,cachePrice:null,outputPrice:null,priceDate:''},
 {id:'anthropic',name:'Claude',vendor:'Anthropic',model:'claude-sonnet-4-6',baseUrl:'https://origincoder.com/v1',envKey:'ANTHROPIC_API_KEY',color:'#c78d74',inputPrice:null,cachePrice:null,outputPrice:null,priceDate:''},
];
export const BASELINE_PROVIDERS=DEFAULT_PROVIDERS.filter(p=>['deepseek','qwen','glm'].includes(p.id));
export function isSiliconFlow(p:ProviderConfig):boolean {try{const u=new URL(p.baseUrl);return u.protocol==='https:'&&u.hostname==='api.siliconflow.cn'&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash&&u.pathname.replace(/\/$/,'')==='/v1';}catch{return false;}}
export const SILICONFLOW_MODELS:Record<string,string>={deepseek:'deepseek-ai/DeepSeek-V3.2',qwen:'Qwen/Qwen3.5-4B',glm:'THUDM/GLM-4-9B-0414'};
export function isBAI(p:ProviderConfig):boolean {try{const u=new URL(p.baseUrl);return u.protocol==='https:'&&u.hostname==='api.b.ai'&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash&&u.pathname.replace(/\/$/,'')==='/v1';}catch{return false;}}
export const BAI_MODELS:Record<string,string>={deepseek:'DeepSeek-V4.1-Flash',qwen:'qwen3.8-flash',glm:'glm-5.3-flashx',openai:'gpt-6-luna'};
export function isOriginCoder(p:ProviderConfig):boolean {try{const u=new URL(p.baseUrl);return u.protocol==='https:'&&u.hostname==='origincoder.com'&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash&&u.pathname.replace(/\/$/,'')==='/v1';}catch{return false;}}
export const ORIGIN_MODELS:Record<string,string>={deepseek:'deepseek-v4.1-flash',openai:'gpt-6.1-sol',xai:'grok-4.7',anthropic:'claude-sonnet-4-6'};
export function validBase(p:ProviderConfig):boolean {try{const u=new URL(p.baseUrl);if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash)return false;const path=u.pathname.replace(/\/$/,'');if(isOriginCoder(p))return true;if(isBAI(p))return ['deepseek','qwen','glm','openai'].includes(p.id);if(isSiliconFlow(p))return ['deepseek','qwen','glm'].includes(p.id);if(p.id==='anthropic')return false;if(p.id==='openai')return u.hostname==='api.openai.com'&&path==='/v1';if(p.id==='xai')return u.hostname==='api.x.ai'&&path==='/v1';return p.id==='deepseek'?u.hostname==='api.deepseek.com'&&['','/v1'].includes(path):p.id==='glm'?u.hostname==='open.bigmodel.cn'&&path==='/api/paas/v4':(['dashscope.aliyuncs.com','dashscope-intl.aliyuncs.com'].includes(u.hostname)||/^[a-zA-Z0-9-]+\.(cn-beijing|ap-southeast-1|cn-hongkong|us-east-1|eu-central-1|ap-northeast-1)\.maas\.aliyuncs\.com$/.test(u.hostname))&&path==='/compatible-mode/v1';}catch{return false;}}
export function estimatedCost(usage:CallRecord['usage'],p:ProviderConfig):number|null {
 if(!usage||!Number.isFinite(usage.prompt_tokens)||!Number.isFinite(usage.completion_tokens)||p.inputPrice===null||p.outputPrice===null)return null;
 const cache=usage.prompt_cache_hit_tokens??usage.prompt_tokens_details?.cached_tokens??0;
 if(cache>0&&p.cachePrice===null)return null;
 return Math.round((((usage.prompt_tokens!-cache)*p.inputPrice+cache*(p.cachePrice??p.inputPrice)+usage.completion_tokens!*p.outputPrice)/1e6)*1e6)/1e6;
}
export function requestBody(p:ProviderConfig,messages:{role:string;content:string}[],options:Pick<RunConfig,'temperature'|'maxTokens'>){
 const common:Record<string,unknown>={model:p.model,messages,stream:false,temperature:options.temperature};
 if(isOriginCoder(p)){common.max_tokens=options.maxTokens;delete common.temperature;}
 else if(isBAI(p)){common.max_tokens=options.maxTokens;if(/^(?:glm-5\.3|deepseek-v4)/i.test(p.model)){common.reasoning_effort='low';delete common.temperature;}}
 else if(p.id==='openai'){common.reasoning_effort='none';common.max_completion_tokens=options.maxTokens;}
 else if(p.id==='xai'){common.max_tokens=options.maxTokens;}
 else if(isSiliconFlow(p)){common.enable_thinking=false;common.max_tokens=options.maxTokens;}
 else if(p.id==='qwen'){common.enable_thinking=false;common[/^qwen3\.[5-9]|^qwen[4-9]/.test(p.model)?'max_completion_tokens':'max_tokens']=options.maxTokens;}
 else{common.thinking={type:'disabled'};common.max_tokens=options.maxTokens;}
 return common;
}
export class ProviderError extends Error {constructor(public code:string,message:string,public retriable=false){super(message);}}
export async function callProvider(p:ProviderConfig,key:string,messages:{role:string;content:string}[],options:Pick<RunConfig,'temperature'|'maxTokens'>):Promise<CallRecord>{
 if(!validBase(p))throw new ProviderError('INVALID_BASE_URL','只允许列出的厂商或聚合平台官方 API 地址');
 if(!key)throw new ProviderError('MISSING_API_KEY',`未配置 ${isOriginCoder(p)?`ORIGINCODER_${p.id.toUpperCase()}_API_KEY`:isBAI(p)?'BAI_API_KEY':isSiliconFlow(p)?'SILICONFLOW_API_KEY':p.envKey}`);
 const startedAt=new Date().toISOString(),start=Date.now();const payload=requestBody(p,messages,options);const {messages:_messages,...requestParameters}=payload;
 const maxAttempts=isOriginCoder(p)?1:2;
 for(let attempt=1;attempt<=maxAttempts;attempt++){
  try{
   const res=await fetch(p.baseUrl.replace(/\/$/,'')+'/chat/completions',{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify(payload),signal:AbortSignal.timeout(isOriginCoder(p)?90000:45000)});
   if(!res.ok){const code=res.status===401||res.status===403?'AUTH_ERROR':res.status===429?'RATE_LIMIT':res.status===404?'MODEL_OR_ROUTE_NOT_FOUND':`HTTP_${res.status}`;await res.text();throw new ProviderError(code,`${p.name} 请求失败（HTTP ${res.status}）`,res.status===429||res.status>=500);}
   const raw:any=await res.json();const choice=raw.choices?.[0];
   if(typeof choice?.message?.content!=='string'||!choice.message.content.trim())throw new ProviderError('EMPTY_RESPONSE','模型未返回可见回答');
   return {text:choice.message.content,model:raw.model||p.model,responseId:raw.id??null,finishReason:choice.finish_reason??null,usage:raw.usage??null,latencyMs:Date.now()-start,attempts:attempt,estimatedCost:attempt===1?estimatedCost(raw.usage??null,p):null,startedAt,endedAt:new Date().toISOString(),requestParameters};
  }catch(e){const err=e instanceof ProviderError?e:new ProviderError((e as Error).name==='TimeoutError'?'TIMEOUT':'NETWORK_ERROR','模型请求超时或网络不可达',true);if(!err.retriable||attempt===maxAttempts)throw err;await new Promise(r=>setTimeout(r,700));}
 }
 throw new ProviderError('UNKNOWN','调用失败');
}
