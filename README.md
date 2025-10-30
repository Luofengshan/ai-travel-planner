# AI 旅行规划师（AI Travel Planner）

一个基于 React + TypeScript 的智能旅行规划应用，通过大语言模型为用户生成个性化行程，支持文字/语音输入、地图路线规划、云端保存与预算分析。

## ✨ 功能特性

- 智能行程规划：支持文字与语音输入，自动生成每日行程与建议
- 费用估算：为每个活动估算费用，自动补全餐饮与住宿费用，计算每日小计与总费用
- 预算分析：以用户预算为准，计算剩余预算并给出建议
- 语音识别：集成科大讯飞 IAT
- 地图与路线：接入高德地图完成多点路线规划
- 账户与云端：Supabase 认证和旅行计划云端保存

## 🧰 技术栈

- 前端：React 18、TypeScript、Vite、Ant Design
- 地图：高德地图 JS API
- 语音：科大讯飞 IAT WebSocket API
- AI：阿里云 百炼/DashScope（经本地代理调用）
- 后端/数据：Supabase（认证 + 数据库）

## 📦 环境准备

要求：Node 16+、npm/yarn、现代浏览器

创建 `.env`（参考 `env.example`）：

```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# 高德地图
VITE_AMAP_API_KEY=

# 科大讯飞
VITE_XUNFEI_APP_ID=
VITE_XUNFEI_API_KEY=
VITE_XUNFEI_API_SECRET=

# 阿里云（模型）
VITE_DASHSCOPE_API_KEY=
VITE_ALIBABA_ACCESS_KEY_ID=
VITE_ALIBABA_ACCESS_KEY_SECRET=
```

> 说明：代码中实际读取 `VITE_DASHSCOPE_API_KEY`，并通过本地 `proxy-server.js` 代理调用模型，避免 CORS。

## 🗄️ 数据库（Supabase）

在 Supabase SQL 控制台执行：

```sql
CREATE TABLE travel_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  travelers INTEGER NOT NULL,
  preferences TEXT,
  itinerary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own travel plans" ON travel_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own travel plans" ON travel_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own travel plans" ON travel_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own travel plans" ON travel_plans
  FOR DELETE USING (auth.uid() = user_id);
```

## 🚀 启动

1) 安装依赖

```bash
npm install
```

2) 启动本地代理（用于调用阿里云模型）

```bash
node proxy-server.js
```

3) 启动前端

```bash
npm run dev
```

访问 `http://localhost:3000`

## 🧭 使用指南

- 注册/登录：使用邮箱在 Supabase 认证，前端会话自动同步
- 文字规划：在 “文字规划” 输入需求（如“去南京3天，预算9000元，2人，喜欢美食”）
  - 生成后显示：每日行程、每项费用、当日小计、总费用与预算分析
  - 预算以用户输入为准，剩余预算=用户预算-总估算
- 语音规划：点击麦克风录音并生成行程，操作同上
- 地图规划：输入起终点（可加途经点）查看路线、时间与收费情况
- 保存计划：保存到 Supabase，在“我的计划”与“计划详情”查看

## ⚙️ 关键实现

- 认证：`src/contexts/AuthContext.tsx` 统一管理登录态，监听 `supabase.auth.onAuthStateChange`
- AI 规划：`src/services/aiService.ts`
  - 构建提示词，要求输出 JSON 且包含每项费用与总费用
  - 若模型响应缺失费用，`ensureCosts` 自动补齐三餐/住宿/门票/交通等并合计
  - 失败时切换到“智能模拟数据”并同样走补齐流程
- 文字规划页：`src/App.tsx`（内联的 TextPlanner）
  - 解析用户输入，支持“万/千/元”预算；未输入默认 10000
  - 强制以用户预算覆盖模型预算；渲染活动费用与“费用明细”
  - 预算分析以总估算费用作为支出，计算剩余预算
- 语音规划页：`src/pages/VoicePlanner.tsx`
  - WebSocket 调用科大讯飞 IAT，识别文本 -> 解析需求 -> 生成计划 -> 预算分析与保存
- 地图/路线：`src/pages/MapPlanning.tsx`、`src/pages/RoutePlanning.tsx`



