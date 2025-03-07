# 智能体交互系统 (Agent Interaction System)

这是一个基于 Vue 3、TypeScript 和 FastAPI 构建的智能体交互系统，支持多智能体协作、任务编排和实时交互。该系统通过 WebSocket 提供实时通信，并允许用户自定义智能体角色、目标和任务流程。

![智能体交互系统](./screenshots/main-interface.png)

## 目录

- [项目概述](#项目概述)
- [主要功能](#主要功能)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [安装与设置](#安装与设置)
- [使用指南](#使用指南)
- [API接口](#api接口)
- [自定义与扩展](#自定义与扩展)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 项目概述

智能体交互系统是一个允许用户与多个AI智能体进行协作的平台。系统设计了完整的智能体配置界面和任务编排功能，使用户能够自定义智能体的角色、目标、背景故事和使用的语言模型，并能够编排和监控任务的执行流程。

系统的核心价值在于：

1. **多智能体协作**：多个具有不同角色的AI智能体共同工作，完成复杂任务
2. **任务编排**：用户可以定义任务序列和依赖关系，构建工作流
3. **自定义配置**：完全自定义智能体的行为和特性
4. **实时交互**：通过WebSocket提供流畅的实时交互体验

## 主要功能

### 智能体管理

- **智能体配置**：自定义智能体的角色、目标、背景故事和语言模型
- **智能体启用/禁用**：控制哪些智能体参与任务执行
- **角色标签**：直观显示智能体的角色和当前状态
- **模型选择**：为不同智能体选择不同的语言模型

### 任务管理

- **任务配置**：自定义任务描述、预期输出和执行角色
- **任务启用/禁用**：控制哪些任务需要执行
- **任务状态跟踪**：实时监控任务进度和状态
- **任务依赖关系**：构建任务之间的依赖和执行顺序

### 用户界面

- **实时聊天**：与智能体进行实时对话
- **任务进度侧边栏**：显示任务执行进度和状态
- **直观的状态指示**：通过颜色和图标直观展示系统状态
- **适配亮色/暗色主题**：支持不同的显示模式
- **交互式编辑**：双击即可编辑配置

## 技术栈

### 前端

- **框架**：Vue 3 (使用Composition API)
- **语言**：TypeScript
- **构建工具**：Vite
- **UI组件库**：Ant Design Vue
- **状态管理**：Vue Reactivity API
- **网络通信**：WebSocket、Fetch API

### 后端

- **框架**：FastAPI
- **WebSocket服务器**：FastAPI WebSockets
- **智能体引擎**：基于LLM的智能体系统
- **任务调度**：自定义任务管理器

## 项目结构

```
前端/
├── public/               # 静态资源
├── src/
│   ├── assets/           # 静态资源
│   ├── components/       # Vue组件
│   │   ├── AgentChat.vue              # 主聊天界面
│   │   ├── AgentConfigModal.vue       # 智能体配置模态框
│   │   ├── AgentControlPanel.vue      # 智能体控制面板
│   │   ├── TaskConfigModal.vue        # 任务配置模态框
│   │   └── TaskProgressSidebar.vue    # 任务进度侧边栏
│   ├── composables/      # 可复用的逻辑
│   │   └── useTaskProgress.ts         # 任务进度管理
│   ├── App.vue           # 根组件
│   └── main.ts           # 应用入口
├── index.html            # HTML模板
├── package.json          # 依赖配置
└── README.md             # 项目文档
```

## 安装与设置

### 前端设置

1. 克隆项目代码
```bash
git clone https://your-repository-url.git
cd 前端
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

### 后端设置

1. 进入后端目录
```bash
cd ../后端
```

2. 安装依赖
```bash
pip install -r requirements.txt
```

3. 启动WebSocket服务器
```bash
python websocket_server.py
```

## 使用指南

### 开始使用

1. 访问前端应用 (默认为 `http://localhost:5173`)
2. 在控制面板选择一个团队类型
3. 点击"开始分析"按钮初始化智能体
4. 在聊天界面与智能体交互

### 自定义智能体

1. 双击侧边栏中的智能体图标打开配置模态框
2. 修改角色、目标、背景故事等信息
3. 勾选或取消勾选"启用此智能体"来控制其参与状态
4. 点击"保存设置"应用更改

### 自定义任务

1. 双击侧边栏中的任务图标打开任务配置模态框
2. 修改任务描述、预期输出和执行角色
3. 勾选或取消勾选"启用此任务"来控制其执行状态
4. 点击"保存设置"应用更改

### 保存配置

点击侧边栏顶部的保存图标将所有配置更改保存到服务器。

## API接口

### WebSocket接口

- **连接端点**: `ws://localhost:8003/ws`
- **事件类型**:
  - `chat`: 聊天消息
  - `system`: 系统消息
  - `task_status`: 任务状态更新
  - `set_custom_config`: 保存用户配置

### HTTP接口

- **获取团队信息**: `GET /api/crew-info/{crew_type}`
  - 获取指定团队类型的智能体和任务配置
  - 返回JSON格式的配置信息

## 自定义与扩展

### 添加新的智能体角色

1. 在后端的`product_analysis_crew.py`中添加新的智能体定义
2. 更新前端`useTaskProgress.ts`中的相关接口定义
3. 在UI中验证新角色是否正确显示

### 添加新的任务类型

1. 在后端任务创建逻辑中添加新的任务定义
2. 更新前端接口以支持新任务类型
3. 调整任务状态逻辑以适应新任务类型

### 定制主题

系统支持亮色/暗色主题，可以通过修改CSS变量进行定制：

```css
:root {
  --primary-color: #1890ff;
  --secondary-color: #4096ff;
  --background-color: #f0f2f5;
  --text-color: rgba(0, 0, 0, 0.85);
}
```

## 贡献指南

欢迎为项目做出贡献！请按照以下步骤进行：

1. Fork项目仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个Pull Request

## 许可证

[MIT License](LICENSE)

---

© 2025 智能体交互系统团队
