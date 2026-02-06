import { useState, useEffect, useRef } from 'react';
import { AIRole } from '../types/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  selectedRole: AIRole | null;
}

const N8N_WEBHOOK_URL = 'https://zinov.online/webhook/ai-selection';

export default function ChatInterface({ selectedRole }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: selectedRole 
        ? `Чат с ${selectedRole.name}`
        : 'Выберите роль AI для начала чата',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (role: Message['role'], content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const sendMessageToN8n = async (message: string, roleName: string) => {
    console.log('🚀 Отправка в n8n:', { message, roleName });
    
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          role: roleName,
          timestamp: new Date().toISOString(),
          source: 'ai-chat-website',
          userId: 'user-' + Date.now().toString().slice(-6)
        }),
        timeout: 10000 // 10 секунд таймаут
      });

      console.log('📥 Ответ n8n - статус:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ошибка сервера:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Успешный ответ n8n:', data);
      return data;
      
    } catch (error) {
      console.error('💥 Критическая ошибка n8n:', error);
      
      // Fallback ответ
      return {
        reply: `[Тестовый режим] ${roleName} отвечает на: "${message}"\n\n(Реальный сервер n8n временно недоступен)`,
        timestamp: new Date().toISOString(),
        isFallback: true
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedRole || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      const response = await sendMessageToN8n(userMessage, selectedRole.name);
      
      if (response.reply) {
        addMessage('assistant', response.reply);
      } else if (response.message) {
        addMessage('assistant', response.message);
      } else {
        addMessage('assistant', JSON.stringify(response));
      }
      
    } catch (error) {
      console.error('Ошибка обработки ответа:', error);
      addMessage('system', '⚠️ Ошибка соединения с AI сервисом. Попробуйте позже или свяжитесь с поддержкой.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedRole) {
    return (
      <div className="chat-interface empty">
        <div className="empty-state">
          <h3>Выберите роль AI</h3>
          <p>Выберите роль из списка слева чтобы начать общение</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>Чат с {selectedRole.name}</h2>
        <p className="role-description">{selectedRole.description}</p>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-header">
              <span className="message-role">
                {message.role === 'user' ? 'Вы' : 
                 message.role === 'assistant' ? selectedRole.name : 'Система'}
              </span>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-header">
              <span className="message-role">{selectedRole.name}</span>
            </div>
            <div className="message-content typing">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Напишите сообщение для ${selectedRole.name}...`}
          disabled={isLoading}
          rows={3}
        />
        <button 
          onClick={handleSendMessage} 
          disabled={!inputValue.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? 'Отправка...' : 'Отправить'}
        </button>
        <div className="hint">Нажмите Enter для отправки, Shift+Enter для новой строки</div>
        <div className="debug-info">
          Сообщений: {messages.length} | n8n endpoint: {N8N_WEBHOOK_URL}
        </div>
      </div>
    </div>
  );
}
