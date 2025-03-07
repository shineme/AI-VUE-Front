<script setup lang="ts">
import { ref, watch, toRefs, computed } from 'vue';
import { Agent } from '../composables/useTaskProgress';

const props = defineProps<{
  visible: boolean;
  agent: Agent | null;
  llmModels: Record<string, string>;
}>();

const { visible, agent, llmModels } = toRefs(props);

const emit = defineEmits(['update:visible', 'save']);

const editedAgent = ref<Agent | null>(null);
const isAgentEnabled = computed({
  get: () => editedAgent.value?.enabled !== false,
  set: (value) => {
    if (editedAgent.value) {
      editedAgent.value.enabled = value;
    }
  }
});

watch(agent, (newAgent) => {
  if (newAgent) {
    // 创建一个深拷贝以避免直接修改原始对象
    editedAgent.value = JSON.parse(JSON.stringify(newAgent));
  } else {
    editedAgent.value = null;
  }
}, { immediate: true });

const handleCancel = () => {
  emit('update:visible', false);
};

const handleSave = () => {
  if (editedAgent.value) {
    emit('save', editedAgent.value);
    emit('update:visible', false);
  }
};
</script>

<template>
  <a-modal
    :visible="visible"
    title="智能体配置"
    @cancel="handleCancel"
    :footer="null"
    width="650px"
    destroyOnClose
  >
    <template v-if="editedAgent">
      <div class="agent-config">
        <div class="config-header">
          <h2><span class="role-tag">{{ editedAgent.role }}</span> 智能体设置</h2>
        </div>
        
        <div class="config-form">
          <div class="form-item">
            <div class="field-heading">
              <div class="item-label">目标</div>
              <span class="field-required">*必填</span>
            </div>
            <div class="item-description">
              描述该智能体的主要目标和职责。清晰的目标有助于智能体更好地完成任务。
            </div>
            <a-textarea 
              v-model:value="editedAgent.goal" 
              :autoSize="{ minRows: 2, maxRows: 4 }"
              placeholder="例如：作为产品分析师，你的目标是全面分析目标产品的特点、优势和不足..." 
            />
          </div>
          
          <div class="form-item">
            <div class="field-heading">
              <div class="item-label">背景描述</div>
              <span class="field-required">*必填</span>
            </div>
            <div class="item-description">
              为智能体提供详细的背景信息，包括其知识领域、专长和行为特点。
            </div>
            <a-textarea 
              v-model:value="editedAgent.backstory" 
              :autoSize="{ minRows: 3, maxRows: 6 }"
              placeholder="例如：你是一位资深产品分析师，有10年的产品分析经验，擅长从用户需求和市场角度分析产品..." 
            />
          </div>
          
          <div class="form-item">
            <div class="field-heading">
              <div class="item-label">LLM 模型</div>
              <span class="field-required">*必填</span>
            </div>
            <div class="item-description">
              选择驱动此智能体的大语言模型。不同模型有不同的特性和能力。
            </div>
            <a-select
              v-model:value="editedAgent.llm"
              style="width: 100%"
              placeholder="选择LLM模型"
            >
              <a-select-option 
                v-for="(modelName, modelKey) in llmModels" 
                :key="modelKey" 
                :value="modelKey"
              >
                {{ modelName }} ({{ modelKey }})
              </a-select-option>
            </a-select>
          </div>
          
          <div class="form-item checkbox-item">
            <a-checkbox v-model:checked="isAgentEnabled">
              <span class="checkbox-label">启用此智能体</span>
            </a-checkbox>
            <div class="item-description checkbox-description">
              禁用的智能体将不会参与到任务执行过程中。
            </div>
          </div>
        </div>
        
        <div class="config-actions">
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" @click="handleSave">保存设置</a-button>
        </div>
      </div>
    </template>
  </a-modal>
</template>

<style scoped>
.agent-config {
  padding: 0 10px;
}

.config-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8e8e8;
}

.config-header h2 {
  margin: 0;
  font-size: 20px;
  color: #1890ff;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  margin-bottom: 4px;
}

.checkbox-item {
  margin-top: 5px;
}

.checkbox-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.checkbox-description {
  margin-top: 4px;
  margin-left: 24px;
}

.item-label {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
}

.item-description {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 8px;
  line-height: 1.5;
}

.config-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.role-tag {
  display: inline-block;
  background-color: rgba(24, 144, 255, 0.1);
  color: #1890ff;
  font-size: 14px;
  padding: 2px 10px;
  border-radius: 4px;
  margin-right: 8px;
}

.field-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.field-required {
  color: #ff4d4f;
  font-size: 13px;
  font-weight: 500;
}

/* Input styles for light theme */
:deep(.ant-input) {
  background-color: #fff;
  border-color: #d9d9d9;
  color: rgba(0, 0, 0, 0.85);
}

:deep(.ant-input:focus),
:deep(.ant-input:hover) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

:deep(.ant-input::placeholder) {
  color: rgba(0, 0, 0, 0.25);
}

:deep(.ant-select:not(.ant-select-disabled):hover .ant-select-selector) {
  border-color: #1890ff;
}

:deep(.ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

:deep(.ant-select-selector) {
  background-color: #fff !important;
  border-color: #d9d9d9 !important;
  color: rgba(0, 0, 0, 0.85) !important;
}

:deep(.ant-select-selection-placeholder) {
  color: rgba(0, 0, 0, 0.25);
}

:deep(.ant-select-selection-item) {
  color: rgba(0, 0, 0, 0.85);
}

:deep(.ant-modal-header) {
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 2px 2px 0 0;
}

:deep(.ant-modal-title) {
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
}

:deep(.ant-modal-close) {
  color: rgba(0, 0, 0, 0.45);
}

:deep(.ant-modal-close:hover) {
  color: rgba(0, 0, 0, 0.75);
}

:deep(.ant-modal-content) {
  background-color: #fff;
  box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
}
</style>
