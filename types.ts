
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: Date;
}

export interface BotSettings {
  name: string;
  phoneNumber?: string;
  persona: string;
  status: 'online' | 'offline' | 'connecting';
  autoReply: boolean;
  temperature: number;
}

export interface AutomationRule {
  id: string;
  trigger: string;
  response: string;
  isActive: boolean;
}

export interface CommandLog {
  id: string;
  command: string;
  status: 'success' | 'failed';
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  contactName: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
  unreadCount: number;
}
