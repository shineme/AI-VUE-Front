import { ref, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import type { WebSocketMessage, ConnectionStatus } from '../types/chat';

export function useWebSocket(url: string) {
  const ws = ref<WebSocket | null>(null);
  const connectionStatus = ref<ConnectionStatus>({
    status: 'disconnected'
  });
  
  const messageHandlers = new Map<string, (data: WebSocketMessage) => void>();

  const connect = () => {
    if (ws.value?.readyState === WebSocket.OPEN) return;

    connectionStatus.value.status = 'connecting';
    ws.value = new WebSocket(url);

    ws.value.onopen = () => {
      connectionStatus.value.status = 'connected';
      message.success('已连接到服务器');
    };

    ws.value.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        // 处理心跳
        if (data.type === 'heartbeat_ack') {
          connectionStatus.value.lastHeartbeat = data.timestamp;
          return;
        }

        // 处理Unicode编码
        if (data.content) {
          data.content = decodeUnicode(data.content);
        }
        if (data.question) {
          data.question = decodeUnicode(data.question);
        }
        if (data.options) {
          data.options = data.options.map(decodeUnicode);
        }

        // 分发消息到注册的处理器
        messageHandlers.forEach(handler => handler(data));
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.value.onerror = () => {
      connectionStatus.value.status = 'disconnected';
      message.error('WebSocket连接错误');
    };

    ws.value.onclose = () => {
      connectionStatus.value.status = 'disconnected';
      message.warning('连接已断开，正在尝试重新连接...');
      setTimeout(connect, 5000);
    };
  };

  const send = (data: any) => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data));
      return true;
    }
    message.error('未连接到服务器');
    return false;
  };

  const registerMessageHandler = (id: string, handler: (data: WebSocketMessage) => void) => {
    messageHandlers.set(id, handler);
    return () => messageHandlers.delete(id);
  };

  // Unicode解码
  const decodeUnicode = (str: string): string => {
    return str.replace(/\\u[\dA-F]{4}/gi, match => 
      String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
    );
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    if (ws.value) {
      ws.value.close();
    }
  });

  return {
    connectionStatus,
    send,
    registerMessageHandler
  };
}