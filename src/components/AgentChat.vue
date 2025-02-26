<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import AgentControlPanel from './AgentControlPanel.vue';
import {
  SendOutlined,
  MenuOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilePdfOutlined
} from '@ant-design/icons-vue';
import { useWebSocket } from '../composables/useWebSocket';
import { useChat } from '../composables/useChat';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

// 配置 marked
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

const WS_URL = 'wss://wss.iffjewelry.com/ws';

const {
  connectionStatus,
  send,
  registerMessageHandler
} = useWebSocket(WS_URL);

const {
  messages,
  inputMessage,
  isWaitingForInput,
  currentQuestion,
  currentOptions,
  analysisInProgress,
  addMessage,
  updateLastMessage,
  clearInput,
  setWaitingForInput,
  resetWaitingForInput
} = useChat();

const messageAreaRef = ref<HTMLDivElement | null>(null);
const isPanelVisible = ref(false);
const drawerVisible = ref(false);
const selectedResult = ref<ChatMessage | null>(null);
const resultContentRef = ref<HTMLElement | null>(null);

const scrollToBottom = async () => {
  await nextTick();
  if (messageAreaRef.value) {
    messageAreaRef.value.scrollTop = messageAreaRef.value.scrollHeight;
  }
};

const processMarkdown = (content: string) => {
  try {
    // 移除 ANSI 转义序列
    content = content.replace(/\u001b\[\d+m/g, '');
    // 渲染 Markdown
    const html = marked(content);
    // 净化 HTML
    return DOMPurify.sanitize(html);
  } catch (error) {
    console.error('Markdown processing error:', error);
    return content;
  }
};

onMounted(() => {
  registerMessageHandler('chat', (data) => {
    switch (data.type) {
      case 'update':
        if (data.content) {
          const processedContent = processMarkdown(data.content);
          updateLastMessage(processedContent);
          scrollToBottom();
        }
        break;
      case 'request_input':
        if (data.question) {
          setWaitingForInput(data.question, data.options);
          scrollToBottom();
        }
        break;
      case 'result':
        if (data.content) {
          const processedContent = processMarkdown(data.content);
          updateLastMessage(processedContent);
          analysisInProgress.value = false;
          scrollToBottom();
        }
        break;
    }
  });

  addMessage('您好！我是智能分析助手。请在左侧设置分析参数开始讨论。', 'agent');
});

const sendMessage = () => {
  if (!inputMessage.value.trim()) return;

  const content = inputMessage.value.trim();
  addMessage(content, 'user');
  clearInput();
  scrollToBottom();

  if (isWaitingForInput.value) {
    send({
      type: 'user_input',
      content
    });
    resetWaitingForInput();
  }
};

const handleStartAnalysis = (params: any) => {
  send({
    type: 'start_analysis',
    ...params
  });
  analysisInProgress.value = true;
  isPanelVisible.value = false;
};

const selectOption = (option: string) => {
  if (isWaitingForInput.value) {
    inputMessage.value = option;
    sendMessage();
  }
};

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

const togglePanel = () => {
  isPanelVisible.value = !isPanelVisible.value;
};

const exportChat = () => {
  const chatContent = messages.value
    .map(msg => {
      const sender = msg.type === 'user' ? '我' : '智能助手';
      // 移除 HTML 标签，保留纯文本
      const plainText = msg.content.replace(/<[^>]+>/g, '');
      return `${sender} (${msg.timestamp}):\n${plainText}\n`;
    })
    .join('\n---\n\n');

  const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `chat-export-${new Date().toISOString().slice(0, 10)}.txt`);
  message.success('聊天记录已导出');
};

const isFinalAnswer = (msg: ChatMessage) => {
  return msg.content.includes('Final Answer:') || 
         msg.content.includes('产品概念') ||
         msg.content.includes('最终分析结果');
};

const showResultDrawer = (msg: ChatMessage) => {
  selectedResult.value = msg;
  drawerVisible.value = true;
};

const exportToPDF = async (msg: ChatMessage) => {
  const element = document.createElement('div');
  element.innerHTML = msg.content;
  element.className = 'pdf-export markdown-body';
  
  const opt = {
    margin: 1,
    filename: `分析结果_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  try {
    message.loading('正在生成PDF...');
    await html2pdf().set(opt).from(element).save();
    message.success('PDF导出成功');
  } catch (error) {
    message.error('PDF导出失败');
    console.error('PDF export error:', error);
  }
};
</script>

<template>
  <div class="chat-layout">
    <AgentControlPanel 
      :class="{ visible: isPanelVisible }"
      @startAnalysis="handleStartAnalysis" 
    />
    
    <div class="chat-container">
      <!-- Header -->
      <div class="chat-header">
        <div class="header-left">
          <a-button type="text" @click="togglePanel">
            <MenuOutlined />
          </a-button>
          <h1>智能分析助手</h1>
          <a-tag 
            :class="['status-tag', connectionStatus.status === 'connected' ? 'pulse-success' : 'pulse-error']"
            :color="connectionStatus.status === 'connected' ? 'success' : 'error'"
          >
            {{ connectionStatus.status === 'connected' ? '在线' : 
               connectionStatus.status === 'connecting' ? '连接中' : '离线' }}
          </a-tag>
        </div>
        <div class="header-right">
          <a-button 
            type="text" 
            class="export-button"
            @click="exportChat"
          >
            <DownloadOutlined />
            导出记录
          </a-button>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="messages-area" ref="messageAreaRef">
        <div v-for="msg in messages" 
             :key="msg.id" 
             :class="['message-wrapper', msg.type, 'slide-up']">
          <div class="message-avatar">
            <a-avatar :class="[msg.type, msg.thinking ? 'avatar-pulse' : '']">
              {{ msg.type === 'user' ? '我' : 'AI' }}
            </a-avatar>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="sender-name">{{ msg.type === 'user' ? '我' : '智能助手' }}</span>
              <span class="message-time">{{ msg.timestamp }}</span>
            </div>
            <div class="message-bubble" :class="{ 'final-answer': isFinalAnswer(msg) }">
              <template v-if="msg.thinking">
                <div class="thinking-status">
                  思考中<span class="thinking-dots">...</span>
                </div>
              </template>
              <div v-else class="message-text markdown-body" v-html="msg.content"></div>
              <div v-if="isFinalAnswer(msg)" class="message-actions">
                <a-button type="link" size="small" @click="showResultDrawer(msg)">
                  <EyeOutlined />
                  查看详情
                </a-button>
                <a-button type="link" size="small" @click="exportToPDF(msg)">
                  <FilePdfOutlined />
                  导出PDF
                </a-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Question Display -->
        <div v-if="isWaitingForInput && currentQuestion" class="system-message fade-in">
          <div class="question-box">
            <div class="question-text">{{ currentQuestion }}</div>
            <div v-if="currentOptions.length > 0" class="options-list">
              <a-button
                v-for="option in currentOptions"
                :key="option"
                type="primary"
                ghost
                @click="selectOption(option)"
              >
                {{ option }}
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="input-container">
          <a-textarea
            v-model:value="inputMessage"
            :placeholder="isWaitingForInput ? '请输入您的回答...' : '请在左侧设置分析参数开始讨论'"
            :auto-size="{ minRows: 1, maxRows: 4 }"
            @keypress="handleKeyPress"
            :disabled="connectionStatus.status !== 'connected'"
            class="chat-input"
          />
          <a-button 
            type="primary"
            @click="sendMessage"
            :disabled="connectionStatus.status !== 'connected' || !inputMessage.trim()"
            class="send-button"
          >
            <template #icon><SendOutlined /></template>
            发送
          </a-button>
        </div>
        <div class="input-hint">
          <span>按 Enter 发送，Shift + Enter 换行</span>
        </div>
      </div>
    </div>

    <!-- Result Drawer -->
    <a-drawer
      v-model:visible="drawerVisible"
      title="分析结果详情"
      placement="right"
      :width="720"
      class="result-drawer"
    >
      <template v-if="selectedResult">
        <div class="result-content markdown-body" ref="resultContentRef">
          <div v-html="selectedResult.content"></div>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<style>
/* Markdown 样式 */
.markdown-body {
  color: inherit;
  line-height: 1.6;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 1em;
  margin-bottom: 0.5em;
  color: var(--text-primary);
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 { font-size: 1.5em; }
.markdown-body h2 { font-size: 1.4em; }
.markdown-body h3 { font-size: 1.3em; }
.markdown-body h4 { font-size: 1.2em; }
.markdown-body h5 { font-size: 1.1em; }
.markdown-body h6 { font-size: 1em; }

.markdown-body p {
  margin: 0.5em 0;
  line-height: 1.6;
}

.markdown-body code {
  background: rgba(0, 0, 0, 0.2);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
}

.markdown-body pre {
  background: rgba(0, 0, 0, 0.2);
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.8em 0;
}

.markdown-body pre code {
  background: none;
  padding: 0;
  border-radius: 0;
  font-size: 0.9em;
  color: inherit;
}

.markdown-body blockquote {
  border-left: 4px solid var(--primary-color);
  margin: 0.8em 0;
  padding: 0.5em 1em;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0 4px 4px 0;
  color: var(--text-secondary);
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.markdown-body li {
  margin: 0.3em 0;
}

.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.8em 0;
  font-size: 0.9em;
}

.markdown-body th,
.markdown-body td {
  border: 1px solid var(--border-color);
  padding: 0.5em 0.8em;
  text-align: left;
}

.markdown-body th {
  background: rgba(0, 0, 0, 0.1);
  font-weight: 600;
}

.markdown-body tr:nth-child(2n) {
  background: rgba(0, 0, 0, 0.05);
}

.markdown-body a {
  color: var(--primary-color);
  text-decoration: none;
  transition: all 0.3s;
}

.markdown-body a:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

.markdown-body img {
  max-width: 100%;
  border-radius: 4px;
  margin: 0.8em 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.markdown-body hr {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 1.5em 0;
}

/* 代码高亮主题覆盖 */
.hljs {
  background: transparent !important;
  padding: 0 !important;
}
</style>

<style scoped>
.chat-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: var(--panel-background);
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--chat-background);
}

.chat-header {
  padding: 16px 24px;
  background: var(--panel-background);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.export-button {
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.export-button:hover {
  color: var(--primary-color);
}

.messages-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.message-wrapper {
  display: flex;
  margin-bottom: 24px;
  gap: 12px;
  animation: messageIn 0.3s ease;
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar :deep(.ant-avatar) {
  width: 40px;
  height: 40px;
  font-size: 16px;
}

.message-avatar :deep(.ant-avatar.user) {
  background: var(--primary-color);
}

.message-avatar :deep(.ant-avatar.agent) {
  background: var(--success-color);
}

.message-content {
  flex: 1;
  max-width: 80%;
}

.message-header {
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sender-name {
  font-size: 14px;
  color: var(--text-primary);
}

.message-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.message-bubble {
  position: relative;
  background: var(--bubble-agent);
  padding: 12px 16px;
  border-radius: 12px;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s var(--spring);
  cursor: pointer;
}

.message-bubble:hover {
  transform: translateX(4px);
  background: var(--hover-bg);
}

.message-bubble.final-answer {
  border: 2px solid var(--primary-color);
  background: linear-gradient(
    to right,
    var(--bubble-agent),
    var(--panel-background)
  );
}

.message-wrapper.user .message-bubble {
  background: var(--bubble-user);
  border: none;
  color: white;
}

.thinking-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
}

.thinking-dots {
  animation: thinking 1.4s infinite;
}

@keyframes thinking {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60% { content: '...'; }
  80%, 100% { content: ''; }
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s var(--spring);
}

.message-bubble:hover .message-actions {
  opacity: 1;
  transform: translateY(0);
}

.system-message {
  margin: 24px 0;
  animation: messageIn 0.3s ease;
}

.question-box {
  background: var(--panel-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
}

.question-text {
  color: var(--text-primary);
  margin-bottom: 12px;
}

.options-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.input-area {
  padding: 16px 24px;
  background: var(--panel-background);
  border-top: 1px solid var(--border-color);
}

.input-container {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.chat-input {
  flex: 1;
  background: var(--chat-background);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s;
}

.chat-input:hover {
  border-color: var(--primary-color);
}

.chat-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(76, 110, 245, 0.1);
}

:deep(.ant-input) {
  background: var(--chat-background);
  color: var(--text-primary);
  padding: 8px 12px;
  font-size: 14px;
  resize: none;
}

:deep(.ant-input::placeholder) {
  color: var(--text-secondary);
}

.send-button {
  min-width: 80px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: var(--primary-color);
  margin-top: 1px;
  transition: all 0.3s var(--spring);
}

.send-button:hover {
  background: var(--primary-hover) !important;
}

.send-button:not(:disabled):hover {
  transform: translateX(-4px);
}

.input-hint {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.input-hint span {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 新增动画样式 */
.status-tag {
  transition: all var(--transition-normal) var(--spring);
}

.pulse-success {
  animation: pulseSuccess 2s infinite;
}

.pulse-error {
  animation: pulseError 2s infinite;
}

@keyframes pulseSuccess {
  0% { background: var(--success-color); }
  50% { background: rgba(52, 211, 153, 0.7); }
  100% { background: var(--success-color); }
}

@keyframes pulseError {
  0% { background: var(--error-color); }
  50% { background: rgba(248, 113, 113, 0.7); }
  100% { background: var(--error-color); }
}

.avatar-pulse {
  animation: avatarPulse 2s infinite var(--ease-in-out);
}

@keyframes avatarPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.result-drawer {
  :deep(.ant-drawer-content) {
    background: var(--panel-background);
  }

  :deep(.ant-drawer-header) {
    background: var(--panel-background);
    border-bottom: 1px solid var(--border-color);
  }

  :deep(.ant-drawer-title) {
    color: var(--text-primary);
  }
}

.result-content {
  padding: 20px;
  background: var(--chat-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* PDF导出样式 */
:global(.pdf-export) {
  padding: 20px;
  background: white;
  color: black;
}

:global(.pdf-export h1),
:global(.pdf-export h2),
:global(.pdf-export h3) {
  color: #1a1a1a;
  margin-bottom: 16px;
}

:global(.pdf-export pre),
:global(.pdf-export code) {
  background: #f6f8fa;
  border-radius: 4px;
  padding: 12px;
  margin: 8px 0;
}

@media (max-width: 768px) {
  .chat-layout {
    position: relative;
  }
}
</style>