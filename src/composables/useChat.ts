import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage } from '../types/chat';

export function useChat() {
  const messages = ref<ChatMessage[]>([]);
  const inputMessage = ref('');
  const isWaitingForInput = ref(false);
  const currentQuestion = ref('');
  const currentOptions = ref<string[]>([]);
  const analysisInProgress = ref(false);

  const cleanAnsiCodes = (content: string): string => {
    return content.replace(/\u001b\[\d+m/g, '')
                 .replace(/\[1m/g, '')
                 .replace(/\[92m/g, '')
                 .replace(/\[95m/g, '')
                 .replace(/\[00m/g, '');
  };

  const addMessage = (content: string, type: 'user' | 'agent' | 'system') => {
    if (!content.trim()) return;
    
    const cleanContent = cleanAnsiCodes(content);
    if (!cleanContent.trim()) return;

    // 检查是否存在相同内容的未保留消息
    const lastMessage = messages.value[messages.value.length - 1];
    if (lastMessage && 
        !lastMessage.preserved && 
        lastMessage.content === cleanContent && 
        lastMessage.type === type) {
      return;
    }

    // 移除之前的"思考中"消息
    if (type === 'agent') {
      messages.value = messages.value.filter(msg => !msg.thinking);
    }

    messages.value.push({
      id: uuidv4(),
      content: cleanContent,
      type,
      timestamp: new Date().toLocaleTimeString(),
      status: type === 'user' ? 'sent' : undefined,
      thinking: type === 'agent' && analysisInProgress.value,
      preserved: false // 默认不保留
    });
  };

  const updateLastMessage = (content: string) => {
    if (!content.trim()) return;
    
    const cleanContent = cleanAnsiCodes(content);
    if (!cleanContent.trim()) return;

    // 如果没有消息，创建新消息
    if (messages.value.length === 0) {
      addMessage(cleanContent, 'agent');
      return;
    }

    const lastMessage = messages.value[messages.value.length - 1];
    
    // 如果最后一条消息已被保留，创建新消息
    if (lastMessage.preserved) {
      addMessage(cleanContent, 'agent');
      return;
    }

    // 检查是否是需要保留的重要消息
    const shouldPreserve = content.includes('Final Answer:') || 
                          content.includes('产品概念') || 
                          content.includes('Task:') ||
                          content.includes('Agent:') ||
                          content.includes('[系统]:') ||
                          content.includes('[产品经理]:');

    if (shouldPreserve) {
      // 如果是重要消息，将当前消息标记为已保留并创建新消息
      lastMessage.preserved = true;
      lastMessage.thinking = false;
      addMessage(cleanContent, 'agent');
    } else {
      // 更新最后一条消息
      lastMessage.content = cleanContent;
      lastMessage.thinking = analysisInProgress.value;
    }
  };

  const clearInput = () => {
    inputMessage.value = '';
  };

  const setWaitingForInput = (question: string, options?: string[]) => {
    isWaitingForInput.value = true;
    currentQuestion.value = question;
    currentOptions.value = options || [];
    
    const cleanQuestion = cleanAnsiCodes(question);
    const lastMessage = messages.value[messages.value.length - 1];
    
    // 如果最后一条消息不是相同的问题或已被保留，添加新消息
    if (!lastMessage || 
        lastMessage.content !== cleanQuestion || 
        lastMessage.preserved) {
      addMessage(question, 'system');
    }
  };

  const resetWaitingForInput = () => {
    isWaitingForInput.value = false;
    currentQuestion.value = '';
    currentOptions.value = [];
  };

  return {
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
  };
}