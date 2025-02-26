<script setup lang="ts">
import { useTaskProgress } from '../composables/useTaskProgress';

const { tasks, currentTaskId } = useTaskProgress();
</script>

<template>
  <div class="task-progress-sidebar">
    <div class="sidebar-header">
      <h2>任务进度</h2>
    </div>
    <div class="tasks-list">
      <div
        v-for="task in tasks"
        :key="task.id"
        :class="[
          'task-item',
          { 'current': currentTaskId === task.id },
          task.status
        ]"
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
  background: var(--panel-background);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(
    to left,
    var(--panel-background),
    var(--chat-background)
  );
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
  font-weight: 600;
}

.tasks-list {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: var(--chat-background);
  border: 1px solid var(--border-color);
  transition: all 0.3s var(--spring);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.task-item:hover {
  transform: translateX(-4px);
  background: var(--hover-bg);
}

.task-item.current {
  border-color: var(--primary-color);
  background: linear-gradient(
    to right,
    var(--chat-background),
    var(--panel-background)
  );
}

.task-icon {
  font-size: 20px;
  margin-right: 12px;
  width: 24px;
  text-align: center;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-name {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-status {
  font-size: 12px;
  color: var(--text-secondary);
}

.task-indicator {
  margin-left: 8px;
  display: flex;
  align-items: center;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.3s var(--spring);
}

.status-dot.pending {
  background: var(--text-secondary);
}

.status-dot.in-progress {
  background: var(--primary-color);
  animation: pulse 2s infinite;
}

.status-dot.completed {
  background: var(--success-color);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 1024px) {
  .task-progress-sidebar {
    display: none;
  }
}
</style>