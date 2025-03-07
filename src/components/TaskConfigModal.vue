<script setup lang="ts">
import { ref, watch, toRefs, computed } from 'vue';
import { Task, Agent } from '../composables/useTaskProgress';

const props = defineProps<{
  visible: boolean;
  task: Task | null;
  agents: Agent[];
}>();

const { visible, task, agents } = toRefs(props);

const emit = defineEmits(['update:visible', 'save']);

const editedTask = ref<Task | null>(null);
const isTaskEnabled = computed({
  get: () => editedTask.value?.enabled !== false,
  set: (value) => {
    if (editedTask.value) {
      editedTask.value.enabled = value;
    }
  }
});

watch(task, (newTask) => {
  if (newTask) {
    // 创建一个深拷贝以避免直接修改原始对象
    editedTask.value = JSON.parse(JSON.stringify(newTask));
  } else {
    editedTask.value = null;
  }
}, { immediate: true });

const handleCancel = () => {
  emit('update:visible', false);
};

const handleSave = () => {
  if (editedTask.value) {
    emit('save', editedTask.value);
    emit('update:visible', false);
  }
};
</script>

<template>
  <a-modal
    :visible="visible"
    title="任务配置"
    @cancel="handleCancel"
    :footer="null"
    width="650px"
    destroyOnClose
  >
    <template v-if="editedTask">
      <div class="task-config">
        <div class="config-form">
          <div class="form-item">
            <div class="field-heading">
              <div class="item-label">任务描述</div>
              <span class="field-required">*必填</span>
            </div>
            <div class="item-description">
              详细描述任务内容、目标和要求。可以使用{topic_context}和{file_context}作为占位符。
            </div>
            <a-textarea 
              v-model:value="editedTask.description" 
              :autoSize="{ minRows: 4, maxRows: 8 }"
              placeholder="例如：基于当前市场趋势，提出2个{topic_context}创新产品概念..." 
            />
          </div>
          
          <div class="form-item">
            <div class="field-heading">
              <div class="item-label">预期输出</div>
              <span class="field-required">*必填</span>
            </div>
            <div class="item-description">
              描述任务完成后应该产生的结果或交付物。
            </div>
            <a-input 
              v-model:value="editedTask.expected_output" 
              placeholder="例如：详细的产品概念文档，包含2个产品创意" 
            />
          </div>
          
          <div class="form-item">
            <div class="field-heading">
              <div class="item-label">执行角色</div>
              <span class="field-required">*必填</span>
            </div>
            <div class="item-description">
              选择负责执行此任务的智能体角色。
            </div>
            <a-select
              v-model:value="editedTask.agent_role"
              style="width: 100%"
              placeholder="选择执行此任务的智能体"
            >
              <a-select-option 
                v-for="agent in agents" 
                :key="agent.role" 
                :value="agent.role"
              >
                {{ agent.role }}
              </a-select-option>
            </a-select>
          </div>
          
          <div class="form-item checkbox-item">
            <a-checkbox v-model:checked="isTaskEnabled">
              <span class="checkbox-label">启用此任务</span>
            </a-checkbox>
            <div class="item-description checkbox-description">
              禁用的任务将不会被执行。
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
.task-config {
  padding: 0 10px;
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
