'use client';
import {useMemo,useState} from 'react';
import {ArrowUpRight,Download} from 'lucide-react';
import pats from '@/docs/evidence/PATS_Expert_Comparisons.json';
import {Badge,Notice} from './components';

const questions=Object.entries(pats.dimensions);
export default function TeacherEvidence(){
 const [id,setId]=useState(pats.pairs[0].id);
 const pair=useMemo(()=>pats.pairs.find(p=>p.id===id)||pats.pairs[0],[id]);
 function download(){const url=URL.createObjectURL(new Blob([JSON.stringify(pats,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='PATS_Expert_Comparisons.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <>
  <div className="page-heading"><div><div className="eyebrow">EXTERNAL HUMAN EVIDENCE</div><h1>教师评审参考集</h1><p>独立外部研究，保留任务标题、对话和教师偏好，帮助检查人工评审方法。</p></div><button className="button" onClick={download}><Download size={15}/>下载去标识化数据</button></div>
  <Notice tone="neutral"><strong>数据边界：</strong>PATS 是外部研究，4 位教师评估的是原论文中的合成教学对话，并非本项目 45 条模型回答。原数据是 A/B/平局偏好，不是 1–5 分；来源类型可通过公开原文反查。</Notice>
  <div className="stats-grid" style={{marginTop:20}}>{[['教师',pats.reviewers,'位'],['不同对话对',pats.comparisons,'组'],['教师成对评审',pats.individualReviews,'条'],['五维偏好判断',pats.dimensionChoices,'项']].map(([label,value,unit])=><div className="stat-card" key={label}><div className="stat-top">{label}</div><div className="stat-value">{value}<small>{unit}</small></div></div>)}</div>
  <section className="panel report-copy"><h2>逐对查看教师判断</h2><p>每组对话有 3 位教师分别选择 A、B 或平局；顺序按源对话 ID 固定，不代表优劣。图片任务原图、人格设定与故事全文未包含在子集中，无法完整还原评审上下文。</p><label>对话对 <select value={id} onChange={e=>setId(e.target.value)}>{pats.pairs.map(p=><option key={p.id} value={p.id}>{p.id} · {p.kind==='story'?'故事讨论':'图片描述'}</option>)}</select></label><div className="blind-columns" style={{margin:'18px 0'}}>{[pair.left,pair.right].map((v,i)=><section className="blind-answer" key={v.id}><header><strong>匿名对话 {i?'B':'A'}</strong></header><div className="blind-answer-body"><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',font:'inherit',fontSize:12,lineHeight:1.7}}>{v.text}</pre></div></section>)}</div><div className="table-scroll"><table><thead><tr><th>教师评价维度</th><th>A 更好</th><th>B 更好</th><th>平局</th></tr></thead><tbody>{questions.map(([key,label])=>{const votes=pair.votes.map(v=>(v.choices as Record<string,string>)[key]);return <tr key={key}><td>{label}</td><td>{votes.filter(v=>v==='A').length}</td><td>{votes.filter(v=>v==='B').length}</td><td>{votes.filter(v=>v==='tie').length}</td></tr>})}</tbody></table></div></section>
  <section className="panel report-copy"><h2>来源与复现</h2><p>Rooein 等，PATS，Findings of EACL 2026。原文按 40 对、每对 3 次评价汇总；本子集删除标注者原始标识并统一角色格式，保留源 ID 和去标识化投票用于复核，可能被关联到公开原始数据。源仓库为 MIT，论文注明 Gemini 生成对话为 CC BY 4.0。教学对话和学生是模拟的，不代表真实课堂效果。</p><p><a href={pats.source.paper} target="_blank" rel="noreferrer">论文与方法 <ArrowUpRight size={13}/></a> · <a href={pats.source.url} target="_blank" rel="noreferrer">原始数据与 MIT 许可 <ArrowUpRight size={13}/></a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0 <ArrowUpRight size={13}/></a></p></section>
 </>;
}
