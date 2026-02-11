/**
 * Learn to Notion - 主入口
 *
 * 功能：
 * 1. 添加知识点到 Notion + 本地 Markdown（双写）
 * 2. 获取本周学习内容
 * 3. 发送飞书周报
 */

export { addKnowledge, checkDuplicate, getWeeklyKnowledge, testConnection } from './notion.js';
export { appendToKnowledgeList, readKnowledgeList, checkLocalDuplicate } from './markdown.js';
export { sendWeeklySummary, sendText } from './feishu.js';
