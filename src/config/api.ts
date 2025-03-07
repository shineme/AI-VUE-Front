/**
 * API配置文件
 * 集中管理所有API端点，方便统一修改
 */

// 服务器基础URL
export const BASE_URL = 'http://crewai.aihack.top:8003';
export const WS_BASE_URL = 'ws://crewai.aihack.top:8003';

// WebSocket接口
export const WS_ENDPOINTS = {
  // 主WebSocket连接
  MAIN: `${WS_BASE_URL}/ws`,
  // 其他WebSocket端点可以在这里添加
};

// HTTP REST接口
export const HTTP_ENDPOINTS = {
  // 获取团队信息
  CREW_INFO: (crewType: string) => `${BASE_URL}/api/crew-info/${crewType}`,
  // 获取团队类型列表
  CREW_TYPES: `${BASE_URL}/api/crew-types`,
  // 上传文件
  UPLOAD_FILE: `${BASE_URL}/api/upload`,
  // 其他HTTP接口端点可以在这里添加
};

// WebSocket消息类型
export const WS_MESSAGE_TYPES = {
  // 消息类型
  CHAT: 'chat',
  SYSTEM: 'system',
  UPDATE: 'update',
  RESULT: 'result',
  
  // 任务相关
  TASK_STATUS: 'task_status',
  
  // 配置相关
  SET_CUSTOM_CONFIG: 'set_custom_config',
  
  // 用户交互
  REQUEST_INPUT: 'request_input',
  USER_INPUT: 'user_input',
  
  // 分析控制
  START_ANALYSIS: 'start_analysis',
  
  // 连接维护
  HEARTBEAT: 'heartbeat',
  HEARTBEAT_ACK: 'heartbeat_ack',
};

/**
 * 使用示例:
 * 
 * import { WS_ENDPOINTS, HTTP_ENDPOINTS, WS_MESSAGE_TYPES } from '../config/api';
 * 
 * // WebSocket连接
 * const socket = new WebSocket(WS_ENDPOINTS.MAIN);
 * 
 * // HTTP请求
 * const fetchCrewInfo = async (crewType) => {
 *   const response = await fetch(HTTP_ENDPOINTS.CREW_INFO(crewType));
 *   return await response.json();
 * };
 * 
 * // 发送WebSocket消息
 * socket.send(JSON.stringify({
 *   type: WS_MESSAGE_TYPES.CHAT,
 *   content: "Hello"
 * }));
 */
