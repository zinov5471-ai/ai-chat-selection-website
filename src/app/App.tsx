import { useState } from 'react';
import { AIRoleSelector } from './components/AIRoleSelector';
import { ChatInterface } from './components/ChatInterface';
import { AIRole } from './types/ai';

// Функция отправки выбора AI в n8n (no-cors версия)
const sendToN8N = async (role: AIRole): Promise<void> => {
  try {
    console.log('🚀 Отправка выбора AI в n8n (no-cors):', role.name);
    
    // Отправляем БЕЗ ожидания ответа (no-cors режим)
    await fetch('https://zinov.online/webhook-test/ai-selection', {
      method: 'POST',
      mode: 'no-cors', // ← ВАЖНО: no-cors режим обходит CORS
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Основная информация
        event: 'ai_role_selected',
        timestamp: new Date().toISOString(),
        
        // Данные о пользователе
        user: 'website_user',
        userAgent: navigator.userAgent,
        sourceUrl: window.location.href,
        
        // Данные о выбранной AI роли
        aiRole: {
          id: role.id,
          name: role.name,
          description: role.description,
          icon: role.icon,
          color: role.color,
          greeting: role.greeting.substring(0, 100) + (role.greeting.length > 100 ? '...' : '')
        },
        
        // Дополнительно
        platform: 'web',
        version: '1.0.0',
        mode: 'no-cors'
      }),
    });
    
    // Так как mode: 'no-cors', мы не получаем response
    // Просто логируем успех
    console.log('✅ Данные отправлены в n8n (no-cors mode)');
    
    // Показываем пользователю
    alert(`🎉 Выбрана ${role.name}! Данные отправлены в систему.`);
    
    // Сохраняем в localStorage для отслеживания
    localStorage.setItem('last_ai_selection', JSON.stringify({
      ai: role.name,
      aiId: role.id,
      time: new Date().toISOString(),
      status: 'sent'
    }));
    
  } catch (error) {
    // В no-cors режиме ошибки fetch не выбрасываются
    // Но другие ошибки могут быть
    console.error('❌ Ошибка в sendToN8N:', error);
    alert('⚠️ Произошла ошибка при обработке выбора');
  }
};

export default function App() {
  const [selectedRole, setSelectedRole] = useState<AIRole | null>(null);

  // Обработчик выбора роли
  const handleSelectRole = async (role: AIRole | null) => {
    // 1. Устанавливаем роль в состояние
    setSelectedRole(role);
    
    // 2. Если роль выбрана - отправляем в n8n
    if (role) {
      console.log(`🎯 Выбрана роль: ${role.name} (ID: ${role.id})`);
      
      // 2.1 Отправляем в n8n
      await sendToN8N(role);
      
      // 2.2 Можно добавить дополнительную логику
      // Например, отправку в другие системы
      
      // 2.3 Логируем для отладки
      console.log('📝 Выбор обработан:', {
        role: role.name,
        time: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
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