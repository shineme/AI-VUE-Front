<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { 
  UploadOutlined, 
  ThunderboltOutlined, 
  SearchOutlined,
  FileTextOutlined,
  NumberOutlined,
  InfoCircleOutlined,
  TeamOutlined
} from '@ant-design/icons-vue';
import type { UploadProps } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import { useTaskProgress } from '../composables/useTaskProgress';
import { HTTP_ENDPOINTS } from '../config/api';

const topic = ref('');
const maxInteractions = ref(3);
const fileList = ref<any[]>([]);
const description = ref('');
const crewTypes = ref<{[key: string]: string}>({});
const crewTypeOptions = ref<{value: string, label: string}[]>([]);
const selectedCrewType = ref('');
const loadingCrewTypes = ref(false);

const { fetchCrewInfo, activeAgentRole } = useTaskProgress();
// 为跟踪当前活跃的智能体
const animatingAgentRole = ref(null);

// 监听智能体活跃状态变化
onMounted(() => {
  window.addEventListener('agent-active-change', handleAgentActiveChange);
  fetchCrewTypes();
});

onUnmounted(() => {
  window.removeEventListener('agent-active-change', handleAgentActiveChange);
});

const handleAgentActiveChange = (event) => {
  const { role } = event.detail;
  
  // 设置智能体动画状态
  animatingAgentRole.value = role;
  
  // 5秒后重置，保持一段时间的活跃状态
  setTimeout(() => {
    if (animatingAgentRole.value === role) {
      animatingAgentRole.value = null;
    }
  }, 5000);
  
  console.log(`智能体活跃状态变化: ${role}`);
};

const fetchCrewTypes = async () => {
  loadingCrewTypes.value = true;
  try {
    const response = await fetch(HTTP_ENDPOINTS.CREW_TYPES);
    const data = await response.json();
    
    if (data.crew_types && typeof data.crew_types === 'object') {
      // 转换对象为数组用于选择框
      const options = Object.entries(data.crew_types).map(([key, value]) => ({
        value: key,
        label: value as string
      }));
      
      crewTypeOptions.value = options;
      
      // 自动选择第一个选项
      if (options.length > 0) {
        selectedCrewType.value = options[0].value;
        // 获取第一个智能体类型的任务信息
        fetchCrewInfo(selectedCrewType.value);
      }
    } else if (Array.isArray(data)) {
      crewTypes.value = data;
    }
  } catch (error) {
    console.error('Error fetching crew types:', error);
    message.error('获取团队类型失败');
  } finally {
    loadingCrewTypes.value = false;
  }
};

watch(selectedCrewType, (newCrewType) => {
  if (newCrewType) {
    fetchCrewInfo(newCrewType);
  }
});

const uploadProps: UploadProps = {
  name: 'file',
  multiple: false,
  fileList: fileList.value,
  onChange(info) {
    fileList.value = info.fileList;
  },
};

const emit = defineEmits(['startAnalysis']);

const handleStartAnalysis = () => {
  emit('startAnalysis', {
    type: "start_analysis",
    topic: topic.value,
    maxInteractions: maxInteractions.value,
    description: description.value,
    files: fileList.value,
    crew_type: selectedCrewType.value
  });
};

const quickTopics = [
  { text: '智能手表', color: 'blue' },
  { text: '短视频社交平台', color: 'cyan' },
  { text: '人工智能应用', color: 'purple' },
  { text: '新能源汽车', color: 'green' }
];
</script>

<template>
  <div class="control-panel">
    <div class="panel-header">
      <h2 class="panel-title">
        <ThunderboltOutlined class="title-icon" />
        智能体讨论控制面板
      </h2>
    </div>
    
    <div class="panel-content">
      <!-- 智能体类型选择 -->
      <div class="section crew-type-section">
        <div class="section-header">
          <TeamOutlined class="section-icon" />
          <h3>智能体类型</h3>
        </div>
        <a-select
          v-model:value="selectedCrewType"
          :loading="loadingCrewTypes"
          placeholder="请选择智能体类型"
          class="crew-type-select"
        >
          <a-select-option 
            v-for="option in crewTypeOptions" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </a-select-option>
        </a-select>
      </div>
      
      <!-- 分析主题部分 -->
      <div class="section topic-section">
        <div class="section-header">
          <SearchOutlined class="section-icon" />
          <h3>分析主题</h3>
        </div>
        <div class="topic-input-wrapper">
          <a-input
            v-model:value="topic"
            placeholder="请输入您想分析的主题..."
            allow-clear
            class="topic-input"
          />
          <div class="topic-examples">
            <span class="examples-label">快速选择：</span>
            <div class="tags-wrapper">
              <a-tag
                v-for="item in quickTopics"
                :key="item.text"
                :color="item.color"
                class="topic-tag"
                @click="topic = item.text"
              >
                {{ item.text }}
              </a-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 交互次数部分 -->
      <div class="section">
        <div class="section-header">
          <NumberOutlined class="section-icon" />
          <h3>交互次数</h3>
        </div>
        <a-input-number
          v-model:value="maxInteractions"
          :min="1"
          :max="10"
          class="custom-input-number"
          placeholder="设置AI回复次数上限"
        >
          <template #addonAfter>次</template>
        </a-input-number>
      </div>

      <!-- 文件上传部分 -->
      <div class="section">
        <div class="section-header">
          <FileTextOutlined class="section-icon" />
          <h3>参考资料</h3>
        </div>
        <a-upload v-bind="uploadProps" class="upload-area">
          <div class="upload-content">
            <UploadOutlined class="upload-icon" />
            <div class="upload-text">
              <span class="primary-text">点击或拖拽文件</span>
              <span class="secondary-text">支持 PDF、Word、TXT 等格式</span>
            </div>
          </div>
        </a-upload>
      </div>

      <!-- 文件描述部分 -->
      <div class="section">
        <div class="section-header">
          <InfoCircleOutlined class="section-icon" />
          <h3>补充说明 <span class="optional-text">(可选)</span></h3>
        </div>
        <a-textarea
          v-model:value="description"
          :rows="3"
          placeholder="请输入补充说明或特殊要求..."
          class="custom-textarea"
        />
      </div>

      <!-- 开始按钮 -->
      <a-button 
        type="primary"
        block
        size="large"
        class="start-button"
        @click="handleStartAnalysis"
        :disabled="!topic"
      >
        <template #icon><ThunderboltOutlined /></template>
        开始分析
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  width: 320px;
  height: 100%;
  background: var(--panel-background);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(
    to right,
    var(--panel-background),
    var(--chat-background)
  );
}

.panel-title {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  color: var(--primary-color);
  font-size: 20px;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.section {
  margin-bottom: 24px;
  animation: slideUp 0.3s var(--spring);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-icon {
  color: var(--primary-color);
  font-size: 16px;
}

h3 {
  margin: 0;
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.optional-text {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: normal;
}

.topic-section {
  margin-bottom: 28px;
}

.topic-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.topic-input {
  width: 100%;
}

.topic-examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.examples-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-tag {
  cursor: pointer;
  transition: all 0.3s var(--spring);
  padding: 2px 8px;
  border: none;
}

.topic-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.custom-input-number {
  width: 100%;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.ant-upload) {
  width: 100%;
  background: var(--chat-background);
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
}

.upload-area :deep(.ant-upload:hover) {
  border-color: var(--primary-color);
  background: var(--hover-bg);
}

.upload-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  font-size: 24px;
  color: var(--text-secondary);
}

.upload-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.primary-text {
  color: var(--text-primary);
  font-size: 14px;
}

.secondary-text {
  color: var(--text-secondary);
  font-size: 12px;
}

.start-button {
  margin-top: 32px;
  height: 48px;
  font-size: 16px;
  background: var(--primary-color);
  border: none;
  border-radius: 8px;
  transition: all 0.3s var(--spring);
}

.start-button:not(:disabled):hover {
  background: var(--primary-hover) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.2);
}

.start-button:not(:disabled):active {
  transform: translateY(0);
}

/* 输入框样式覆盖 */
:deep(.ant-input),
:deep(.ant-input-number),
:deep(.ant-input-number-input),
:deep(.ant-textarea) {
  background: white !important;
  color: var(--text-dark) !important;
  border: 1px solid var(--border-color);
  transition: all 0.3s;
}

:deep(.ant-input:hover),
:deep(.ant-input-number:hover),
:deep(.ant-textarea:hover) {
  border-color: var(--primary-color);
}

:deep(.ant-input:focus),
:deep(.ant-input-number:focus),
:deep(.ant-textarea:focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
}

:deep(.ant-input::placeholder),
:deep(.ant-input-number-input::placeholder),
:deep(.ant-textarea::placeholder) {
  color: rgba(30, 41, 59, 0.5) !important;
}

.crew-type-select {
  width: 100%;
  margin-bottom: 8px;
}

.crew-type-select :deep(.ant-select-selector) {
  background-color: var(--chat-background) !important;
  border-color: var(--border-color) !important;
  color: var(--text-primary) !important;
}

.crew-type-select:hover :deep(.ant-select-selector) {
  border-color: var(--primary-color) !important;
}

.crew-type-section {
  animation: slideUp 0.3s var(--spring);
  animation-delay: 0.1s;
  opacity: 0;
  animation-fill-mode: forwards;
}

@media (max-width: 768px) {
  .control-panel {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .control-panel.visible {
    transform: translateX(0);
  }
}

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
</style>