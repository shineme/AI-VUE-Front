import { ref, computed } from 'vue';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  icon: string;
}

const currentTaskId = ref<string | null>(null);
const tasks = ref<Task[]>([
  {
    id: 'ideation',
    name: '产品创意生成',
    status: 'pending',
    icon: '💡'
  },
  {
    id: 'tiktok',
    name: 'TikTok平台分析',
    status: 'pending',
    icon: '📱'
  },
  {
    id: 'market',
    name: '市场研究',
    status: 'pending',
    icon: '📊'
  },
  {
    id: 'tech',
    name: '技术可行性评估',
    status: 'pending',
    icon: '⚙️'
  },
  {
    id: 'refinement',
    name: '产品方案完善',
    status: 'pending',
    icon: '✨'
  }
]);

export function useTaskProgress() {
  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    const task = tasks.value.find(t => t.id === taskId);
    if (task) {
      task.status = status;
    }
  };

  const setCurrentTask = (taskId: string) => {
    // 将前一个进行中的任务标记为完成
    if (currentTaskId.value) {
      updateTaskStatus(currentTaskId.value, 'completed');
    }
    
    // 设置新的当前任务
    currentTaskId.value = taskId;
    updateTaskStatus(taskId, 'in-progress');
  };

  const detectTaskFromMessage = (message: string): string | null => {
    // 特殊消息处理
    if (message.includes('[系统]')) {
      return null; // 系统消息不触发任务状态更新
    }

    const taskKeywords = {
      ideation: [
        '产品创意',
        '创意生成',
        '创意构思',
        '产品概念',
        '创新点'
      ],
      tiktok: [
        'TikTok',
        '抖音',
        '短视频平台',
        '平台分析',
        '用户群体',
        '平台特点'
      ],
      market: [
        '市场研究',
        '市场分析',
        '竞品分析',
        '市场规模',
        '市场趋势',
        '竞争对手'
      ],
      tech: [
        '技术可行性',
        '技术评估',
        '技术架构',
        '开发难度',
        '技术方案',
        '实现方式'
      ],
      refinement: [
        '方案完善',
        '产品方案',
        '方案优化',
        '最终方案',
        '产品定义',
        '功能列表'
      ]
    };

    // 检查是否包含任务关键词
    for (const [taskId, keywords] of Object.entries(taskKeywords)) {
      if (keywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
        return taskId;
      }
    }

    return null;
  };

  const handleWebSocketMessage = (data: any) => {
    if (!data) return;

    switch (data.type) {
      case 'update':
        if (data.content) {
          const taskId = detectTaskFromMessage(data.content);
          if (taskId) {
            setCurrentTask(taskId);
          }
        }
        break;
      case 'result':
        if (data.content) {
          // 检查是否是最终结果
          if (data.content.includes('最终产品方案') || 
              data.content.includes('Final Answer') ||
              data.content.includes('产品概念')) {
            // 确保所有任务都完成
            tasks.value.forEach(task => {
              if (task.status === 'pending') {
                updateTaskStatus(task.id, 'completed');
              }
            });
          } else {
            const taskId = detectTaskFromMessage(data.content);
            if (taskId) {
              setCurrentTask(taskId);
            }
          }
        }
        break;
    }
  };

  const resetProgress = () => {
    currentTaskId.value = null;
    tasks.value.forEach(task => {
      task.status = 'pending';
    });
  };

  return {
    tasks,
    currentTaskId,
    updateTaskStatus,
    setCurrentTask,
    detectTaskFromMessage,
    handleWebSocketMessage,
    resetProgress
  };
}