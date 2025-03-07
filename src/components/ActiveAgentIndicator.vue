<template>
  <div class="active-agent-container" v-show="showComponent">
    <div class="active-agent-flow">
      <div class="flow-diagram">
        <!-- 环节1：起始点 -->
        <div class="flow-node start-node">启动</div>
        <div class="flow-arrow"></div>
        
        <!-- 环节2：当前智能体 -->
        <div class="flow-node agent-node">
          <span v-if="getAgentEmoji(currentRole)" class="agent-emoji">{{ getAgentEmoji(currentRole) }}</span>
          <span v-else class="agent-emoji">🤖</span>
          {{ currentRole || '智能助手' }}
        </div>
        <div class="flow-arrow"></div>
        
        <!-- 环节3：任务 -->
        <div class="flow-node task-node" :title="currentTask">
          {{ truncateText(currentTask || '思考中...', 12) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useTaskProgress } from '../composables/useTaskProgress';

const { activeAgentRole, tasks, currentTaskId } = useTaskProgress();
const currentRole = ref(activeAgentRole.value || 'assistant'); // 默认角色
const currentTask = ref(''); // 当前任务
const showComponent = computed(() => currentRole.value !== ''); // 只有当有角色时才显示组件

// 正则表达式匹配ANSI转义序列
const ansiRegex = /\u001b\[\d+m/g;

// emoji到角色的映射
const emojiToRole = {
  '📝': 'planner',
  '👨‍💼': 'manager',
  '🔍': 'researcher',
  '📊': 'analyst',
  '💻': 'developer',
  '🎨': 'designer',
  '📢': 'marketer',
  '📋': 'reviewer',
  '🤖': 'assistant'
};

// 角色到emoji的映射（反向映射）
const roleToEmoji: Record<string, string> = {};
Object.entries(emojiToRole).forEach(([emoji, role]) => {
  roleToEmoji[role] = emoji;
});

// 获取角色对应的emoji
const getAgentEmoji = (role: string): string => {
  // 直接匹配
  if (roleToEmoji[role]) {
    return roleToEmoji[role];
  }
  
  // 尝试智能匹配
  const lowercaseRole = role.toLowerCase();
  if (lowercaseRole.includes('plan') || lowercaseRole.includes('产品')) return '📝';
  if (lowercaseRole.includes('manage') || lowercaseRole.includes('管理')) return '👨‍💼';
  if (lowercaseRole.includes('research') || lowercaseRole.includes('研究')) return '🔍';
  if (lowercaseRole.includes('analy') || lowercaseRole.includes('分析')) return '📊';
  if (lowercaseRole.includes('dev') || lowercaseRole.includes('开发')) return '💻';
  if (lowercaseRole.includes('design') || lowercaseRole.includes('设计')) return '🎨';
  if (lowercaseRole.includes('market') || lowercaseRole.includes('营销')) return '📢';
  if (lowercaseRole.includes('review') || lowercaseRole.includes('审核')) return '📋';
  
  // 默认返回机器人emoji
  return '🤖';
};

// 截断文本函数
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

// 获取当前任务名称
const currentTaskName = computed(() => {
  if (!currentTaskId.value) return null;
  const task = tasks.value.find(t => t.id === currentTaskId.value);
  return task ? task.name : null;
});

// 处理WebSocket消息
const handleWsMessage = (event: CustomEvent) => {
  const { data } = event.detail;
  if (!data) return;
  
  try {
    const parsedData = JSON.parse(data);
    
    // 直接处理开始分析消息
    if (parsedData.type === 'start_analysis') {
      const topic = parsedData.topic || '';
      console.log(`开始分析主题: ${topic}`);
      // 更新当前任务
      currentTask.value = topic;
    }
    
    // 处理用户请求消息
    if (parsedData.type === 'user_request') {
      const content = parsedData.content || '';
      currentTask.value = truncateText(content, 20);
      console.log(`用户请求: ${content}`);
    }
    
    if (parsedData.type === 'update' && parsedData.content) {
      const content = parsedData.content;
      console.log('解析WebSocket消息:', content);
      
      // 检查是否包含emoji，可能表示角色
      const emojiMatch = content.match(/^([\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+)/u);
      if (emojiMatch && emojiMatch[1]) {
        const emoji = emojiMatch[1];
        console.log(`检测到可能的角色表情: ${emoji}`);
        
        // 查找emoji对应的角色
        if (emojiToRole[emoji]) {
          currentRole.value = emojiToRole[emoji];
          console.log(`根据emoji设置当前角色为: ${currentRole.value}`);
        }
      }
      
      // 查找常见的角色表示形式
      const rolePatterns = [
        // 例如: 产品经理 AI:
        /^([^:：]+)(AI|智能体|Agent|助手)[:\s]/i,
        // 例如: AI 产品经理:
        /^(AI|智能体|Agent|助手)\s+([^:：]+)[:\s]/i,
        // 例如: [产品经理]:
        /\[([^\]]+)\]/,
        // 例如: <产品经理>
        /<([^>]+)>/,
        // 例如: 「产品经理」
        /「([^」]+)」/,
        // 例如: 【产品经理】
        /【([^】]+)】/
      ];
      
      for (const pattern of rolePatterns) {
        const match = content.match(pattern);
        if (match) {
          const role = match[1] || match[2];
          if (role && role.length < 20) { // 避免匹配到整句话
            currentRole.value = role.trim();
            console.log(`从消息中提取智能体角色: ${currentRole.value}`);
            break;
          }
        }
      }
      
      // 尝试提取智能体角色
      const role = parseAgentRole(content);
      if (role) {
        currentRole.value = role;
        console.log(`从parseAgentRole提取智能体角色: ${role}`);
      }
    }
  } catch (e) {
    console.error('解析WebSocket消息失败', e);
  }
};

// 解析Agent身份
const parseAgentRole = (message: string): string | null => {
  // 去除ANSI转义序列
  const cleanedMessage = message.replace(ansiRegex, '');
  
  // 直接匹配常见的角色标识
  const commonRoles = [
    'planner', 'manager', 'researcher', 'analyst', 
    'developer', 'designer', 'marketer', 'reviewer',
    'assistant', 'conductor', '产品经理', '研究员',
    '开发者', '设计师', '营销专员', '审核员', '助手'
  ];
  
  // 查找直接的角色引用
  for (const role of commonRoles) {
    // 检查是否以角色名称开头
    if (cleanedMessage.trim().toLowerCase().startsWith(role.toLowerCase() + ':')) {
      return role;
    }
    
    // 检查是否包含"我是XX角色"
    const iAmRolePattern = new RegExp(`我是(${role})`, 'i');
    const iAmMatch = cleanedMessage.match(iAmRolePattern);
    if (iAmMatch) {
      return iAmMatch[1];
    }
  }
  
  // 特定格式检测: Agent: 产品经理
  const agentFormatMatch = cleanedMessage.match(/Agent:\s+([^\n]+)/);
  if (agentFormatMatch && agentFormatMatch[1]) {
    return agentFormatMatch[1].trim();
  }
  
  // 特定格式检测: # Agent: 产品经理
  const hashAgentMatch = cleanedMessage.match(/# Agent:\s+([^\n]+)/);
  if (hashAgentMatch && hashAgentMatch[1]) {
    return hashAgentMatch[1].trim();
  }
  
  // 尝试从其他格式提取
  const rolePattern = /【([^】]+)】|^(\w+Agent)\b|^(\w+助手)\b|^(\w+-agent)\b/i;
  const match = cleanedMessage.match(rolePattern);
  if (match) {
    const role = match[1] || match[2] || match[3] || match[4];
    return role;
  }
  
  return null;
};

onMounted(() => {
  window.addEventListener('ws-message', handleWsMessage as EventListener);
  // 设置默认智能体（如果没有活跃智能体）
  if (!activeAgentRole.value && !currentRole.value) {
    currentRole.value = '助手';
  }
});

onUnmounted(() => {
  window.removeEventListener('ws-message', handleWsMessage as EventListener);
});
</script>

<style scoped>
.active-agent-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 0 0 16px 0;
}

.active-agent-flow {
  max-width: 80%;
  margin: 0 auto;
  padding: 10px 16px;
  border-radius: 10px;
  background-color: var(--item-background, #2d3748);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.flow-title {
  font-size: 13px;
  text-align: center;
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-weight: 500;
  opacity: 0.8;
}

.flow-diagram {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.flow-node {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 0 12px;
  height: 36px;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.flow-node:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.start-node {
  background-color: var(--flow-start, #3a536b);
  color: var(--text-primary);
}

.agent-node {
  background-color: var(--flow-agent, #2c5f82);
  color: var(--text-primary);
}

.task-node {
  background-color: var(--flow-task, #2c6e6a);
  color: var(--text-primary);
  max-width: 150px;
}

.flow-arrow {
  width: 24px;
  height: 2px;
  background-color: rgba(255, 255, 255, 0.3);
  position: relative;
}

.flow-arrow:after {
  content: '';
  position: absolute;
  right: 0;
  top: -3px;
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 6px solid rgba(255, 255, 255, 0.3);
}

.agent-emoji {
  margin-right: 4px;
  font-size: 14px;
}

/* 动画效果 */
.agent-transition-enter-active,
.agent-transition-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.agent-transition-enter-from,
.agent-transition-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
