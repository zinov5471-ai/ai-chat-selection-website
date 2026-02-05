import { useState } from 'react';
import { AIRoleSelector } from './components/AIRoleSelector';
import { ChatInterface } from './components/ChatInterface';
import { AIRole } from './types/ai';

// Функция отправки выбора AI в n8n
const sendToN8N = async (role: AIRole): Promise<void> => {
  try {
    console.log('🚀 Отправка выбора AI в n8n:', role.name);
    
    const response = await fetch('https://zinov.online/webhook-test/ai-selection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Основная информация о выборе
        event: 'ai_role_selected',
        timestamp: new Date().toISOString(),
        
        // Данные о пользователе
        user: 'website_user', // TODO: заменить на реального пользователя
        userAgent: navigator.userAgent,
        sourceUrl: window.location.href,
        
        // Полные данные о выбранной AI роли
        aiRole: {
          id: role.id,
          name: role.name,
          description: role.description,
          icon: role.icon,
          color: role.color,
          greeting: role.greeting.substring(0, 100) + '...' // обрезаем если длинное
        },
        
        // Дополнительная информация
        platform: 'web',
        version: '1.0.0'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Ответ от n8n:', data);
    
    if (data.success) {
      // Можно логировать успех
      console.log(`✅ ${data.message}`);
      
      // Опционально: показать уведомление
      // alert(`Выбрана ${role.name}! ${data.message}`);
    } else {
      console.warn('⚠️ n8n вернул ошибку:', data);
    }
    
  } catch (error) {
    console.error('❌ Ошибка отправки в n8n:', error);
    // Не прерываем работу приложения при ошибке сети
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
      
      // 2.2 Сохраняем в localStorage (опционально)
      localStorage.setItem('lastSelectedAI', JSON.stringify({
        id: role.id,
        name: role.name,
        timestamp: new Date().toISOString()
      }));
      
      // 2.3 Аналитика (если есть)
      // if (window.gtag) {
      //   window.gtag('event', 'select_ai', { ai_model: role.name });
      // }
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