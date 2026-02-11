#!/usr/bin/env node

/**
 * 添加知识点脚本
 *
 * 用法：
 *   node add-knowledge.js <术语> <分类> <解释> <链接>
 *
 * 示例：
 *   node add-knowledge.js "API" "技术概念" "应用程序接口" "https://zh.wikipedia.org/wiki/API"
 */

import {
  addKnowledge,
  checkDuplicate,
  appendToKnowledgeList,
  checkLocalDuplicate
} from '../src/index.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.log('用法: node add-knowledge.js <术语> <分类> <解释> <链接>');
    console.log('示例: node add-knowledge.js "API" "技术概念" "应用程序接口" "https://example.com"');
    process.exit(1);
  }

  const [term, category, explanation, link] = args;
  const date = new Date().toISOString().split('T')[0];

  console.log('');
  console.log('📝 添加知识点...');
  console.log(`   术语: ${term}`);
  console.log(`   分类: ${category}`);
  console.log(`   解释: ${explanation}`);
  console.log(`   链接: ${link}`);
  console.log('');

  // 检查是否重复
  const isDuplicateNotion = await checkDuplicate(term);
  const isDuplicateLocal = checkLocalDuplicate(term);

  if (isDuplicateNotion || isDuplicateLocal) {
    console.log(`⚠️  "${term}" 已存在于知识库中`);
    console.log('   如需更新，请手动编辑');
    process.exit(0);
  }

  // 写入 Notion
  console.log('→ 写入 Notion...');
  const notionResult = await addKnowledge(term, category, explanation, link);
  if (notionResult.success) {
    console.log('   ✅ Notion 写入成功');
  } else {
    console.log('   ❌ Notion 写入失败:', notionResult.error);
  }

  // 写入本地 Markdown
  console.log('→ 写入本地 Markdown...');
  const localResult = appendToKnowledgeList(term, category, explanation, link, date);
  if (localResult) {
    console.log('   ✅ 本地写入成功');
  }

  console.log('');
  console.log('🎉 完成！');
}

main().catch(console.error);
