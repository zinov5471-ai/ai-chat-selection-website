import { useState } from 'react';
import { AIRoleSelector } from './components/AIRoleSelector';
import { ChatInterface } from './components/ChatInterface';
import { AIRole } from './types/ai';

// Функция отправки выбора AI в n8n (продакшен версия)
const sendToN8N = async (role: AIRole): Promise<void> => {
  try {
    console.log('🚀 Отправка выбора AI в n8n:', role.name);
    
    // PRODUCTION ENDPOINT - работает постоянно
    await fetch('https://zinov.online/webhook/ai-selection', {
      method: 'POST',
      mode: 'no-cors', // Обходим CORS политику
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // === ОСНОВНАЯ ИНФОРМАЦИЯ ===
        event: 'ai_role_selected',
        eventId: `ai_select_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        
        // === ДАННЫЕ О ПОЛЬЗОВАТЕЛЕ ===
        user: {
          type: 'website_visitor',
          sessionId: localStorage.getItem('session_id') || 'anonymous',
          userAgent: navigator.userAgent,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        
        // === ДАННЫЕ О ВЫБРАННОЙ AI РОЛИ ===
        aiRole: {
          id: role.id,
          name: role.name,
          description: role.description,
          icon: role.icon,
          color: role.color,
          greetingPreview: role.greeting.substring(0, 100) + (role.greeting.length > 100 ? '...' : ''),
          fullGreetingLength: role.greeting.length,
        },
        
        // === ИНФОРМАЦИЯ О СЕССИИ ===
        session: {
          url: window.location.href,
          referrer: document.referrer || 'direct',
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        },
        
        // === ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ ===
        platform: {
          type: 'web',
          framework: 'react_vite',
          version: '1.0.0',
          environment: 'production',
        },
        
        // === ДОПОЛНИТЕЛЬНЫЕ ДАННЫЕ ===
        metadata: {
          source: 'ai-chat-selection-website',
          deployment: 'netlify',
          deploymentUrl: 'https://eclectic-melba-9f173d.netlify.app',
          sendMethod: 'fetch_no-cors',
          retryEnabled: false,
        }
      }),
    });
    
    // Успешная отправка
    console.log('✅ Данные успешно отправлены в n8n (production endpoint)');
    
    // Показываем пользователю
    alert(`🎉 Отлично! Вы выбрали ${role.name}!\n\nВаш выбор сохранен в системе.`);
    
    // Сохраняем в localStorage для аналитики
    const selectionHistory = JSON.parse(localStorage.getItem('ai_selection_history') || '[]');
    selectionHistory.push({
      aiId: role.id,
      aiName: role.name,
      timestamp: new Date().toISOString(),
      endpoint: 'production',
      status: 'sent'
    });
    
    // Ограничиваем историю последними 50 выборами
    if (selectionHistory.length > 50) {
      selectionHistory.shift();
    }
    
    localStorage.setItem('ai_selection_history', JSON.stringify(selectionHistory));
    localStorage.setItem('last_ai_selection', JSON.stringify({
      aiId: role.id,
      aiName: role.name,
      timestamp: new Date().toISOString(),
      endpoint: 'production',
      version: '1.0'
    }));
    
    // Логируем для отладки
    console.log('📊 Выбор сохранен в localStorage:', {
      role: role.name,
      time: new Date().toLocaleTimeString(),
      historyCount: selectionHistory.length
    });
    
  } catch (error) {
    // В режиме no-cors ошибки fetch не ловятся, но другие ошибки возможны
    console.error('❌ Ошибка в sendToN8N:', error);
    
    // Fallback: показываем пользователю базовое сообщение
    alert(`🎉 Выбрана ${role.name}!`);
    
    // Сохраняем в localStorage даже при ошибке
    localStorage.setItem('last_ai_selection_fallback', JSON.stringify({
      aiId: role.id,
      aiName: role.name,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'unknown',
      offline: true
    }));
  }
};

// Генератор ID сессии
const generateSessionId = () => {
  if (!localStorage.getItem('session_id')) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('session_id', sessionId);
    console.log('🆔 Новая сессия:', sessionId);
  }
  return localStorage.getItem('session_id');
};

export default function App() {
  const [selectedRole, setSelectedRole] = useState<AIRole | null>(null);

  // Инициализация сессии
  useState(() => {
    generateSessionId();
    console.log('🌐 Приложение запущено. Сессия:', localStorage.getItem('session_id'));
  });

  // Обработчик выбора роли
  const handleSelectRole = async (role: AIRole | null) => {
    // 1. Устанавливаем роль в состояние
    setSelectedRole(role);
    
    // 2. Если роль выбрана - отправляем в n8n
    if (role) {
      console.log(`🎯 Пользователь выбрал роль: ${role.name} (ID: ${role.id})`);
      console.log('📋 Данные роли:', {
        description: role.description.substring(0, 50) + '...',
        color: role.color,
        greetingLength: role.greeting.length
      });
      
      // 3. Отправляем в n8n
      await sendToN8N(role);
      
      // 4. Дополнительная логика (опционально)
      // Можно добавить отправку в другие системы аналитики
      
      // 5. Логируем завершение
      console.log('✅ Процесс выбора завершен для:', role.name);
    } else {
      console.log('🔄 Роль сброшена (null)');
    }
  };

  return (
    <div className="size-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-7xl h-full max-h-[900px] flex flex-col md:flex-row gap-4 md:gap-6">
        <AIRoleSelector 
          selectedRole={selectedRole} 
          onSelectRole={handleSelectRole}
        />
        <ChatInterface selectedRole={selectedRole} />
      </div>
    </div>
  );
}