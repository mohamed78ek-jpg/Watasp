
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface BotSettings {
  name: string;
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

export interface Contact {
  id: string;
  name: string;
  phone: string;
  lastSeen: string;
  avatar?: string;
}

export interface ChatSession {
  id: string;
  contactName: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
  unreadCount: number;
}
