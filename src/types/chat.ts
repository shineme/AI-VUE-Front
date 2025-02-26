export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'agent' | 'system';
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
  thinking?: boolean;
  steps?: number;
  preserved?: boolean; // 新增字段，用于标记是否保留消息
}

export interface WebSocketMessage {
  type: 'update' | 'request_input' | 'result' | 'heartbeat_ack';
  content?: string;
  question?: string;
  options?: string[];
  timestamp?: number;
}

export interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'connecting';
  lastHeartbeat?: number;
}