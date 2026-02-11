#!/usr/bin/env node

/**
 * 批量同步本地知识库到 Notion
 */

import { addKnowledge, checkDuplicate } from '../src/index.js';

const knowledgeList = [
  // 技术概念
  { term: "Vibecoding", category: "技术概念", explanation: "凭感觉和 AI 聊天，让 AI 帮你写代码", link: "https://en.wikipedia.org/wiki/Vibe_coding", date: "2026-02-07" },
  { term: "LLM", category: "技术概念", explanation: "能理解和生成人类语言的 AI 大脑", link: "https://zh.wikipedia.org/wiki/大型语言模型", date: "2026-02-07" },
  { term: "Agent", category: "技术概念", explanation: "能自主规划和行动的 AI 助手", link: "https://zh.wikipedia.org/wiki/智能代理", date: "2026-02-07" },
  { term: "Agentic AI", category: "技术概念", explanation: "具有自主推理和决策能力的 AI 系统", link: "https://huggingface.co/blog", date: "2026-02-10" },
  { term: "Multi-Agent", category: "技术概念", explanation: "多个 AI 智能体协作完成任务的系统", link: "https://github.com/microsoft/autogen", date: "2026-02-10" },
  { term: "CoT (Chain of Thought)", category: "技术概念", explanation: "思考链，让 AI 一步步推理的技术", link: "https://lilianweng.github.io/posts/2023-06-23-agent/", date: "2026-02-10" },
  { term: "Tree of Thoughts", category: "技术概念", explanation: "思考树，在每一步探索多个可能的推理路径", link: "https://lilianweng.github.io/posts/2023-06-23-agent/", date: "2026-02-10" },
  { term: "ReAct", category: "技术概念", explanation: "结合「推理」和「行动」的 Agent 框架", link: "https://arxiv.org/abs/2210.03629", date: "2026-02-10" },
  { term: "Reflexion", category: "技术概念", explanation: "让 AI 能自我反思、从错误中学习的框架", link: "https://lilianweng.github.io/posts/2023-06-23-agent/", date: "2026-02-10" },
  { term: "RAG", category: "技术概念", explanation: "检索增强生成，让 AI 先查资料再回答", link: "https://aws.amazon.com/what-is/retrieval-augmented-generation/", date: "2026-02-10" },
  { term: "CRAFT", category: "技术概念", explanation: "持续推理和智能体反馈调优", link: "https://huggingface.co/blog", date: "2026-02-10" },
  { term: "Agentic RL", category: "技术概念", explanation: "智能体强化学习，让 AI 通过尝试和反馈来学习", link: "https://huggingface.co/blog", date: "2026-02-10" },
  { term: "AutoGen", category: "技术概念", explanation: "微软的多智能体框架，让多个 AI 协作工作", link: "https://github.com/microsoft/autogen", date: "2026-02-10" },
  { term: "Tool Use", category: "技术概念", explanation: "AI 使用外部工具的能力", link: "https://docs.anthropic.com/", date: "2026-02-10" },
  { term: "Function Calling", category: "技术概念", explanation: "让 AI 能使用工具的能力", link: "https://platform.openai.com/docs/guides/function-calling", date: "2026-02-07" },
  { term: "MCP", category: "技术概念", explanation: "让 AI 连接外部服务的通用标准", link: "https://modelcontextprotocol.io/", date: "2026-02-07" },
  { term: "CSS", category: "技术概念", explanation: "告诉网页长什么样的化妆说明书", link: "https://developer.mozilla.org/zh-CN/docs/Learn/CSS/First_steps", date: "2026-02-07" },
  { term: "JSON", category: "技术概念", explanation: "一种数据记录格式，像配料清单", link: "https://zh.wikipedia.org/wiki/JSON", date: "2026-02-07" },
  { term: "Tailwind", category: "技术概念", explanation: "预制的样式积木块，拼一拼就能做出好看的界面", link: "https://tailwindcss.com/", date: "2026-02-07" },
  { term: "Next.js", category: "技术概念", explanation: "建网站的框架，像房子的结构", link: "https://nextjs.org/", date: "2026-02-07" },
  { term: "CLI", category: "技术概念", explanation: "命令行界面，用打字和电脑沟通", link: "https://zh.wikipedia.org/wiki/命令行界面", date: "2026-02-07" },
  { term: "IDE", category: "技术概念", explanation: "写代码的全套工作台（如 VS Code）", link: "https://zh.wikipedia.org/wiki/集成开发环境", date: "2026-02-07" },
  { term: "VS Code 插件", category: "技术概念", explanation: "装在代码编辑器里的小工具", link: "https://marketplace.visualstudio.com/", date: "2026-02-10" },
  { term: "CLI 工具", category: "技术概念", explanation: "在终端里运行的工具，输入命令得到结果", link: "https://zh.wikipedia.org/wiki/命令行界面", date: "2026-02-10" },
  { term: "CI 集成", category: "技术概念", explanation: "自动化流水线上的检查站", link: "https://www.redhat.com/zh/topics/devops/what-is-ci-cd", date: "2026-02-10" },
  { term: "i18n", category: "技术概念", explanation: "让软件支持多语言的技术", link: "https://developer.mozilla.org/zh-CN/docs/Mozilla/Add-ons/WebExtensions/Internationalization", date: "2026-02-11" },
  { term: "Notion API", category: "技术概念", explanation: "Notion 官方提供的数据操作接口", link: "https://developers.notion.com/", date: "2026-02-11" },
  // 设计相关
  { term: "Design Tokens", category: "设计相关", explanation: "设计系统的基础变量（颜色、字体、间距）", link: "https://spectrum.adobe.com/page/design-tokens/", date: "2026-02-07" },
  { term: "Tokens Studio", category: "设计相关", explanation: "Figma 插件，把设计变量导出成代码能用的格式", link: "https://tokens.studio/", date: "2026-02-07" },
];

async function syncAll() {
  console.log('');
  console.log('📚 开始同步知识库到 Notion...');
  console.log(`   共 ${knowledgeList.length} 条记录`);
  console.log('');

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of knowledgeList) {
    // 检查是否已存在
    const exists = await checkDuplicate(item.term);
    if (exists) {
      console.log(`⏭️  跳过：${item.term}（已存在）`);
      skipped++;
      continue;
    }

    // 添加到 Notion
    const result = await addKnowledge(item.term, item.category, item.explanation, item.link);
    if (result.success) {
      console.log(`✅ 添加：${item.term}`);
      success++;
    } else {
      console.log(`❌ 失败：${item.term} - ${result.error}`);
      failed++;
    }

    // 稍微等一下，避免 API 限流
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('');
  console.log('━'.repeat(40));
  console.log(`📊 同步完成！`);
  console.log(`   ✅ 成功：${success}`);
  console.log(`   ⏭️  跳过：${skipped}`);
  console.log(`   ❌ 失败：${failed}`);
}

syncAll().catch(console.error);
