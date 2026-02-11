/**
 * Notion API 操作模块
 */

import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

/**
 * 添加知识点到 Notion
 */
export async function addKnowledge(term, category, explanation, link) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        '术语': {
          title: [{ text: { content: term } }]
        },
        '分类': {
          select: { name: category }
        },
        '解释': {
          rich_text: [{ text: { content: explanation } }]
        },
        '链接': {
          url: link
        },
        '添加日期': {
          date: { start: new Date().toISOString().split('T')[0] }
        }
      }
    });
    return { success: true, id: response.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 检查术语是否已存在
 */
export async function checkDuplicate(term) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: '术语',
        title: { equals: term }
      }
    });
    return response.results.length > 0;
  } catch (error) {
    console.error('检查重复失败:', error.message);
    return false;
  }
}

/**
 * 获取本周新增的知识点
 */
export async function getWeeklyKnowledge() {
  // 计算本周一的日期
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const mondayStr = monday.toISOString().split('T')[0];

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: '添加日期',
        date: { on_or_after: mondayStr }
      },
      sorts: [{ property: '添加日期', direction: 'ascending' }]
    });

    // 解析结果
    return response.results.map(page => ({
      term: page.properties['术语']?.title?.[0]?.text?.content || '',
      category: page.properties['分类']?.select?.name || '',
      explanation: page.properties['解释']?.rich_text?.[0]?.text?.content || '',
      link: page.properties['链接']?.url || '',
      date: page.properties['添加日期']?.date?.start || ''
    }));
  } catch (error) {
    console.error('获取本周知识失败:', error.message);
    return [];
  }
}

/**
 * 测试 Notion 连接
 */
export async function testConnection() {
  try {
    const response = await notion.databases.retrieve({ database_id: databaseId });
    console.log('✅ Notion 连接成功！');
    console.log('   数据库名称:', response.title?.[0]?.plain_text || '未命名');
    return true;
  } catch (error) {
    console.error('❌ Notion 连接失败:', error.message);
    return false;
  }
}
