# 外部教师评审参考集：PATS

## 来源与定位

本参考集来自 Rooein 等的《PATS: Personality-Aware Teaching Strategies with Large Language Model Tutors》，Findings of EACL 2026，DOI: 10.18653/v1/2026.findings-eacl.219。原论文及数据：

- 论文：<https://aclanthology.org/2026.findings-eacl.219/>
- 原始仓库：<https://github.com/donya-rooein/PATS>，固定提交 `3924adf32ab21ae79e027ffc6711798d56c3d0ba`。
- 仓库许可 MIT（许可正文见 `docs/evidence/PATS_LICENSE.txt`）；论文附录 A 说明 Gemini 生成的 PATS 对话采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。图片原图未包含在本子集，第三方故事或图片素材需遵循其各自权利。

原研究聘请了 **4 位教师**，对 **40 组不同对话对**分别作 **3 次教师成对判断**，共 **120 条教师×对话对记录**、**600 个维度选择**。评价维度是激励与支持、适配个性、主动回应、学生参与、同理心；选择为 A 更好、B 更好或平局，而非 1–5 分。学生和教学对话均为模型模拟；L1/L2/L3 是原论文的三种教学策略配置，不是三家模型厂商。

**这些教师评的是 PATS 原始样本，不是本项目 45 条模型输出。** 本项目自身实验的教师评审仍为零；两类数据不可混合计数。PATS 的公开仓库目前未提供与这 40 对逐项匹配的模型裁判原始记录，因此此导入本身不计算机人一致性，也不声称本项目自行邀请过这 4 位教师。

## 导入及复核

使用原仓库 `Data/Survey/batch_Batch_1.json` 至 `batch_Batch_4.json`，四份文件各 30 条。因为相同对话对跨批次的 `comparisonId` 不同，先按两个原始对话 ID 排序归并；再根据每条原始显示顺序和类型将选择映射到规范的 A/B。40 对均恰有 3 条评价，600 个选择均可映射，0 条控制题。

同一对话在不同批次使用“发言：角色”和“角色：发言”两种 HTML 排版。经逐段核对，80 个对话的角色及发言在各批次一致；导入时统一角色位置和解码 HTML 实体，保留 `displayOrder`、`sourceRoleLayout` 和批次内 `sourceComparisonId`。其中 32/40 对在教师之间发生左右交换；不能说全部对话都交换过位置。原始 `data.keyword` 和时间元数据未进入导出，四位标注者仅以 R1–R4 表示。

本子集属于去标识化而非不可重识别的数据：为便于复核，仍保留源对话 ID、批次与比较 ID，可能与公开原始数据关联。

原始四批文件 SHA-256：

1. `420779884ee4287a63c4515a5593d156a42c6801548848d67aeefd7d830c76cd`
2. `850450651412ac45ee9028b5019781f3e366acdf4a8bf0ef89e97accdef72b6b`
3. `37123c5198265cb121e3e5f3fbe3c8ec924d8b253894262fdd5b91097732a1cf`
4. `f90c7509a89c151073e815137aa434e68fe4640b9b904b7517e0cd89dd802aba`

将上述四个文件按批次顺序放在本地后运行：

```bash
python3 scripts/import-pats.py batch_Batch_1.json batch_Batch_2.json batch_Batch_3.json batch_Batch_4.json --output docs/evidence/PATS_Expert_Comparisons.json
```

脚本校验文件哈希、对话匹配、教师数量和评分映射；不读取标注者姓名，也不调用模型。子集里 A/B 的规范顺序按原始对话 ID 排序，仅为展示，不是优劣顺序。原文使用英文，任务为故事讨论或图片描述，与本项目的中文课件/教案任务分布不同。图片任务本子集没有原图，不能据此评价图像事实正确性。本子集未纳入原研究模拟学生的人格设定和故事全文；查看“适配个性”等维度时无法完整还原教师看到的上下文。

如需探索模型裁判，可先运行 `node --experimental-transform-types scripts/pats-judge.mjs --dry-run`，检查固定的 12 个故事对与 24 次计划调用。真实运行需在本地将 `ORIGINCODER_OPENAI_API_KEY` 设为自己的密钥，再运行 `node --experimental-transform-types scripts/pats-judge.mjs`；结果写入被 Git 忽略的 `outputs/`。该脚本分别交换 A/B，位置不稳定的维度记为缺失并单列，不当作模型真正选择了平局。由于输入缺少人格设定和故事全文，该探索不能作为原研究评审条件下的人机一致性；严格比较前应补齐原始上下文并核验授权。请求会计费，尚未运行的脚本不能算实测结果。

## 核验原论文数据的汇总

按原论文使用的方式，每组的 3 名教师对 L3 的票数按「胜 1、平 0.5、负 0」求和，与 1.5 比较，得到 40 对上的胜/平/负。该表只描述 PATS 原研究的策略比较，不是本项目四个模型的排名。

| 维度 | L3 胜 | 平 | 对照策略胜 |
|---|---:|---:|---:|
| 激励与支持 | 30 | 2 | 8 |
| 适配学生个性 | 28 | 0 | 12 |
| 主动回应 | 27 | 3 | 10 |
| 学生参与 | 27 | 0 | 13 |
| 同理心 | 31 | 0 | 9 |

40 个对话对是主要统计单位；不能把每对的 3 位评审或 5 个维度当作彼此独立的新题。样本量、任务分布和可能的排序偏差使结果不适合外推为广泛模型能力结论。
