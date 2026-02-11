#!/usr/bin/env node

/**
 * 从 Notion 拉取知识点到本地 Markdown
 *
 * 用法：
 *   node pull-from-notion.js           # 同步新增的内容
 *   node pull-from-notion.js --full    # 完全覆盖本地文件
 */

import { Client } from '@notionhq/client';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const localPath = process.env.LOCAL_KNOWLEDGE_PATH;

/**
 * 从 Notion 获取所有知识点
 */
async function getAllFromNotion() {
  const results = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: startCursor,
      sorts: [{ property: '添加日期', direction: 'ascending' }]
    });

    for (const page of response.results) {
      results.push({
        term: page.properties['术语']?.title?.[0]?.text?.content || '',
        category: page.properties['分类']?.select?.name || '其他',
        explanation: page.properties['解释']?.rich_text?.[0]?.text?.content || '',
        link: page.properties['链接']?.url || '',
        date: page.properties['添加日期']?.date?.start || ''
      });
    }

    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }

  return results;
}

/**
 * 读取本地已有的术语列表
 */
function getLocalTerms() {
  try {
    const content = fs.readFileSync(localPath, 'utf-8');
    const terms = new Set();
    const regex = /^\| ([^|]+) \|/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const term = match[1].trim();
      if (term && term !== '术语' && term !== '------' && !term.startsWith('---')) {
        terms.add(term);
      }
    }
    return terms;
  } catch (error) {
    return new Set();
  }
}

/**
 * 生成 Markdown 内容
 */
function generateMarkdown(items) {
  const grouped = {
    '技术概念': [],
    '设计相关': [],
    '其他': []
  };

  for (const item of items) {
    const cat = grouped[item.category] ? item.category : '其他';
    grouped[cat].push(item);
  }

  let md = `# 转转的知识库 / 待学清单

这里存放转转在沟通中遇到的需要进一步了解的概念和知识点。

---

## 技术概念

| 术语 | 简单解释 | 学习链接 | 添加日期 |
|------|----------|----------|----------|
`;

  for (const item of grouped['技术概念']) {
    md += `| ${item.term} | ${item.explanation} | [链接](${item.link}) | ${item.date} |\n`;
  }

  md += `
---

## 设计相关

| 术语 | 简单解释 | 学习链接 | 添加日期 |
|------|----------|----------|----------|
`;

  for (const item of grouped['设计相关']) {
    md += `| ${item.term} | ${item.explanation} | [链接](${item.link}) | ${item.date} |\n`;
  }

  if (grouped['设计相关'].length === 0) {
    md += `| （暂无） | | | |\n`;
  }

  md += `
---

## 其他

| 术语 | 简单解释 | 学习链接 | 添加日期 |
|------|----------|----------|----------|
`;

  for (const item of grouped['其他']) {
    md += `| ${item.term} | ${item.explanation} | [链接](${item.link}) | ${item.date} |\n`;
  }

  if (grouped['其他'].length === 0) {
    md += `| （暂无） | | | |\n`;
  }

  return md;
}

/**
 * 追加新内容到本地（不覆盖）
 */
function appendToLocal(newItems) {
  let content = fs.readFileSync(localPath, 'utf-8');

  for (const item of newItems) {
    const category = item.category || '其他';
    const sectionMap = {
      '技术概念': '## 技术概念',
      '设计相关': '## 设计相关',
      '其他': '## 其他'
    };
    const section = sectionMap[category] || sectionMap['其他'];
    const newRow = `| ${item.term} | ${item.explanation} | [链接](${item.link}) | ${item.date} |`;

    // 找到对应分类的表格末尾
    const sectionIndex = content.indexOf(section);
    if (sectionIndex === -1) continue;

    const afterSection = content.substring(sectionIndex);
    const nextSectionMatch = afterSection.substring(section.length).match(/\n---|\n## /);
    const insertPos = nextSectionMatch
      ? sectionIndex + section.length + nextSectionMatch.index
      : content.length;

    // 找到表格最后一行的位置
    const tableSection = content.substring(sectionIndex, insertPos);
    const lines = tableSection.split('\n');
    let lastTableLineIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].startsWith('|') && !lines[i].includes('----')) {
        lastTableLineIndex = i;
        break;
      }
    }

    if (lastTableLineIndex >= 0) {
      const beforeInsert = lines.slice(0, lastTableLineIndex + 1).join('\n');
      const afterInsert = lines.slice(lastTableLineIndex + 1).join('\n');
      const newSection = beforeInsert + '\n' + newRow + afterInsert;
      content = content.substring(0, sectionIndex) + newSection + content.substring(insertPos);
    }
  }

  fs.writeFileSync(localPath, content, 'utf-8');
}

async function main() {
  const isFullSync = process.argv.includes('--full');

  console.log('');
  console.log('📥 从 Notion 拉取知识库...');
  console.log('');

  // 获取 Notion 数据
  const notionItems = await getAllFromNotion();
  console.log(`   Notion 中共有 ${notionItems.length} 条记录`);

  if (isFullSync) {
    // 完全覆盖模式
    console.log('   模式：完全覆盖');
    const markdown = generateMarkdown(notionItems);
    fs.writeFileSync(localPath, markdown, 'utf-8');
    console.log('');
    console.log('✅ 本地文件已完全同步！');
  } else {
    // 增量模式
    const localTerms = getLocalTerms();
    console.log(`   本地已有 ${localTerms.size} 条记录`);

    const newItems = notionItems.filter(item => !localTerms.has(item.term));
    console.log(`   新增 ${newItems.length} 条`);

    if (newItems.length > 0) {
      appendToLocal(newItems);
      console.log('');
      console.log('✅ 新增内容已同步到本地！');
      console.log('   新增：');
      for (const item of newItems) {
        console.log(`   • ${item.term}`);
      }
    } else {
      console.log('');
      console.log('✅ 本地已是最新，无需同步');
    }
  }
}

main().catch(console.error);
