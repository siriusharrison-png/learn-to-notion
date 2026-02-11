# Learn to Notion

把学习记录同步到 Notion，每周自动发飞书总结。

## 功能

- 📝 **添加知识点** — 同时写入 Notion 和本地 Markdown（双写备份）
- 📊 **周报生成** — 自动汇总本周学习内容
- 💬 **飞书通知** — 一键发送到飞书群

## 快速开始

### 1. 安装依赖

```bash
cd learn-to-notion
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入你的配置：

```bash
cp .env.example .env
```

需要配置：
- `NOTION_API_KEY` — Notion Integration 的 API Key
- `NOTION_DATABASE_ID` — Notion 数据库 ID
- `FEISHU_WEBHOOK_URL` — 飞书群机器人 Webhook
- `LOCAL_KNOWLEDGE_PATH` — 本地知识库文件路径

### 3. 设置 Notion

1. 创建 Notion Integration：https://www.notion.so/my-integrations
2. 创建数据库，包含以下列：
   - 术语（Title）
   - 分类（Select）
   - 解释（Text）
   - 链接（URL）
   - 添加日期（Date）
3. 将 Integration 连接到数据库

### 4. 设置飞书机器人

1. 在飞书群设置中添加「自定义机器人」
2. 复制 Webhook URL 到 `.env`

## 使用方法

### 添加知识点

```bash
node scripts/add-knowledge.js "术语" "分类" "解释" "链接"

# 示例
node scripts/add-knowledge.js "API" "技术概念" "应用程序接口" "https://zh.wikipedia.org/wiki/API"
```

### 生成周报

```bash
# 预览（不发送）
node scripts/weekly-summary.js --preview

# 发送到飞书
node scripts/weekly-summary.js
```

## 配合 Claude Code 使用

将 `skill/SKILL.md` 复制到 Claude Code 的技能目录：

```bash
cp skill/SKILL.md ~/.claude/skills/learn/SKILL.md
```

然后在 Claude Code 中使用 `/learn` 命令即可自动同步到 Notion。

## 定时发送周报

### 方式一：Mac 定时任务（launchd）

创建 `~/Library/LaunchAgents/com.learn.weekly.plist`，设置每周五下午 5 点发送。

### 方式二：GitHub Actions

使用 `.github/workflows/weekly-summary.yml`（需要配置 Secrets）。

## 项目结构

```
learn-to-notion/
├── src/
│   ├── notion.js      # Notion API
│   ├── feishu.js      # 飞书 Webhook
│   ├── markdown.js    # 本地 Markdown
│   └── index.js       # 主入口
├── scripts/
│   ├── add-knowledge.js    # 添加脚本
│   └── weekly-summary.js   # 周报脚本
├── skill/
│   └── SKILL.md       # Claude Code Skill
└── .env.example       # 环境变量示例
```

## License

MIT
