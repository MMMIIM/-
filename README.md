# AI 标书项目与生成归档

P0-1 在现有 React + Vite + Express 项目上增加项目、招标文件、生成任务、生成结果、文档版本和风险复核的持久化骨架。企业 RAG、Agent、Word/PDF 导出和章节重生成不在本阶段范围内。

## 架构与安全边界

- `frontend`：React + Vite 项目列表和项目工作台。
- `backend`：Express API、Dify Workflow 调用、PostgreSQL 数据访问和文件存储抽象。
- `backend/migrations`：可重复执行的 PostgreSQL 初始化迁移。
- `uploads/`：开发环境本地文件存储，已加入 `.gitignore`，不得提交文件内容或生成结果。
- Dify API Key 只从 `backend/.env` 读取，前端构建不包含密钥。
- Dify Workflow v4.2 已冻结。后端只读取 `data.outputs.response_payload_json`（也兼容 Dify 事件本身以 `outputs.response_payload_json` 暴露输出），不会读取 `result`、`text`、`answer` 或其他字段。

`response_payload_json` 必须是 JSON 对象或可解析为对象的 JSON 字符串，并符合：

```json
{
  "document": {
    "title": "技术响应",
    "markdown": "# 正式正文",
    "sections": [{ "id": "section-1", "title": "项目概述" }]
  },
  "warnings": [{ "level": "warning", "code": "W-01", "message": "需要复核的事项" }],
  "risk_status": "pass"
}
```

`risk_status` 仅允许 `pass`、`warning`、`critical`。契约无效时 API 返回 `CONTRACT_INVALID`，任务标记失败，不创建 `Generation` 或 `DocumentVersion`，前端只显示友好消息，不返回原始审计数据。

## 本地启动

要求 Node.js 20+、npm 和 Docker（或现有 PostgreSQL 14+）。

```bash
npm install
docker compose up -d postgres
cp backend/.env.example backend/.env
npm run db:migrate
npm run dev
```

Windows PowerShell 可用 `Copy-Item backend/.env.example backend/.env`。

默认前端地址为 `http://localhost:5173`，后端地址为 `http://127.0.0.1:3001`。Vite 将 `/api` 代理到后端。

## 环境变量

编辑 `backend/.env`，不要提交该文件：

```dotenv
DIFY_API_BASE=https://api.dify.ai/v1
DIFY_API_KEY=
DIFY_WORKFLOW_VERSION=4.2
DATABASE_URL=postgresql://bid_user:bid_password@127.0.0.1:5432/bid_platform
UPLOAD_DIR=../uploads
PORT=3001
HOST=127.0.0.1
CORS_ORIGIN=http://localhost:5173
```

生产环境应使用独立数据库和密钥，并将 `UPLOAD_DIR` 指向持久化磁盘；未来可通过同一存储抽象切换对象存储。

## 数据库迁移

首次启动及每次部署新版本前执行 `npm run db:migrate`。当前迁移 `backend/migrations/001_project_foundation.sql` 建立 `projects`、`tender_files`、`generation_jobs`、`generations`、`document_versions`、`review_decisions`，可重复执行。

## API 概览

- `GET /api/health`：服务与数据库健康检查。
- `POST /api/projects`：创建项目，可用 multipart 字段 `tender_file` 同时上传文件。
- `GET /api/projects`、`GET /api/projects/:projectId`：项目列表与详情。
- `POST /api/projects/:projectId/tender-files`：上传并关联招标文件，multipart 字段名为 `file`。
- `POST /api/projects/:projectId/generation-jobs`：建立任务并调用 Dify，状态为 `queued/running/succeeded/failed`。
- `GET /api/projects/:projectId/generation-jobs`：任务记录。
- `GET /api/projects/:projectId/document-versions`：文档版本历史。
- `POST /api/document-versions/:versionId/review-decisions`：保存版本确认结论。
- `POST /api/generate-bid`：保留原调用方式并继续返回 `{ markdown }`，同时持久化任务和生成记录。

风险门禁：`pass` 可确认；`warning` 必须提供 `confirmation_text`；`critical` 返回 `CRITICAL_RISK` 并禁止确认。

## 检查与测试

```bash
npm run lint
npm test
npm run build
```

测试覆盖合法契约、非法契约不创建版本、critical 禁止确认、Dify 调用失败，以及禁止从旧输出字段兜底读取。

## 部署前检查

1. 使用生产 PostgreSQL 并备份，执行 `npm run db:migrate`。
2. 在后端配置 `DATABASE_URL`、`DIFY_API_BASE`、`DIFY_API_KEY`、`DIFY_WORKFLOW_VERSION=4.2`、`UPLOAD_DIR`、`CORS_ORIGIN`。
3. 确认 `backend/.env`、上传文件和生成结果均未进入 Git。
4. 执行 `npm run lint && npm test && npm run build`。
5. 使用 `npm run start` 启动后端，请求 `GET /api/health`，必须返回 `{"ok":true,"database":"connected"}`。
6. 将 `frontend/dist` 交由现有静态站点发布，并把 `/api` 反向代理至后端。

仓库目前未记录具体服务器地址、部署路径、进程管理方式或远端健康检查入口。因此不得猜测服务器命令；实际发布前仍需提供这些部署信息及生产环境变量的安全配置方式。
