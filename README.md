# 课衡 LessonBench

面向教育内容的大模型评测中台。包含原创 Query / Benchmark、多厂商任务队列、规则机评、可选跨厂商模型裁判、独立 A/B 盲评页、交互课件隔离预览和可追溯报告。

**交付状态：平台 Demo 可运行；内置 72 条记录是人工编写的演示样例，不是模型厂商的真实输出。尚未提供三家 API Key，因此未完成三厂商真实对照评测。任何演示分数均不能用于厂商排名。**

## 本地运行

需要 Node.js 24 LTS。提供跨平台 Node 启动脚本；当前验收环境为 Linux，Windows / macOS 尚未实测。

```bash
npx pnpm@11.25.0 install --frozen-lockfile
npm run setup:local
npm run dev
```

打开 `http://localhost:5173`。独立盲评页面为 `http://localhost:5173/review`。首次访问管理首页会幂等写入 24 条基础任务、8 条扩展任务与基于基础任务的演示实验。数据保存在 `.wrangler/state`，刷新与重启不会丢失；删除该目录才会清空本地数据。

`setup:local` 完成生产构建并按序应用数据库迁移，不调用任何模型。默认只绑定本机。本地版未实现企业身份与角色管理，不应直接暴露给不可信网络。在线公开模式只向访客展示演示实验；真实实验、密钥配置与任务管理要求管理员通过托管平台身份登录。该权限机制依赖托管平台提供可信身份头，不可直接移植到无认证反向代理的服务器。

## 真实三厂商评测

1. 在“模型接入”填写各厂商标准 API Key，保持默认 Model ID，点击测试连接。测试会产生一次很小的请求。
2. 保存模型配置。Key 只保存在页面内存，不写入浏览器本地存储或数据库；刷新或进入独立盲评页后需重新填写。
3. “新建评测”选择“真实评测”，按需选择 24 条基础题或包含 8 条扩展题的全部 32 题，并选择至少三家模型来源（可选 OpenAI）。默认 temperature=0.3、max_tokens=4096，关闭思考。
4. 按需启用跨厂商模型裁判。24 题全量为 72 次生成之外最多 72 次计划裁判调用；32 题全量为 96 次生成之外最多 96 次计划裁判调用；网络/限流重试可能增加调用数。先小规模验证，再跑全量。
5. 页面保持打开时自动调度。可暂停、继续和取消未执行任务；在途请求会完成并保留记录。刷新后点击“继续调度”。
6. 在“人工盲评”分别完成评分、偏好与理由。建议至少两名学科教师独立标注。浏览器会话计数不代表已验证的真实人员。
7. 导出 Markdown 报告、CSV 和完整 JSON；“打印 / PDF”生成 PDF。

服务端长期配置可复制 `.dev.vars.example` 为 `.dev.vars`，仅在该文件中填写密钥。不要提交真实密钥。`.dev.vars` 只用于本地；在线部署应使用平台的 Secret 配置。

| 厂商 | 默认模型 | 环境变量 | 标准 API Base URL |
|---|---|---|---|
| DeepSeek | deepseek-flash | DEEPSEEK_API_KEY | https://api.deepseek.com |
| 阿里云百炼 | qwen-plus | DASHSCOPE_API_KEY | https://dashscope.aliyuncs.com/compatible-mode/v1 |
| 智谱 | glm-4.7 | ZAI_API_KEY | https://open.bigmodel.cn/api/paas/v4 |
| OpenAI | gpt-6-luna | OPENAI_API_KEY | https://api.openai.com/v1 |

OpenAI API 和 ChatGPT 对话分别使用账户/计费；当前对话不能作为批量调用的 API。OpenAI 预设模型与当前会话模型不保证相同。接口文档核对日期：2026-10-28。阿里支持对应地域的 WorkspaceId 专属域名。Key 与地域需要匹配。GLM 5.3 强制思考，不适用于本实验默认非思考协议；智谱标准 API Key 与 Coding Plan Key 不应混用。模型与价格会变化，正式运行前先测试连接。

## 硅基流动低成本接入

在“模型接入”点击“使用硅基流动预设”，填写一个该平台 API Key（同步到 DeepSeek、Qwen、GLM 三个模型通道），保存配置后分别测试。默认使用 `deepseek-ai/DeepSeek-V3.2`、`Qwen/Qwen3.5-4B` 与 `THUDM/GLM-4-9B-0414`。它们由一个推理平台托管，模型开发来源不同；可用性、免费额度和价格以平台实际页面为准，当前未真实连通测试。切换预设会清除页面中的密钥。CLI 可使用 `SILICONFLOW_API_KEY`。

## 无人值守 CLI

启动本地服务后，在第二个终端执行：

```bash
# 不需要密钥，自动跑完整演示并导出报告
npm run eval -- --url http://localhost:5173

# 全量真实实验；密钥从环境变量或服务端读取
npm run eval -- --url http://localhost:5173 --live --judge --max-calls 210

# 可选 OpenAI + 两家其他模型；费用取决于真实平台账单
npm run eval -- --url http://localhost:5173 --live --providers deepseek,qwen,openai --limit 3 --max-calls 9

# 先跑3道题、三家厂商，无模型裁判
npm run eval -- --url http://localhost:5173 --live --limit 3 --max-calls 9

# 接续已有演示实验，不重新创建
npm run eval -- --url http://localhost:5173 --run <run-id>

# 接续真实实验；--live 允许从当前终端环境读取厂商密钥
npm run eval -- --url http://localhost:5173 --run <run-id> --live
```

`--max-calls` 限制计划生成与裁判调用数，不是金额预算，也不包含重试。CLI 默认不打印密钥或模型原始回答。结果默认写到 `outputs/evaluation/`。公开站点的管理员操作依赖站点登录，CLI 不支持该站点的管理员身份传递；无人值守请使用本地服务。终端中断可用 `--run` 继续；超时租约会标记为结果未知，不自动重复计费。

## Benchmark 与评分

内置 24 条原创基础合成任务：教案、课件脚本、习题、作业反馈各 6 条，基础、进阶、挑战各 8 条；另有 8 条扩展题，每类各 2 条，涵盖项目学习、苏格拉底式追问、凸透镜焦点和实验诚信。任务覆盖数学、语文、英语、科学、物理、历史、信息科技；包括实验安全、隐私、提示注入、证据不足等边界情境。完整文件：`docs/Benchmark.json` 与 `docs/Benchmark_Extension.json`。基础演示实验仍固定在原 24 题，不会与新增题的实验混为一谈。

- Query 定义学段、情境、约束和统一 JSON 输出协议。
- 参考要点来自任务设计，不是经过教师标定的权威金标；正式选型前需复核。
- 规则集为 `edu-rubric-v1.1`，旧实验保留原有版本；规则分：JSON 15、结构/时长 25、目标/分层 15、检测题/解析 20、知识点提及 15、安全说明/手机号扫描 10。
- 关键词只检查“提及”，不证明知识正确。安全说明存在不代表语义安全。启发式答疑题对部分直接条件或完整答案表达增加零权重提示，不能覆盖所有答案泄露形式，必须人工复核。
- 模型裁判与人工共用五维 Rubric：准确性30%、教学25%、指令20%、表达15%、安全10%。每项1–5分，加权映射到0–100。
- 模型裁判先给证据、再评分；输入作为不可信数据封装；不让生成厂商自评。但不同生成厂商使用不同裁判，仍有裁判异质性。
- 失败调用不按零分计入内容均值；截断单独标注，不进入裁判均值；缺失指标不编造。

## 交互课件检查

“课件检查”提供自编的凸透镜正常与故意缺陷样例，在仅允许脚本的隔离 iframe 中手动操作。编辑或导入 HTML 后可更新预览，并查看六项简单的静态文本线索。它不执行自动化轨迹测试、视觉模型评估或模型打分，不能证明课件安全或教学正确；浏览器隔离不是执行不受信任内容的完整安全边界。

## 盲评与统计

`/review` 独立加载，不请求管理看板。盲评接口只返回题目、参考要点、匿名A/B内容和随机分配ID，不返回模型名、响应ID、耗时、分数或内部答案ID。A/B顺序由服务端随机；同一会话同一组合只允许提交一次。评审后不揭晓身份。

报告分开显示规则合规、模型裁判、人工偏好。人工胜率分母为胜+负，平局与双差另列。规则全通过率与人工胜率提供Wilson 95%区间，仅作小样本描述。机人一致率只计算人工明确选A/B、双方裁判有效且分数不同的组合；没有有效样本时为空。样本来自相同题目，正式统计需要按Query聚类或配对bootstrap，不能把所有投票当独立观测。

当前盲评基于浏览器会话去重，管理员仍可访问完整结果；它是流程层面的盲评 Demo，没有企业级角色权限隔离，不应声称已经消除所有来源泄漏途径。

## 架构

React 19 + TypeScript / Vinext 前端与 API 路由；Cloudflare Worker 服务端；D1 SQLite + Drizzle 迁移。数据表包括 cases、runs、results、reviews、settings。自定义 CSS，响应式布局。

```mermaid
flowchart TD
  A[任务集与参考要点] --> B[冻结实验快照]
  B --> C[持久化评测队列]
  C --> D[三厂商 API 适配器]
  D --> E[规则检查与模型裁判]
  D --> F[匿名人工盲评]
  E --> G[证据与报告]
  F --> G
  G --> B
```

服务端原子领取任务并设置租约，防止并发重复领取；每次调度最多3条，每次厂商请求45秒超时、对限流/网络/5xx最多尝试2次。评测保存参数、题目快照、SHA-256、实际模型名、响应ID、usage、finish_reason和错误类型。配置改动不影响历史实验快照。

费用由操作者填写CNY/百万Token单价、缓存价格和日期。缺失价格、usage、存在失败或重试计费不确定时显示未知。平台不伪造发票；从实际付费供应商账号申请账单与发票。

## 验证

```bash
npm run typecheck
npm test
npm run build
npm run demo:report
# 本机运行 dev 后，可执行HTTP集成测试；仅允许本地URL
LESSONBENCH_URL=http://localhost:5173 npm run test:integration
```

Windows PowerShell 设置变量：`$env:LESSONBENCH_URL='http://localhost:5173'` 后运行 `npm run test:integration`。

自动测试覆盖评分边界、格式/时间约束、SSRF地址限制、价格缺失、厂商参数、鉴权错误及截断；HTTP集成脚本覆盖队列竞争、幂等创建、匿名返回、重复提交、报告与状态转换。实际验证状态见 `docs/Validation.md`，不能把提供了测试脚本当作该脚本已执行通过。

## 文件说明

- `app/`：管理界面、独立盲评页与HTTP API。
- `lib/eval/`：任务、厂商适配、规则、裁判、队列、统计和报告。
- `db/`、`drizzle/`：数据库定义与迁移。
- `scripts/evaluate.mjs`：无人值守评测驱动。
- `docs/evidence/`：明确标注的演示评分与完整样例。
- `docs/Workflow.md`：评测流程、演示顺序与真实实验补齐要求。
- `docs/Interview_Submission.md`：可直接用于提交和答辩的项目说明。

## 参考资料

- EduEval cognitive framework: https://arxiv.org/abs/2512.00290
- CJEval educational task design: https://arxiv.org/abs/2409.16202
- MiniAppBench interactive evaluation: https://arxiv.org/abs/2603.09652
- ArtifactsBench visual-interactive evaluation: https://arxiv.org/abs/2507.04952
- 硅基流动 API: https://docs.siliconflow.cn/
- OpenAI API 模型: https://developers.openai.com/api/docs/models/gpt-6-luna
- DeepSeek API: https://api-docs.deepseek.com/
- Qwen Chat API: https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions
- GLM OpenAI兼容: https://docs.bigmodel.cn/cn/guide/develop/openai/introduction
- Zheng et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena. https://arxiv.org/abs/2306.05685
- Wang et al. (2023). Large Language Models are not Fair Evaluators. https://arxiv.org/abs/2305.17926
