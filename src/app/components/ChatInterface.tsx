import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { AIRole, Message } from '../types/ai';

interface ChatInterfaceProps {
  selectedRole: AIRole | null;
}

// Константы для API - ПРОВЕРЬТЕ ЭТИ URL!
const N8N_WEBHOOK_URL = 'https://zinov.online/webhook/ai-selection'; // Старый workflow
const N8N_CHAT_URL = 'https://zinov.online/webhook/chat/message'; // Новый workflow

export function ChatInterface({ selectedRole }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [chatId, setChatId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Инициализация сессии
  useEffect(() => {
    const savedSessionId = localStorage.getItem('chat_session_id');
    if (savedSessionId) {
      setSessionId(savedSessionId);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // При выборе роли - отправляем выбор в n8n и показываем приветствие
  useEffect(() => {
    if (selectedRole) {
      // Генерируем новый chatId для этой сессии чата
      const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setChatId(newChatId);
      localStorage.setItem('current_chat_id', newChatId);

      // 1. Отправляем выбор роли в n8n (существующий workflow)
      sendRoleSelectionToN8N(selectedRole, newChatId);

      // 2. Показываем приветственное сообщение
      setMessages([
        {
          id: 'greeting_' + Date.now(),
          role: 'ai',
          content: selectedRole.greeting,
          timestamp: new Date()
        }
      ]);
    } else {
      setMessages([]);
      setChatId('');
    }
  }, [selectedRole]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Функция отправки выбора роли в n8n
  const sendRoleSelectionToN8N = async (role: AIRole, newChatId: string) => {
    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'ai_role_selected',
          eventId: `select_${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: {
            sessionId: sessionId,
            type: 'website_visitor',
          },
          aiRole: {
            id: role.id,
            name: role.name,
            description: role.description,
            icon: role.icon,
            color: role.color,
          },
          chatId: newChatId,
        }),
      });
      console.log('✅ Выбор роли отправлен в n8n');
    } catch (error) {
      console.error('❌ Ошибка отправки выбора роли:', error);
    }
  };

  // ОСНОВНАЯ ФУНКЦИЯ: Отправка сообщения в n8n
  const sendMessageToN8N = async (userMessage: string): Promise<string> => {
    if (!selectedRole || !sessionId || !chatId) {
      throw new Error('Недостаточно данных для отправки сообщения');
    }

    try {
      console.log('📤 Отправка сообщения в n8n:', {
        sessionId,
        chatId,
        aiRoleId: selectedRole.id,
        message: userMessage.substring(0, 50) + '...'
      });

      const response = await fetch(N8N_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Основные данные
          sessionId: sessionId,
          chatId: chatId,
          aiRoleId: selectedRole.id,
          aiRoleName: selectedRole.name,
          userMessage: userMessage,
          timestamp: new Date().toISOString(),

          // Контекст чата (последние 5 сообщений)
          chatHistory: messages.slice(-5).map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString()
          })),

          // Техническая информация
          metadata: {
            source: 'react_chat_interface',
            version: '1.0',
            language: navigator.language,
            userAgent: navigator.userAgent.substring(0, 100)
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`n8n вернул ошибку ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📥 Ответ от n8n:', data);

      // Извлекаем ответ из разных возможных форматов
      if (data.message) {
        return data.message;
      } else if (data.response) {
        return data.response;
      } else if (data.content) {
        return data.content;
      } else if (typeof data === 'string') {
        return data;
      } else {
        return "Я получил ваш запрос. Для подробного ответа нужна дополнительная информация.";
      }

    } catch (error) {
      console.error('❌ Ошибка отправки сообщения в n8n:', error);
      throw error;
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedRole || isLoading) return;

    // 1. Сохраняем сообщение пользователя
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 2. Отправляем в n8n и получаем ответ
      const aiResponse = await sendMessageToN8N(inputValue);

      // 3. Сохраняем ответ AI
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // 4. Сохраняем историю в localStorage
      const chatHistory = [...messages, userMessage, aiMessage];
      localStorage.setItem(
        `chat_history_${selectedRole.id}_${chatId}`,
        JSON.stringify(chatHistory.slice(-50))
      );

    } catch (error) {
      // Если ошибка - показываем fallback сообщение
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'ai',
        content: "Извините, произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!selectedRole) {
    return (
      <div className="flex-1 bg-white rounded-3xl shadow-sm flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex p-4 rounded-2xl bg-gray-50 mb-4">
            <Sparkles className="size-8 text-gray-400" />
          </div>
          <h2 className="text-xl mb-2 text-gray-900">Welcome to AI Chat</h2>
          <p className="text-sm text-gray-500 max-w-md">
            Select an AI companion from the sidebar to start your conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-3xl shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg text-gray-900">{selectedRole.name}</h2>
        <p className="text-xs text-gray-500 mt-1">{selectedRole.description}</p>
        <div className="flex gap-2 mt-2 text-xs text-gray-400">
          <span>Session: {sessionId.substring(0, 15)}...</span>
          <span>•</span>
          <span>Chat: {chatId.substring(0, 15)}...</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-gray-900 text-white rounded-br-md'
                  : 'bg-gray-50 text-gray-900 rounded-bl-md'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] md:max-w-[70%] p-4 rounded-2xl bg-gray-50 rounded-bl-md">
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">AI думает...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-gray-100">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all text-sm disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Press Enter to send • Messages processed by n8n + AI
        </p>
      </div>
    </div>
  );
}