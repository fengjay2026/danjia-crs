# 丹加留学顾问CRS

留学客户关系管理系统 (CRM)

## 功能特性

- 📊 **仪表盘**: 实时统计学生数量、申请进度、待办任务
- 👥 **学生管理**: 完整的 学生档案管理
- 🎓 **申请追踪**: 追踪每个学生的申请进度
- 📁 **材料中心**: 管理PS、CV、推荐信等文书
- 📅 **日程管理**: 任务提醒和日程安排

## 技术栈

- **桌面框架**: Electron 28
- **前端框架**: React 18
- **构建工具**: Vite 5
- **UI组件**: Ant Design 5
- **路由**: React Router 6
- **数据库**: SQLite (better-sqlite3)
- **状态管理**: React Context + Hooks

## 项目结构

```
丹加留学顾问CRS/
├── package.json
├── vite.config.js
├── src/
│   ├── main.js              # Electron主进程
│   ├── preload.js           # 预加载脚本
│   ├── data/
│   │   ├── database.js      # SQLite数据库操作
│   │   └── schema.sql       # 数据库表结构
│   └── renderer/            # 前端渲染进程
│       ├── index.html
│       ├── App.jsx
│       ├── index.jsx
│       ├── styles/main.css
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── Sidebar.jsx
│       │   └── Header.jsx
│       └── pages/
│           └── Dashboard.jsx
└── public/
    └── icon.ico
```

## 数据库表

| 表名 | 说明 |
|------|------|
| seasons | 申请季 |
| students | 学生档案 |
| applications | 申请目标 |
| documents | 文书进度 |
| communications | 沟通记录 |
| ielts_scores | 雅思成绩 |
| internships | 实习经历 |
| research | 科研经历 |
| tasks | 计划任务 |

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm start
```

这将同时启动:
- Electron 主进程
- Vite 开发服务器 (端口 5173)

### 构建应用

```bash
npm run build
```

构建完成后，可执行文件位于 `dist/` 目录。

## 使用说明

1. 首次运行会自动创建SQLite数据库
2. 数据库文件位于用户数据目录下的 `DanjiaCRS/danjia-crs.db`
3. 系统会预置 26Fall、27Fall、28Fall 三个申请季

## 许可证

MIT License
