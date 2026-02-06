export interface AIRole {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  greeting: string;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}
