import { ref, computed } from 'vue';
import { HTTP_ENDPOINTS, WS_MESSAGE_TYPES } from '../config/api';
import { message } from 'ant-design-vue';

export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  icon: string;
  description: string;
  expected_output: string;
  agent_role?: string;
  enabled?: boolean;
}

export interface Agent {
  role: string;
  goal: string;
  backstory: string;
  llm: string;
  tools?: string[];
  enabled?: boolean;
}

export interface CrewInfo {
  agents: Agent[];
  tasks: {
    description: string;
    expected_output: string;
    agent_role?: string;
    enabled?: boolean;
  }[];
  llm_models: Record<string, string>;
}

const currentTaskId = ref<string | null>(null);
const tasks = ref<Task[]>([]);
const agents = ref<Agent[]>([]);
const crewInfo = ref<CrewInfo | null>(null);
const isConfigLoaded = ref(false);
// 添加活跃智能体角色引用
const activeAgentRole = ref<string | null>(null);
// 添加上次任务状态变化时间记录
const lastTaskStatusChangeTime = ref<number>(0);
// 添加正在动画的智能体角色
const animatingAgentRole = ref<string>('');
// 任务进度计算
const taskProgress = computed(() => {
  if (tasks.value.length === 0) return 0;
  
  const completedTasks = tasks.value.filter(t => t.status === 'completed' && t.enabled !== false).length;
  const totalEnabledTasks = tasks.value.filter(t => t.enabled !== false).length;
  
  return totalEnabledTasks > 0 ? Math.round((completedTasks / totalEnabledTasks) * 100) : 0;
});

// 根据crew type获取配置信息
const fetchCrewInfo = async (crewType: string) => {
  try {
    const response = await fetch(HTTP_ENDPOINTS.CREW_INFO(crewType));
    const data = await response.json();
    
    crewInfo.value = data;
    
    // 设置agents
    agents.value = data.agents.map((agent: Agent) => ({
      ...agent,
      enabled: true
    }));
    
    // 设置tasks
    tasks.value = data.tasks.map((task, index) => {
      const taskId = getTaskIdFromIndex(index);
      return {
        id: taskId,
        name: getTaskNameFromDescription(task.description),
        status: 'pending' as TaskStatus,
        icon: getTaskIcon(index),
        description: task.description,
        expected_output: task.expected_output,
        agent_role: task.agent_role,
        enabled: task.enabled
      };
    });
    
    isConfigLoaded.value = true;
  } catch (error) {
    console.error('获取Crew信息失败:', error);
    // 回退到默认任务
    setDefaultTasks();
  }
};

// 获取默认图标
const getTaskIcon = (index: number) => {
  const icons = ['💡', '📱', '📊', '⚙️', '✨'];
  return icons[index % icons.length];
};

// 从索引获取任务ID
const getTaskIdFromIndex = (index: number) => {
  const taskIds = ['ideation', 'tiktok', 'market', 'tech', 'refinement'];
  return index < taskIds.length ? taskIds[index] : `task_${index}`;
};

// 从描述中提取任务名称
const getTaskNameFromDescription = (description: string): string => {
  // 尝试从描述中提取一个简短的名称
  const firstSentence = description.split('\n')[0].trim();
  if (firstSentence.length > 40) {
    return firstSentence.substring(0, 37) + '...';
  }
  return firstSentence;
};

// 设置默认任务
const setDefaultTasks = () => {
  tasks.value = [
    {
      id: 'ideation',
      name: '产品创意生成',
      status: 'pending',
      icon: '💡',
      description: '产品创意生成',
      expected_output: '产品创意',
      agent_role: undefined,
      enabled: true
    },
    {
      id: 'tiktok',
      name: 'TikTok平台分析',
      status: 'pending',
      icon: '📱',
      description: 'TikTok平台分析',
      expected_output: 'TikTok平台分析结果',
      agent_role: undefined,
      enabled: true
    },
    {
      id: 'market',
      name: '市场研究',
      status: 'pending',
      icon: '📊',
      description: '市场研究',
      expected_output: '市场研究结果',
      agent_role: undefined,
      enabled: true
    },
    {
      id: 'tech',
      name: '技术可行性评估',
      status: 'pending',
      icon: '⚙️',
      description: '技术可行性评估',
      expected_output: '技术可行性评估结果',
      agent_role: undefined,
      enabled: true
    },
    {
      id: 'refinement',
      name: '产品方案完善',
      status: 'pending',
      icon: '✨',
      description: '产品方案完善',
      expected_output: '产品方案完善结果',
      agent_role: undefined,
      enabled: true
    }
  ];
};

// 设置默认智能体
const setDefaultAgents = () => {
  agents.value = [
    {
      role: 'planner',
      goal: '规划整体流程和方案',
      backstory: '负责制定和协调整体计划',
      llm: 'gpt-4',
      tools: [],
      enabled: true
    },
    {
      role: 'researcher',
      goal: '收集和分析相关信息',
      backstory: '专注于深入研究和数据收集',
      llm: 'gpt-4',
      tools: [],
      enabled: true
    },
    {
      role: 'executor',
      goal: '执行具体任务',
      backstory: '将计划转化为实际行动',
      llm: 'gpt-3.5',
      tools: [],
      enabled: true
    },
    {
      role: 'critic',
      goal: '评估和提供反馈',
      backstory: '负责质量控制和改进建议',
      llm: 'gpt-4',
      tools: [],
      enabled: true
    }
  ];
  
  // 设置初始活跃智能体
  if (agents.value.length > 0 && !activeAgentRole.value) {
    activeAgentRole.value = 'planner';
  }
};

// 初始设置默认任务
setDefaultTasks();
// 初始设置默认智能体
setDefaultAgents();

export function useTaskProgress() {
  // 通知任务状态变化
  const notifyTaskStatusChange = (task: Task, status: TaskStatus) => {
    // 记录状态变化时间
    lastTaskStatusChangeTime.value = Date.now();
    
    // 创建一个自定义事件，传递任务状态变化信息
    const event = new CustomEvent('task-status-change', {
      detail: { task, status }
    });
    window.dispatchEvent(event);
    
    // 显示通知消息
    const statusText = status === 'in-progress' ? '进行中' : status === 'completed' ? '已完成' : '未开始';
    message.info(`任务 "${task.name}" 状态变为 ${statusText}`);
  };

  // 获取状态的显示名称
  const getStatusDisplayName = (status: TaskStatus): string => {
    switch (status) {
      case 'pending': return '等待中';
      case 'in-progress': return '进行中';
      case 'completed': return '已完成';
      case 'failed': return '失败';
      default: return status;
    }
  };

  // 更新任务状态并触发相应事件
  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    const task = tasks.value.find(t => t.id === taskId);
    if (task) {
      // 检查状态是否真的发生了变化
      if (task.status !== status) {
        const oldStatus = task.status;
        task.status = status;
        
        // 更新任务状态变更时间
        lastTaskStatusChangeTime.value = new Date().getTime();
        
        // 发布任务状态变化事件，包含任务详情
        const taskChangeEvent = new CustomEvent('task-status-change', {
          detail: {
            taskId,
            newStatus: status,
            oldStatus,
            taskName: task.name
          }
        });
        window.dispatchEvent(taskChangeEvent);
        
        // 显示任务状态变化通知
        message.info(`任务"${task.name}"状态从${getStatusDisplayName(oldStatus)}变为${getStatusDisplayName(status)}`);
      }
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

  // 尝试从消息内容中匹配任务完成情况
  const detectTaskCompletionInMessage = (message: string) => {
    const taskId = detectTaskFromMessage(message);
    if (taskId) {
      // 检测是否提到任务完成
      const isCompleted = message.toLowerCase().includes('完成') || 
                          message.toLowerCase().includes('已解决') ||
                          message.toLowerCase().includes('final answer') ||
                          message.toLowerCase().includes('结论');
      
      if (isCompleted) {
        updateTaskStatus(taskId, 'completed');
        
        // 如果当前任务完成，尝试找到下一个待处理任务
        if (currentTaskId.value === taskId) {
          const nextPendingTask = tasks.value.find(t => t.status === 'pending' && t.enabled !== false);
          if (nextPendingTask) {
            setCurrentTask(nextPendingTask.id);
          } else {
            currentTaskId.value = null;
          }
        }
      } else {
        // 如果没有提到完成，则将任务设为进行中
        setCurrentTask(taskId);
      }
    }
    
    // 同时检测活跃智能体
    detectActiveAgentFromMessage(message);
  };

  const detectActiveAgentFromMessage = (message: string): string | null => {
    // 处理ANSI转义序列
    const ansiRegex = /\u001b\[\d+m/g;
    const cleanedMessage = message.replace(ansiRegex, '');
    
    // 检查特殊格式的Agent标记
    const agentMatch = cleanedMessage.match(/Agent:\s+([^\n]+)/);
    if (agentMatch && agentMatch[1]) {
      const role = agentMatch[1].trim();
      setActiveAgent(role);
      return role;
    }
    
    // 检查emoji格式 - 这些通常表示角色
    const emojiMap: Record<string, string> = {
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
    
    // 检查是否以emoji开头
    const emojiMatch = cleanedMessage.match(/^([\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+)/u);
    if (emojiMatch && emojiMatch[1]) {
      const emoji = emojiMatch[1];
      if (emojiMap[emoji]) {
        const role = emojiMap[emoji];
        setActiveAgent(role);
        return role;
      }
    }
    
    // 提取说话者身份 - 检查更多格式
    const rolePatterns = [
      // 例如: 【产品经理】开始分析...
      /【([^】]+)】/,
      // 例如: [产品经理]开始分析...
      /\[([^\]]+)\]/,
      // 例如: <产品经理>开始分析...
      /<([^>]+)>/,
      // 例如: 「产品经理」开始分析...
      /「([^」]+)」/,
      // 例如: ProductManager:开始分析...
      /^(\w+(?:Agent|Manager|助手|专家))\b[:：]/i,
      // 例如: 产品经理AI:开始分析...
      /^([^:：]+)(AI|智能体|Agent|助手)[:：]/i
    ];
    
    for (const pattern of rolePatterns) {
      const match = cleanedMessage.match(pattern);
      if (match) {
        const role = match[1] || match[2];
        
        // 避免系统消息被误认为智能体
        if (role && role.toLowerCase() !== 'system' && role.toLowerCase() !== '系统') {
          setActiveAgent(role);
          return role;
        }
      }
    }
    
    return null;
  };

  // 设置活跃智能体，并触发相关事件
  const setActiveAgent = (role: string) => {
    if (!role) return;
    
    // 只有当角色发生变化时才更新
    if (activeAgentRole.value !== role) {
      console.log(`设置活跃智能体: ${role}`);
      
      // 更新活跃智能体
      activeAgentRole.value = role;
      
      // 查找对应的agent对象进行标记
      const agent = agents.value.find(a => 
        a.role.toLowerCase() === role.toLowerCase() || 
        role.toLowerCase().includes(a.role.toLowerCase()) ||
        a.role.toLowerCase().includes(role.toLowerCase())
      );
      
      // 如果找到对应智能体，显示通知
      if (agent) {
        console.log(`智能体 ${agent.role} 现在活跃`);
        
        // 显示智能体活跃状态变化通知
        message.info(`智能体 "${agent.role}" 现在处于活跃状态`);
        
        // 让对应的agent高亮显示一下
        animatingAgentRole.value = agent.role;
        setTimeout(() => {
          animatingAgentRole.value = '';
        }, 1500);
      }
      
      // 触发事件通知其他组件
      window.dispatchEvent(new CustomEvent('agent-active-change', { 
        detail: { role } 
      }));
    }
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
    parseTasksFromMessage(data);
  };

  const resetProgress = () => {
    currentTaskId.value = null;
    tasks.value.forEach(task => {
      task.status = 'pending';
    });
  };

  // 从消息中解析任务状态
  const parseTasksFromMessage = (data: any) => {
    if (data.type === WS_MESSAGE_TYPES.TASK_STATUS) {
      // 服务器发送的任务状态更新
      const taskId = data.task_id;
      const status = data.status;
      
      // 更新任务状态
      updateTaskStatus(taskId, status);
      
      // 更新当前任务ID
      if (status === 'in-progress') {
        currentTaskId.value = taskId;
        
        // 如果消息中包含智能体角色信息，更新活跃智能体
        if (data.agent_role) {
          activeAgentRole.value = data.agent_role;
          // 触发智能体活跃状态变化事件
          const event = new CustomEvent('agent-active-change', {
            detail: { role: data.agent_role }
          });
          window.dispatchEvent(event);
        }
      } else if (status === 'completed' && currentTaskId.value === taskId) {
        // 移动到下一个未完成的任务
        const nextPendingTask = tasks.value.find(t => t.status === 'pending' && t.enabled !== false);
        currentTaskId.value = nextPendingTask ? nextPendingTask.id : null;
      }
    } else if (data.type === WS_MESSAGE_TYPES.CHAT || 
              data.type === WS_MESSAGE_TYPES.UPDATE || 
              data.type === WS_MESSAGE_TYPES.RESULT) {
      if (data.content && typeof data.content === 'string') {
        // 尝试从聊天内容中匹配任务相关的句子
        detectTaskCompletionInMessage(data.content);
      }
    }
  };

  // 生成保存的配置
  const generateSaveConfig = () => {
    if (!crewInfo.value) return null;
    
    const config = {
      agents: agents.value.map(agent => ({
        role: agent.role,
        goal: agent.goal,
        backstory: agent.backstory,
        llm: agent.llm,
        tools: agent.tools,
        enabled: agent.enabled !== false // 默认为true
      })),
      tasks: tasks.value.map(task => ({
        description: task.description,
        expected_output: task.expected_output,
        agent_role: task.agent_role,
        enabled: task.enabled
      }))
    };
    
    return config;
  };

  // 发送自定义配置到WebSocket
  const saveCustomConfig = (sendFunction: (data: any) => void): boolean => {
    if (!crewInfo.value) return false;
    
    const config = {
      agents: agents.value,
      tasks: tasks.value.map(task => ({
        description: task.description,
        expected_output: task.expected_output,
        agent_role: task.agent_role,
        enabled: task.enabled
      }))
    };
    
    sendFunction({
      type: WS_MESSAGE_TYPES.SET_CUSTOM_CONFIG,
      config
    });
    
    return true;
  };

  return {
    tasks,
    agents,
    crewInfo,
    isConfigLoaded,
    currentTaskId,
    activeAgentRole,
    animatingAgentRole,
    lastTaskStatusChangeTime,
    taskProgress,
    updateTaskStatus,
    setCurrentTask,
    detectTaskFromMessage,
    detectActiveAgentFromMessage,
    handleWebSocketMessage,
    resetProgress,
    fetchCrewInfo,
    saveCustomConfig,
    parseTasksFromMessage
  };
}