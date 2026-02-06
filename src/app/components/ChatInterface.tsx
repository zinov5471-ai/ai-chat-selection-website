import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { AIRole, Message } from '../types/ai';

interface ChatInterfaceProps {
  selectedRole: AIRole | null;
}

export function ChatInterface({ selectedRole }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRole) {
      setMessages([
        {
          id: '1',
          role: 'ai',
          content: selectedRole.greeting,
          timestamp: new Date()
        }
      ]);
    } else {
      setMessages([]);
    }
  }, [selectedRole]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || !selectedRole) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: getAIResponse(selectedRole.id, inputValue),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const getAIResponse = (roleId: string, userInput: string): string => {
    const responses: Record<string, string[]> = {
      psychologist: [
        "I hear you, and your feelings are completely valid. Can you tell me more about what's been on your mind?",
        "It sounds like you're going through a challenging time. Remember, it's okay to feel this way.",
        "That's an interesting perspective. How does that make you feel?"
      ],
      lawyer: [
        "Based on what you've shared, I'd recommend consulting the relevant legal documentation. Can you provide more details?",
        "That's an important legal consideration. Let me help you understand your options.",
        "From a legal standpoint, there are several factors to consider here."
      ],
      tech: [
        "Great question! Let me break down the technical solution for you step by step.",
        "I can help you troubleshoot this. Have you tried checking the system logs?",
        "That's a common technical issue. Here's what I recommend..."
      ],
      friend: [
        "That's so cool! Tell me more about it!",
        "I totally get what you mean. Life can be pretty interesting sometimes!",
        "Haha, that's awesome! What else is going on with you?"
      ]
    };

    const roleResponses = responses[roleId] || responses.friend;
    return roleResponses[Math.floor(Math.random() * roleResponses.length)];
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
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-gray-100">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
