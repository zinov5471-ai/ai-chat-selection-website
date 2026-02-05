import { useState } from 'react';
import { AIRoleSelector } from './components/AIRoleSelector';
import { ChatInterface } from './components/ChatInterface';
import { AIRole } from './types/ai';

export default function App() {
  const [selectedRole, setSelectedRole] = useState<AIRole | null>(null);

  return (
    <div className="size-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-7xl h-full max-h-[900px] flex flex-col md:flex-row gap-4 md:gap-6">
        <AIRoleSelector 
          selectedRole={selectedRole} 
          onSelectRole={setSelectedRole}
        />
        <ChatInterface selectedRole={selectedRole} />
      </div>
    </div>
  );
}
