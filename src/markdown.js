/**
 * 本地 Markdown 知识库读写模块
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const knowledgePath = process.env.LOCAL_KNOWLEDGE_PATH ||
  path.join(process.env.HOME, '.claude/knowledge-list.md');

/**
 * 读取知识库内容
 */
export function readKnowledgeList() {
  try {
    return fs.readFileSync(knowledgePath, 'utf-8');
  } catch (error) {
    console.error('读取知识库失败:', error.message);
    return '';
  }
}

/**
 * 添加知识点到本地 Markdown
 */
export function appendToKnowledgeList(term, category, explanation, link, date) {
  try {
    let content = readKnowledgeList();

    // 根据分类找到对应的表格位置
    const categoryMap = {
      '技术概念': '## 技术概念',
      '设计相关': '## 设计相关',
      '其他': '## 其他'
    };

    const sectionHeader = categoryMap[category] || categoryMap['其他'];
    const newRow = `| ${term} | ${explanation} | [链接](${link}) | ${date} |`;

    // 找到对应分类的表格，在表格末尾添加新行
    const sectionIndex = content.indexOf(sectionHeader);
    if (sectionIndex === -1) {
      console.error('未找到分类:', category);
      return false;
    }

    // 找到该分类下的表格结束位置（下一个 --- 或 ## 之前）
    const afterSection = content.substring(sectionIndex);
    const lines = afterSection.split('\n');

    let insertIndex = sectionIndex;
    let foundTable = false;
    let lineCount = 0;

    for (const line of lines) {
      lineCount++;
      if (line.startsWith('|') && !line.includes('---')) {
        foundTable = true;
        insertIndex = sectionIndex + lines.slice(0, lineCount).join('\n').length;
      }
      // 遇到下一个分割线或标题，停止
      if (foundTable && (line.startsWith('---') || (line.startsWith('##') && lineCount > 1))) {
        break;
      }
    }

    // 在找到的位置插入新行
    const before = content.substring(0, insertIndex);
    const after = content.substring(insertIndex);
    content = before + '\n' + newRow + after;

    fs.writeFileSync(knowledgePath, content, 'utf-8');
    console.log('✅ 本地知识库已更新');
    return true;
  } catch (error) {
    console.error('写入知识库失败:', error.message);
    return false;
  }
}

/**
 * 检查术语是否已存在
 */
export function checkLocalDuplicate(term) {
  const content = readKnowledgeList();
  return content.includes(`| ${term} |`);
}
