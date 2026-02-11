#!/usr/bin/env node

/**
 * 双向同步：本地 ↔ Notion
 *
 * 用法：
 *   node sync.js
 *
 * 功能：
 *   1. 把本地新增的内容同步到 Notion
 *   2. 把 Notion 新增的内容同步到本地
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
 * 解析本地 Markdown 文件
 */
function parseLocalMarkdown() {
  const content = fs.readFileSync(localPath, 'utf-8');
  const items = [];

  // 匹配表格行
  const regex = /^\| ([^|]+) \| ([^|]+) \| \[.*?\]\(([^)]+)\) \| ([^|]+) \|$/gm;
  let match;

  // 当前分类
  let currentCategory = '技术概念';
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.includes('## 技术概念')) currentCategory = '技术概念';
    else if (line.includes('## 设计相关')) currentCategory = '设计相关';
    else if (line.includes('## 其他')) currentCategory = '其他';

    const rowMatch = line.match(/^\| ([^|]+) \| ([^|]+) \| \[.*?\]\(([^)]+)\) \| ([^|]+) \|$/);
    if (rowMatch) {
      const term = rowMatch[1].trim();
      if (term && term !== '术语' && !term.startsWith('---') && term !== '（暂无）') {
        items.push({
          term,
          explanation: rowMatch[2].trim(),
          link: rowMatch[3].trim(),
          date: rowMatch[4].trim(),
          category: currentCategory
        });
      }
    }
  }

  return items;
}

/**
 * 添加到 Notion
 */
async function addToNotion(item) {
  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        '术语': { title: [{ text: { content: item.term } }] },
        '分类': { select: { name: item.category } },
        '解释': { rich_text: [{ text: { content: item.explanation } }] },
        '链接': { url: item.link },
        '添加日期': { date: { start: item.date || new Date().toISOString().split('T')[0] } }
      }
    });
    return true;
  } catch (error) {
    console.error(`   添加失败：${item.term} - ${error.message}`);
    return false;
  }
}

/**
 * 添加到本地 Markdown
 */
function addToLocal(items) {
  let content = fs.readFileSync(localPath, 'utf-8');

  for (const item of items) {
    const category = item.category || '其他';
    const sectionMap = {
      '技术概念': '## 技术概念',
      '设计相关': '## 设计相关',
      '其他': '## 其他'
    };
    const section = sectionMap[category] || sectionMap['其他'];
    const newRow = `| ${item.term} | ${item.explanation} | [链接](${item.link}) | ${item.date} |`;

    const sectionIndex = content.indexOf(section);
    if (sectionIndex === -1) continue;

    // 找下一个分隔线
    const afterSection = content.substring(sectionIndex);
    const nextBreak = afterSection.indexOf('\n---', 10);
    const insertPos = nextBreak > 0 ? sectionIndex + nextBreak : content.length;

    // 在分隔线前插入
    content = content.substring(0, insertPos) + '\n' + newRow + content.substring(insertPos);
  }

  fs.writeFileSync(localPath, content, 'utf-8');
}

async function main() {
  console.log('');
  console.log('🔄 双向同步：本地 ↔ Notion');
  console.log('');

  // 获取两边的数据
  const notionItems = await getAllFromNotion();
  const localItems = parseLocalMarkdown();

  const notionTerms = new Set(notionItems.map(i => i.term));
  const localTerms = new Set(localItems.map(i => i.term));

  console.log(`   📊 Notion: ${notionItems.length} 条`);
  console.log(`   📄 本地: ${localItems.length} 条`);
  console.log('');

  // 找出差异
  const onlyInLocal = localItems.filter(i => !notionTerms.has(i.term));
  const onlyInNotion = notionItems.filter(i => !localTerms.has(i.term));

  // 本地 → Notion
  if (onlyInLocal.length > 0) {
    console.log(`📤 本地 → Notion（${onlyInLocal.length} 条）`);
    for (const item of onlyInLocal) {
      const success = await addToNotion(item);
      if (success) {
        console.log(`   ✅ ${item.term}`);
      }
      await new Promise(r => setTimeout(r, 300));
    }
    console.log('');
  }

  // Notion → 本地
  if (onlyInNotion.length > 0) {
    console.log(`📥 Notion → 本地（${onlyInNotion.length} 条）`);
    addToLocal(onlyInNotion);
    for (const item of onlyInNotion) {
      console.log(`   ✅ ${item.term}`);
    }
    console.log('');
  }

  if (onlyInLocal.length === 0 && onlyInNotion.length === 0) {
    console.log('✅ 两边已同步，无差异');
  } else {
    console.log('━'.repeat(40));
    console.log('✅ 同步完成！');
  }
}

main().catch(console.error);
