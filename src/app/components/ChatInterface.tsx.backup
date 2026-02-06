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

export function ChatInterface({ selectedRole }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Автоматически отправляем приветствие при выборе роли
  useEffect(() => {
    if (selectedRole) {
      // Очищаем предыдущие сообщения
      setMessages([]);
      const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setChatId(newChatId);
      
      // Показываем системное сообщение о выборе
      setMessages(prev => [...prev, {
        id: `sys_${Date.now()}`,
        role: 'system',
        content: `Вы выбрали: ${selectedRole.name}`,
        timestamp: new Date()
      }]);
      
      // Инициируем получение приветствия от AI
      fetchAIGreeting(selectedRole, newChatId);
    }
  }, [selectedRole]);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Функция получения приветствия от n8n
  const fetchAIGreeting = async (role: AIRole, currentChatId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://zinov.online/webhook/ai-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          event: 'ai_role_selected',
          eventId: `chat_start_${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: {
            type: 'website_visitor',
            sessionId: localStorage.getItem('session_id') || 'anonymous',
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          aiRole: {
            id: role.id,
            name: role.name,
            description: role.description,
            icon: role.icon,
            color: role.color,
            greetingPreview: role.greeting.substring(0, 100),
            fullGreetingLength: role.greeting.length,
          },
          session: {
            url: window.location.href,
            referrer: document.referrer || 'direct',
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
          },
          chatId: currentChatId,
          platform: {
            type: 'web',
            framework: 'react_vite',
            version: '1.0.0',
            environment: 'production',
          },
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Используем реальный ответ от n8n
      setMessages(prev => [...prev, {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.message || role.greeting,
        timestamp: new Date()
      }]);
      
      // Сохраняем в историю
      saveToHistory(role, currentChatId, 'greeting_sent');
      
    } catch (error) {
      console.error('Ошибка получения приветствия:', error);
      // Fallback на локальное приветствие
      setMessages(prev => [...prev, {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: role.greeting,
        timestamp: new Date()
      }]);
      saveToHistory(role, currentChatId, 'greeting_fallback');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция отправки сообщения пользователя
  const handleSendMessage = async () => {
    if (!input.trim() || !selectedRole || !chatId) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    // Добавляем сообщение пользователя сразу
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Отправляем сообщение в n8n
      const response = await fetch('https://zinov.online/webhook/chat-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          event: 'chat_message',
          eventId: `message_${Date.now()}`,
          timestamp: new Date().toISOString(),
          chatId: chatId,
          aiRoleId: selectedRole.id,
          message: input,
          user: {
            sessionId: localStorage.getItem('session_id') || 'anonymous',
          },
          history: messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp.toISOString()
            }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Добавляем ответ AI
      setMessages(prev => [...prev, {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.message || `Я получил: "${userMessage.content}"`,
        timestamp: new Date()
      }]);
      
      saveToHistory(selectedRole, chatId, 'message_sent');
      
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      // Fallback ответ
      setMessages(prev => [...prev, {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: `Я получил ваше сообщение: "${userMessage.content}". Попробуйте еще раз позже.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Сохранение в историю
  const saveToHistory = (role: AIRole, currentChatId: string, type: string) => {
    const chatHistory = JSON.parse(localStorage.getItem('chat_history') || '[]');
    chatHistory.push({
      chatId: currentChatId,
      aiRole: role.name,
      type: type,
      timestamp: new Date().toISOString(),
      messagesCount: messages.length + 1
    });
    
    if (chatHistory.length > 50) chatHistory.shift();
    localStorage.setItem('chat_history', JSON.stringify(chatHistory));
  };

  // Обработка нажатия Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col h-full">
      {/* Заголовок чата */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedRole?.name || 'Выберите AI'}
            </h2>
            <p className="text-gray-600 mt-1">
              {selectedRole?.description || 'Выберите роль для начала диалога'}
            </p>
          </div>
          {chatId && (
            <div className="text-sm text-gray-500">
              ID: {chatId.substring(0, 8)}...
            </div>
          )}
        </div>
      </div>

      {/* Область сообщений */}
      <div className="flex-1 p-6 overflow-y-auto">
        {messages.length === 0 && !selectedRole ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-lg">Выберите AI ассистента для начала диалога</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${message.role === 'assistant' || message.role === 'system' ? 'text-left' : 'text-right'}`}
              >
                <div className={`inline-block p-4 rounded-2xl max-w-[80%] ${
                  message.role === 'assistant'
                    ? 'bg-blue-50 text-gray-800 border border-blue-100'
                    : message.role === 'system'
                    ? 'bg-gray-50 text-gray-600 border border-gray-200 italic'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-xs">AI</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs text-gray-500 mt-2 block">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="text-left mb-4">
                <div className="inline-block p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
                    <span className="text-sm text-gray-600 ml-2">AI думает...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Поле ввода */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedRole ? `Напишите сообщение для ${selectedRole.name}...` : 'Выберите AI для начала диалога'}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!selectedRole || isLoading}
              />
              <div className="absolute right-3 top-3 text-xs text-gray-400">
                Enter для отправки
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!selectedRole || isLoading || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[100px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Отправка</span>
                </div>
              ) : (
                'Отправить'
              )}
            </button>
          </div>
          
          <div className="text-xs text-gray-500 flex justify-between">
            <span>
              {selectedRole && `Чат с ${selectedRole.name}`}
            </span>
            <span>
              Сообщений: {messages.filter(m => m.role === 'user' || m.role === 'assistant').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}