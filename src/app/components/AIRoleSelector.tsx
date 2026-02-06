import { Brain, Scale, Wrench, Heart } from 'lucide-react';
import { AIRole } from '../types/ai';

const aiRoles: AIRole[] = [
  {
    id: 'psychologist',
    name: 'Psychologist',
    description: 'Compassionate listener for mental wellness',
    icon: 'brain',
    color: 'bg-purple-50 border-purple-200',
    greeting: "Здравствуйте! Я здесь, чтобы выслушать вас и поддержать. Как вы себя сегодня чувствуете?"
  },
  {
    id: 'lawyer',
    name: 'Legal Advisor',
    description: 'Legal guidance and consultation',
    icon: 'scale',
    color: 'bg-blue-50 border-blue-200',
    greeting: "Здравствуйте! Я ваш юрисконсульт. Чем я могу вам сегодня помочь в юридических вопросах?"
  },
  {
    id: 'tech',
    name: 'Technical Consultant',
    description: 'Expert tech support and solutions',
    icon: 'wrench',
    color: 'bg-green-50 border-green-200',
    greeting: "Здравствуйте! Я ваш технический консультант. В решении каких технических задач я могу вам помочь?"
  },
  {
    id: 'friend',
    name: 'AI Friend',
    description: 'Friendly companion for casual chat',
    icon: 'heart',
    color: 'bg-rose-50 border-rose-200',
    greeting: "Привет! Я твой друг-искусственный интеллект. Давай поболтаем обо всём, что тебя волнует!"
  }
];

const iconMap = {
  brain: Brain,
  scale: Scale,
  wrench: Wrench,
  heart: Heart
};

interface AIRoleSelectorProps {
  selectedRole: AIRole | null;
  onSelectRole: (role: AIRole) => void;
}

export function AIRoleSelector({ selectedRole, onSelectRole }: AIRoleSelectorProps) {
  return (
    <div className="w-full md:w-80 bg-white rounded-3xl p-6 shadow-sm flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl mb-2 text-gray-900">AI Companions</h1>
        <p className="text-sm text-gray-500">Select your AI assistant</p>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto">
        {aiRoles.map((role) => {
          const Icon = iconMap[role.icon as keyof typeof iconMap];
          const isSelected = selectedRole?.id === role.id;
          
          return (
            <button
              key={role.id}
              onClick={() => onSelectRole(role)}
              className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                isSelected 
                  ? role.color + ' scale-[1.02] shadow-md' 
                  : 'bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/60' : 'bg-white'}`}>
                  <Icon className="size-5 text-gray-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm mb-1 text-gray-900">{role.name}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{role.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          Choose an AI role to start chatting
        </p>
      </div>
    </div>
  );
}
