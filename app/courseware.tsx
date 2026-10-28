'use client';
import {useMemo,useState} from 'react';
import {CheckCircle2,AlertTriangle,ShieldCheck,RotateCcw} from 'lucide-react';

function opticsSample(guarded:boolean){
 const boundary=guarded?`if(u===f){status.textContent='物体位于焦点：出射光平行，不能在有限距离的屏幕上得到实像。'; detail.textContent='请继续改变物距，观察焦点两侧的差异。'; return;}`:'';
 return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>凸透镜成像 · 演示</title><style>
 *{box-sizing:border-box}body{margin:0;padding:28px;background:#f7f8f2;color:#263c33;font:16px system-ui,sans-serif}main{max-width:780px;margin:auto}.eyebrow{color:#819774;font-size:12px;letter-spacing:.12em}h1{font-size:25px;margin:12px 0 8px}p{line-height:1.7;color:#647661}.card{background:white;border:1px solid #e3eadb;border-radius:16px;padding:21px;margin-top:20px}.board{height:190px;background:#eef3e8;border-radius:12px;position:relative;overflow:hidden}.axis{position:absolute;left:4%;right:4%;top:50%;height:2px;background:#bdcbb3}.lens{position:absolute;left:50%;top:15%;height:70%;width:16px;border-radius:50%;background:#95b4a2;opacity:.8}.object{position:absolute;left:18%;top:22%;font-size:40px}.caption{position:absolute;bottom:13px;right:16px;color:#78926e;font-size:12px}label{display:block;font-size:14px;font-weight:600}input{width:100%;margin:18px 0;accent-color:#76946d}button{border:1px solid #cddbc8;background:white;border-radius:8px;padding:9px 14px;color:#4e6b4c}.result{margin-top:18px;font-size:16px;min-height:56px}.muted{font-size:12px;color:#84937f}.tag{color:#bd6d53;font-weight:600}
 </style></head><body><main><div class="eyebrow">互动观察 · 演示课件</div><h1>凸透镜成像规律</h1><p>拖动物距，比较焦点两侧的成像状态。以下采用理想薄透镜模型，焦距固定为 10 cm。</p><div class="card"><div class="board"><svg aria-label="透镜示意图" viewBox="0 0 700 180" style="position:absolute;inset:0;width:100%;height:100%"><line x1="20" y1="90" x2="680" y2="90" stroke="#b8cbb3" stroke-width="2"/><ellipse cx="350" cy="90" rx="10" ry="65" fill="#95b4a2"/></svg><div class="object">🕯</div><div class="caption">示意图 · 非比例光路</div></div><p><label for="distance">物距 u = <span id="value">25</span> cm</label><input id="distance" type="range" min="5" max="30" value="25" step="1"></p><button id="shade" type="button">切换：遮挡半片透镜</button><div class="result"><strong id="status"></strong><p id="detail"></p><span id="shade-note" class="muted">完整透镜</span></div></div><p class="muted">教学演示：不要直视强光；实际实验由教师指导。</p></main><script>
 const slider=document.getElementById('distance'), status=document.getElementById('status'),detail=document.getElementById('detail'),value=document.getElementById('value'),note=document.getElementById('shade-note'); let shaded=false;
 function update(){const u=Number(slider.value),f=10;value.textContent=u;${boundary}const v=u*f/(u-f);if(u>f){status.textContent='成倒立实像；像距约 '+v.toFixed(1)+' cm'; detail.textContent=u>2*f?'物距大于两倍焦距，像缩小。':u===2*f?'物距等于两倍焦距，像等大。':'物距在一倍与两倍焦距之间，像放大。';}else{status.textContent='成正立放大的虚像；像距约 '+v.toFixed(1)+' cm';detail.textContent='像与物体同侧，不能用光屏接收。';}}
 slider.addEventListener('input',update);document.getElementById('shade').addEventListener('click',()=>{shaded=!shaded;note.textContent=shaded?'遮挡部分透镜后，通常完整像变暗。':'完整透镜';});update();
 </script></body></html>`;
}
const POLICY=`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-src 'none'; object-src 'none'">`;
type Check={name:string;ok:boolean;detail:string;okLabel?:string;badLabel?:string};
function inspect(html:string):Check[]{
 const has=(re:RegExp)=>re.test(html);
 return [
  {name:'文档结构标记',ok:has(/<!doctype\s+html/i)&&has(/<html\b/i),detail:'仅检查 doctype 和 html 标签是否出现'},
  {name:'屏幕视口声明',ok:has(/<meta\b[^>]*name\s*=\s*["']viewport["']/i),detail:'检查 viewport 声明，不代表已完成大屏适配'},
  {name:'可视化容器',ok:has(/<(?:canvas|svg)\b/i),detail:'检查 canvas / svg 标记；非教学必需项'},
  {name:'可操作控件',ok:has(/<(?:button|input|select)\b/i),detail:'检查控件标记，不验证事件是否生效'},
  {name:'脚本或事件',ok:has(/<script\b|\bon(?:click|input|change)\s*=/i),detail:'检查脚本或常见事件属性，不验证交互正确性'},
  {name:'外链线索',ok:!has(/https?:\/\/|(?:src|href)\s*=\s*["']\s*\/\//i),detail:'检查常见外链文本；未命中也不能证明离线可用',okLabel:'未见常见外链',badLabel:'存在外链线索'},
 ];
}
export default function Courseware(){
 const [draft,setDraft]=useState(()=>opticsSample(true));
 const [rendered,setRendered]=useState(()=>opticsSample(true));
 const [kind,setKind]=useState('有边界说明的样例');
 const checks=useMemo(()=>inspect(draft),[draft]);
 const show=(safe:boolean)=>{const html=opticsSample(safe);setDraft(html);setRendered(html);setKind(safe?'有边界说明的样例':'故意缺少焦点处理的样例');};
 const upload=async(file:File|undefined)=>{if(!file)return;if(file.size>2000000){alert('HTML 文件请控制在 2 MB 内。');return;}setDraft(await file.text());setKind('自行导入的内容');};
 return <>
  <div className="page-heading"><div><div className="eyebrow">COURSEWARE INSPECTOR</div><h1>交互课件检查</h1><p>查看课件能否呈现，并从课堂边界问题开始复核。</p></div><span className="courseware-label">独立工具 · 不产生模型评分</span></div>
  <div className="courseware-intro"><ShieldCheck size={19}/><div><strong>这里展示的是自编示例，不是模型实测。</strong><span>预览使用受限 iframe 和内容安全策略；静态标记只能提供线索，不能证明交互、事实或安全正确。</span></div></div>
  <div className="courseware-grid"><section className="panel cw-editor"><div className="cw-header"><div><h2>课件 HTML</h2><p>{kind} · 修改仅留在当前页面</p></div><label className="button cw-upload">导入 HTML<input type="file" accept=".html,.htm,text/html" hidden onChange={e=>upload(e.target.files?.[0])}/></label></div><div className="cw-actions"><button className="button" onClick={()=>show(true)}>加载正常样例</button><button className="button" onClick={()=>show(false)}>加载缺陷样例</button><button className="button primary" onClick={()=>setRendered(draft)}><RotateCcw size={14}/>更新预览</button></div><textarea aria-label="课件 HTML 源码" spellCheck={false} value={draft} onChange={e=>{setDraft(e.target.value);setKind('已编辑的内容');}}/><p className="cw-hint">在右侧将物距拖到 10 cm，比较焦点处的提示。此预览并非隔离执行不受信任代码的完整安全环境，请不要输入敏感信息。</p></section>
  <section className="panel cw-preview"><div className="cw-header"><div><h2>隔离预览</h2><p>可手动操作 · 与自动评测结果分开</p></div><span className="cw-badge">iframe sandbox</span></div><iframe title="课件隔离预览" sandbox="allow-scripts" srcDoc={POLICY+rendered}/></section></div>
  <section className="panel cw-inspection"><div className="cw-header"><div><h2>静态线索</h2><p>仅对当前编辑框的源码做简单文本检查；不执行自动化轨迹，也不生成综合分数。</p></div></div><div className="cw-checks">{checks.map(c=><div key={c.name} className="cw-check">{c.ok?<CheckCircle2 size={17}/>:<AlertTriangle size={17}/>}<div><strong>{c.name}</strong><p>{c.detail}</p></div><span>{c.ok?(c.okLabel||'已发现'):(c.badLabel||'待检查')}</span></div>)}</div><p className="cw-limit">源码检查不能确认脚本运行、临界点处理或零外链；动态轨迹、视觉裁判和教师评价需要另行执行与记录。</p></section>
 </>;
}
