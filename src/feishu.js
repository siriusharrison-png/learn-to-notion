/**
 * 飞书 Webhook 发送模块
 */

import dotenv from 'dotenv';

dotenv.config();

const webhookUrl = process.env.FEISHU_WEBHOOK_URL;

/**
 * 发送周报到飞书
 */
export async function sendWeeklySummary(knowledgeList) {
  if (!webhookUrl) {
    console.error('❌ 未配置飞书 Webhook URL');
    return false;
  }

  const message = formatWeeklySummary(knowledgeList);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    const result = await response.json();
    if (result.code === 0) {
      console.log('✅ 飞书消息发送成功！');
      return true;
    } else {
      console.error('❌ 飞书发送失败:', result.msg);
      return false;
    }
  } catch (error) {
    console.error('❌ 飞书发送出错:', error.message);
    return false;
  }
}

/**
 * 格式化周报内容
 */
function formatWeeklySummary(knowledgeList) {
  // 按日期分组
  const grouped = {};
  for (const item of knowledgeList) {
    const date = item.date || '未知日期';
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(item);
  }

  // 生成消息内容
  let content = '';
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  for (const [date, items] of Object.entries(grouped).sort()) {
    const d = new Date(date);
    const weekday = weekdays[d.getDay()];
    content += `**${date}（${weekday}）**\n`;

    for (const item of items) {
      const termDisplay = item.notionUrl ? `[${item.term}](${item.notionUrl})` : item.term;
      content += `• ${termDisplay} - ${item.explanation}\n`;
    }
    content += '\n';
  }

  const total = knowledgeList.length;
  content += `---\n📊 本周共学习 **${total}** 个新概念`;

  // 飞书卡片消息格式
  return {
    msg_type: 'interactive',
    card: {
      header: {
        title: {
          tag: 'plain_text',
          content: '📚 本周学习汇总'
        },
        template: 'blue'
      },
      elements: [
        {
          tag: 'markdown',
          content: content
        }
      ]
    }
  };
}

/**
 * 发送简单文本消息（测试用）
 */
export async function sendText(text) {
  if (!webhookUrl) {
    console.error('❌ 未配置飞书 Webhook URL');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msg_type: 'text',
        content: { text }
      })
    });

    const result = await response.json();
    return result.code === 0;
  } catch (error) {
    console.error('发送失败:', error.message);
    return false;
  }
}
