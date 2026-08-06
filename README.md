# AI 标书技术响应助手 MVP

项目采用前后端分离结构：

- `frontend`：React + Vite 单页工作台
- `backend`：Node.js + Express，负责读取 Dify 密钥并调用 Workflow API

## 环境变量

后端只读取 `backend/.env`。复制示例文件后填入真实配置：

```bash
cp backend/.env.example backend/.env
```

```bash
DIFY_API_BASE=https://api.dify.ai/v1
DIFY_API_KEY=app-your-dify-workflow-key
PORT=3001
```

## 安装

在项目根目录执行：

```bash
npm install
```

## 本地运行

```bash
npm run dev
```

默认端口：

- 前端：`http://localhost:5173`
- 后端：`http://127.0.0.1:3001`

前端通过 Vite proxy 将 `/api` 转发到后端，因此 `frontend/src/api.js` 默认请求相对路径，不会暴露 Dify API Key。

## 后端接口

`POST /api/generate-bid`

请求体：

```json
{
  "project_name": "项目名称",
  "project_type": "智慧城市",
  "bid_need": "招标需求",
  "focus_points": "重点响应要求",
  "output_mode": "技术标初稿"
}
```

后端调用 Dify：

- URL：`${DIFY_API_BASE}/workflows/run`
- `response_mode`：`blocking`
- `inputs`：`project_name`、`project_type`、`bid_need`、`focus_points`、`output_mode`

返回结果优先读取：

1. `data.outputs.result`
2. `data.outputs.text`
3. `data.outputs.answer`
4. `outputs` 的第一个可用字段
