import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'课衡 LessonBench · 教育 AI 评测中台',referrer:'no-referrer',description:'用可复核的教育任务、自动化机评与人工盲评，让模型选择有据可依。',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>;}
