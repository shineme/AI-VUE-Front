<script setup lang="ts">
import AgentChat from './components/AgentChat.vue'
import TaskProgressSidebar from './components/TaskProgressSidebar.vue'
</script>

<template>
  <a-config-provider theme="dark">
    <div class="app-layout">
      <AgentChat />
      <TaskProgressSidebar />
    </div>
  </a-config-provider>
</template>

<style>
:root {
  /* 基础色彩 */
  --app-background: #1e293b;      /* 更亮的深蓝背景 */
  --panel-background: #334155;    /* 更亮的面板背景 */
  --chat-background: #475569;     /* 更亮的聊天区域背景 */
  
  /* 边框和分割线 */
  --border-color: rgba(203, 213, 225, 0.2);  /* 更亮的边框 */
  
  /* 文字颜色 */
  --text-primary: rgba(248, 250, 252, 0.95);    /* 更亮的主要文字 */
  --text-secondary: rgba(203, 213, 225, 0.8);   /* 更亮的次要文字 */
  --text-dark: #1e293b;                         /* 深色文字，用于浅色背景 */
  
  /* 主题色 */
  --primary-color: #60a5fa;       /* 更亮的品牌蓝 */
  --primary-hover: #93c5fd;       /* 更亮的悬停状态 */
  --success-color: #34d399;       /* 更亮的成功绿 */
  
  /* 消息气泡 */
  --bubble-user: #60a5fa;         /* 更亮的用户消息气泡 */
  --bubble-agent: #475569;        /* 更亮的AI消息气泡 */
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(255, 255, 255, 0.05);
  --shadow-md: 0 4px 6px rgba(255, 255, 255, 0.1);
  
  /* 交互状态 */
  --hover-bg: rgba(203, 213, 225, 0.15);     /* 更亮的悬停背景 */
  --active-bg: rgba(203, 213, 225, 0.2);     /* 更亮的激活背景 */
  
  /* 功能色 */
  --error-color: #f87171;      /* 更亮的错误红 */
  --warning-color: #fbbf24;    /* 更亮的警告黄 */
  --info-color: #60a5fa;       /* 更亮的信息蓝 */

  /* 动画时间 */
  --transition-fast: 0.2s;
  --transition-normal: 0.3s;
  --transition-slow: 0.5s;
  
  /* 动画曲线 */
  --ease-out: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 全局动画过渡 */
* {
  transition: background-color var(--transition-normal),
              border-color var(--transition-normal),
              color var(--transition-normal),
              box-shadow var(--transition-normal);
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--app-background);
  color: var(--text-primary);
}

#app {
  width: 100vw;
  height: 100vh;
  background-color: var(--app-background);
}

.app-layout {
  width: 100%;
  height: 100%;
  display: flex;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--panel-background);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
  transition: background-color var(--transition-fast);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--hover-bg);
}

/* 按钮悬停效果 */
button, .ant-btn {
  transition: all var(--transition-normal) var(--spring) !important;
}

button:hover, .ant-btn:hover {
  transform: translateY(-2px);
}

button:active, .ant-btn:active {
  transform: translateY(0);
}

/* 输入框焦点效果 */
input, textarea, .ant-input, .ant-input-number {
  transition: all var(--transition-normal) var(--ease-out) !important;
}

input:focus, textarea:focus, .ant-input:focus, .ant-input-number:focus {
  transform: scale(1.01);
}

/* 卡片悬停效果 */
.ant-card {
  transition: all var(--transition-normal) var(--spring) !important;
}

.ant-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* 标签悬停效果 */
.ant-tag {
  transition: all var(--transition-normal) var(--spring) !important;
}

.ant-tag:hover {
  transform: scale(1.1);
}

/* Ant Design 组件主题覆盖 */
:deep(.ant-btn-primary) {
  background: var(--primary-color);
  transition: all var(--transition-normal) var(--spring);
}

:deep(.ant-btn-primary:hover) {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
}

:deep(.ant-btn-primary:active) {
  transform: translateY(0);
}

:deep(.ant-tag-success) {
  background: var(--success-color);
  border-color: var(--success-color);
}

:deep(.ant-tag-error) {
  background: var(--error-color);
  border-color: var(--error-color);
}

/* 加载动画 */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.loading {
  animation: pulse 1.5s infinite var(--ease-in-out);
}

/* 渐入动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn var(--transition-normal) var(--ease-out);
}

/* 上移渐入动画 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp var(--transition-normal) var(--spring);
}

/* 波纹效果 */
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.ripple {
  position: relative;
  overflow: hidden;
}

.ripple::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: scale(0);
  animation: ripple 0.6s var(--ease-out);
}

/* 输入框覆盖样式 */
:deep(.ant-input-affix-wrapper) {
  background: white !important;
  border: 1px solid var(--border-color);
}

:deep(.ant-input) {
  background: white !important;
  color: var(--text-dark) !important;
}

:deep(.ant-input::placeholder) {
  color: rgba(30, 41, 59, 0.5) !important;
}

:deep(.ant-input-number) {
  background: white !important;
}

:deep(.ant-input-number-input) {
  color: var(--text-dark) !important;
}

:deep(.ant-input-number-handler-wrap) {
  background: white !important;
}

:deep(.ant-input-number-handler) {
  color: var(--text-dark) !important;
}
</style>