#!/usr/bin/env node

/**
 * 周报生成脚本
 *
 * 用法：
 *   node weekly-summary.js           # 发送本周学习汇总到飞书
 *   node weekly-summary.js --preview # 预览内容，不发送
 */

import { getWeeklyKnowledge, sendWeeklySummary } from '../src/index.js';

async function main() {
  const isPreview = process.argv.includes('--preview');

  console.log('');
  console.log('📚 生成本周学习汇总...');
  console.log('');

  // 获取本周知识点
  const knowledgeList = await getWeeklyKnowledge();

  if (knowledgeList.length === 0) {
    console.log('📭 本周还没有新增知识点');
    return;
  }

  // 按日期分组显示
  const grouped = {};
  for (const item of knowledgeList) {
    const date = item.date || '未知日期';
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(item);
  }

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  console.log('━'.repeat(50));
  for (const [date, items] of Object.entries(grouped).sort()) {
    const d = new Date(date);
    const weekday = weekdays[d.getDay()];
    console.log(`📅 ${date}（${weekday}）`);

    for (const item of items) {
      console.log(`   • ${item.term} - ${item.explanation}`);
    }
    console.log('');
  }
  console.log('━'.repeat(50));
  console.log(`📊 本周共学习 ${knowledgeList.length} 个新概念`);
  console.log('');

  // 发送到飞书
  if (isPreview) {
    console.log('👀 预览模式，未发送到飞书');
  } else {
    console.log('→ 发送到飞书...');
    const success = await sendWeeklySummary(knowledgeList);
    if (success) {
      console.log('✅ 发送成功！');
    }
  }
}

main().catch(console.error);
