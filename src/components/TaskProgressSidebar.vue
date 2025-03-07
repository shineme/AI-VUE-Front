<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useTaskProgress } from '../composables/useTaskProgress';
import AgentConfigModal from './AgentConfigModal.vue';
import TaskConfigModal from './TaskConfigModal.vue';
import { SaveOutlined } from '@ant-design/icons-vue';

const { tasks, agents, crewInfo, currentTaskId, activeAgentRole, animatingAgentRole } = useTaskProgress();

// 添加动画状态
const animatingTaskId = ref(null);

// 用于编辑智能体的状态
const selectedAgent = ref(null);
const configModalVisible = ref(false);

// 用于编辑任务的状态
const selectedTask = ref(null);
const taskConfigModalVisible = ref(false);

// 双击打开智能体编辑模态框
const handleAgentDoubleClick = (agent) => {
  selectedAgent.value = agent;
  configModalVisible.value = true;
};

// 双击打开任务编辑模态框
const handleTaskDoubleClick = (task) => {
  selectedTask.value = task;
  taskConfigModalVisible.value = true;
};

// 保存智能体设置
const handleSaveAgent = (updatedAgent) => {
  const index = agents.value.findIndex(a => a.role === updatedAgent.role);
  if (index !== -1) {
    agents.value[index] = updatedAgent;
  }
};

// 保存任务设置
const handleSaveTask = (updatedTask) => {
  const index = tasks.value.findIndex(t => t.id === updatedTask.id);
  if (index !== -1) {
    tasks.value[index] = updatedTask;
  }
};

// 保存所有设置
const handleSaveAllSettings = () => {
  const emitEvent = new CustomEvent('save-agent-settings');
  window.dispatchEvent(emitEvent);
};

// 监听任务状态变化事件
onMounted(() => {
  window.addEventListener('task-status-change', handleTaskStatusChange);
  window.addEventListener('agent-active-change', handleAgentActiveChange);
  window.addEventListener('taskStatusChanged', ((event: CustomEvent) => {
    const taskId = event.detail.taskId;
    animatingTaskId.value = taskId;
    setTimeout(() => {
      animatingTaskId.value = null;
    }, 5000);
  }) as EventListener);
  
  // 在onMounted中临时设置一个默认的活跃智能体，用于演示效果
  if (agents.value.length > 0 && !activeAgentRole.value) {
    setTimeout(() => {
      activeAgentRole.value = agents.value[0].role;
      // 触发动画效果
      animatingAgentRole.value = agents.value[0].role;
    }, 1000);
  }
});

onUnmounted(() => {
  window.removeEventListener('task-status-change', handleTaskStatusChange);
  window.removeEventListener('agent-active-change', handleAgentActiveChange);
  window.removeEventListener('taskStatusChanged', (() => {}) as EventListener);
});

const handleTaskStatusChange = (event) => {
  const { task, status } = event.detail;
  
  // 设置动画状态
  animatingTaskId.value = task.id;
  
  // 3秒后停止动画
  setTimeout(() => {
    animatingTaskId.value = null;
  }, 3000);
};

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
};

const getAgentName = (role) => {
  const agent = agents.value.find(a => a.role === role);
  return agent ? agent.name : '';
};

const getCurrentTaskName = () => {
  const task = tasks.value.find(t => t.id === currentTaskId);
  return task ? task.name : '';
};

// 获取智能体对应的emoji
const getAgentEmoji = (role: string): string => {
  if (!role) return '🤖';
  
  const roleMap: Record<string, string> = {
    'planner': '📝',
    'researcher': '🔍',
    'executor': '🛠️',
    'critic': '🔬',
    'pm': '📊',
    'product': '📊',
    '产品经理': '📊',
    'dev': '👨‍💻',
    'developer': '👨‍💻',
    '开发者': '👨‍💻',
    'designer': '🎨',
    '设计师': '🎨',
    'writer': '✍️',
    '撰写员': '✍️',
    'data': '📈',
    'analyst': '📈',
    '分析师': '📈',
    'qa': '🔍',
    'tester': '🔍',
    '测试员': '🔍',
    'manager': '👨‍💼',
    'marketer': '📢',
    'reviewer': '📋',
    'assistant': '🤖'
  };
  
  // 尝试完全匹配
  const lowercaseRole = role.toLowerCase();
  if (roleMap[lowercaseRole]) {
    return roleMap[lowercaseRole];
  }
  
  // 尝试部分匹配
  for (const [key, emoji] of Object.entries(roleMap)) {
    if (lowercaseRole.includes(key) || key.includes(lowercaseRole)) {
      return emoji;
    }
  }
  
  return '🤖';
};
</script>

<template>
  <div class="task-progress-sidebar">
    <!-- 智能体配置模态框 -->
    <AgentConfigModal
      v-model:visible="configModalVisible"
      :agent="selectedAgent"
      :llmModels="crewInfo?.llm_models || {}"
      @save="handleSaveAgent"
    />
    
    <!-- 任务配置模态框 -->
    <TaskConfigModal
      v-model:visible="taskConfigModalVisible"
      :task="selectedTask"
      :agents="agents"
      @save="handleSaveTask"
    />
    
    <div class="header-actions">
      <a-button 
        shape="circle" 
        size="small"
        title="保存配置"
        @click="handleSaveAllSettings"
      >
        <template #icon><SaveOutlined /></template>
      </a-button>
    </div>
    
    <!-- 智能体列表 -->
    <div v-if="agents.length > 0" class="section-title">
      <h3>智能体</h3>
    </div>
    <div class="agents-list">
      <div
        v-for="agent in agents"
        :key="agent.role"
        class="agent-item"
        :class="{ 
          'disabled': agent.enabled === false,
          'agent-active': agent.role === activeAgentRole,
          'animating': animatingAgentRole === agent.role
        }"
        @dblclick="handleAgentDoubleClick(agent)"
      >
        <!-- 添加活跃状态指示器 -->
        <div v-if="agent.role === activeAgentRole" class="agent-activity-indicator"></div>
        
        <!-- 活跃智能体左侧添加箭头指示器 -->
        <div v-if="agent.role === activeAgentRole" class="active-agent-indicator">
          <div class="indicator-arrow"></div>
        </div>
        
        <div class="agent-icon">{{ getAgentEmoji(agent.role) }}</div>
        <div class="agent-content">
          <div class="agent-name">{{ agent.role }}</div>
          <div class="agent-model">{{ agent.llm }}</div>
        </div>
        <div class="agent-indicator">
          <div 
            :class="[
              'status-dot',
              agent.enabled !== false ? 'enabled' : 'disabled'
            ]"
          ></div>
        </div>
        <!-- 只在活跃智能体上显示工作指示器 -->
        <div v-if="agent.role === activeAgentRole" class="agent-working-indicator">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    </div>
    
    <!-- 任务列表 -->
    <div class="section-title">
      <h3>任务进度</h3>
    </div>
    <div class="tasks-list">
      <div
        v-for="task in tasks"
        :key="task.id"
        :class="[
          'task-item',
          { 'current': currentTaskId === task.id },
          { 'disabled': task.enabled === false },
          { 'task-status-changed': animatingTaskId === task.id },
          task.status
        ]"
        @dblclick="handleTaskDoubleClick(task)"
      >
        <div class="task-icon">{{ task.icon }}</div>
        <div class="task-content">
          <div class="task-name">{{ task.name }}</div>
          <div class="task-status">
            <span v-if="task.status === 'pending'">未开始</span>
            <span v-else-if="task.status === 'in-progress'">进行中</span>
            <span v-else-if="task.status === 'completed'">已完成</span>
          </div>
        </div>
        <div class="task-indicator">
          <div 
            :class="[
              'status-dot',
              task.status === 'completed' ? 'completed' :
              task.status === 'in-progress' ? 'in-progress' : 'pending'
            ]"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-progress-sidebar {
  width: 240px;
  height: 100%;
  background-color: var(--sidebar-bg, #1e293b);
  color: var(--text-primary, #e2e8f0);
  display: flex;
  flex-direction: column;
  padding: 1rem 0.5rem;
  overflow-y: auto;
  border-right: 1px solid var(--border-color, #2d3748);
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  margin-top: 20px;
  margin-bottom: 10px;
}

.section-title h3 {
  font-size: 15px;
  margin: 0;
  color: var(--text-primary, #e2e8f0);
}

.agents-list {
  margin-bottom: 20px;
}

.agent-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: var(--item-background, #2d3748);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
}

.agent-item:hover {
  background-color: var(--item-hover-background, #3a4a5e);
}

.agent-active {
  background-color: var(--active-agent-background, rgba(99, 102, 241, 0.1));
  border-left: 3px solid var(--active-agent-border, rgba(99, 102, 241, 0.6));
  transform: translateX(3px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 10;
}

.active-agent-indicator {
  position: absolute;
  left: -10px;
  top: 0;
  height: 100%;
  width: 20px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.indicator-arrow {
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-right: 10px solid var(--primary-color, #6366f1);
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background-color: var(--item-background, #2d3748);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  gap: 12px;
  position: relative;
  transition: all 0.2s ease-in-out;
}

.task-item {
  border-left: 4px solid var(--pending-color, #9ca3af);
}

.task-item.in-progress {
  border-left: 4px solid var(--in-progress-color, #60a5fa);
}

.task-item.completed {
  border-left: 4px solid var(--completed-color, #34d399);
}

.task-item.current {
  background-color: rgba(96, 165, 250, 0.1);
  box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.5);
}

.agent-item.disabled,
.task-item.disabled {
  opacity: 0.6;
  background-color: rgba(243, 244, 246, 0.5);
  border: 1px dashed rgba(245, 108, 108, 0.3);
}

.agent-item.agent-active {
  background-color: rgba(96, 165, 250, 0.2);
  position: relative;
  border: none !important;
  z-index: 1;
}

.agent-item.animating {
  animation: pulse 2s infinite;
}

.task-icon,
.agent-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--icon-background, #f3f4f6);
  color: var(--text-primary, #e2e8f0);
}

.agent-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background-color: var(--icon-background, rgba(99, 102, 241, 0.1));
  margin-right: 12px;
  font-size: 18px;
}

.task-content,
.agent-content {
  flex: 1;
  min-width: 0;
}

.agent-content {
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
}

.task-name,
.agent-name {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-primary, #e2e8f0);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-name {
  font-weight: 500;
  margin-bottom: 2px;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary, #e2e8f0);
}

.task-status,
.agent-model {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}

.agent-model {
  font-size: 12px;
  color: var(--text-secondary, #a0aec0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-status span,
.agent-model span {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.enabled {
  background-color: var(--primary-color, #60a5fa);
}

.status-dot.disabled {
  background-color: var(--text-secondary, #9ca3af);
}

.status-dot.completed {
  background-color: var(--completed-color, #34d399);
}

.status-dot.pending {
  background-color: var(--text-secondary, #9ca3af);
}

.status-dot.in-progress {
  animation: pulse 2s infinite;
  background-color: var(--active-color, #60a5fa);
}

.agent-indicator {
  margin-left: auto;
}

.agent-activity-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, 
    var(--agent-activity-gradient-1, #6366f1) 0%, 
    var(--agent-activity-gradient-2, #8b5cf6) 100%
  );
  animation: indicator-slide 2s infinite linear;
  background-size: 200% 100%;
}

.task-status-changed {
  animation: task-status-change 2s ease-in-out;
}

.agent-working-indicator {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.agent-working-indicator .dot {
  width: 5px;
  height: 5px;
  margin: 0 2px;
  background-color: var(--agent-activity-gradient-1, #6366f1);
  border-radius: 50%;
  display: inline-block;
  animation: dot-pulse 1.5s infinite ease-in-out;
}

.agent-working-indicator .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.agent-working-indicator .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(96, 165, 250, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(96, 165, 250, 0);
  }
}

@keyframes task-status-change {
  0% {
    transform: scale(1);
    background-color: rgba(96, 165, 250, 0.1);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(96, 165, 250, 0.5);
    background-color: rgba(96, 165, 250, 0.2);
  }
  100% {
    transform: scale(1);
    background-color: rgba(96, 165, 250, 0.1);
  }
}

@keyframes marquee-border {
  0% { background-position: 0% 0%; }
  100% { background-position: 300% 0%; }
}

@keyframes indicator-slide {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 100% 0%;
  }
}

.animating {
  animation: agent-highlight 1.5s ease;
}

@keyframes agent-highlight {
  0% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.8);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}

@keyframes dot-pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
}
</style>