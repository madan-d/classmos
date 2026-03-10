import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { CourseStructure } from '../types';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface AITutorScreenProps {
  courseStructure: CourseStructure | null;
}

const AITutorScreen: React.FC<AITutorScreenProps> = ({ courseStructure }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi there! I'm your AI Tutor. What would you like to learn about today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // Build syllabus context from courseStructure
      let context = 'No specific course context provided.';
      if (courseStructure && courseStructure.units) {
        context = `Course Title: ${courseStructure.courseTitle}. Units: ` + 
          courseStructure.units.map((u, i) => `Unit ${i+1} (${u.title}): ${u.description}`).join(' | ');
      }

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: context,
          history: messages.filter(m => m.content !== "Hi there! I'm your AI Tutor. What would you like to learn about today?")
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex justify-center p-4 lg:p-8 bg-duo-bg min-h-screen">
      <div className="w-full max-w-4xl flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] bg-duo-card border-2 border-duo-border rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-4 border-b-2 border-duo-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-duo-blue/20 flex items-center justify-center">
            <Bot className="text-duo-blue" size={24} />
          </div>
          <div>
            <h2 className="font-bold text-duo-text text-lg tracking-wide">AI Tutor</h2>
            <p className="text-sm text-duo-muted font-medium">Ask me anything about your current lessons!</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-duo-bg/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-duo-green/20 text-duo-green' : 'bg-duo-blue/20 text-duo-blue'}`}>
                {msg.role === 'user' ? <UserIcon size={18} /> : <Bot size={18} />}
              </div>
              <div className={`max-w-[75%] rounded-2xl p-3 px-4 ${msg.role === 'user' ? 'bg-duo-green text-white rounded-br-none' : 'bg-duo-card border-2 border-duo-border text-duo-text rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-duo-blue/20 text-duo-blue flex items-center justify-center">
                 <Bot size={18} />
              </div>
              <div className="bg-duo-card border-2 border-duo-border rounded-2xl rounded-bl-none p-4 flex items-center gap-2">
                 <Loader2 className="animate-spin text-duo-blue" size={20} />
                 <span className="text-duo-muted text-sm font-bold tracking-wide">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t-2 border-duo-border bg-duo-card">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask your tutor a question..."
              className="flex-1 resize-none h-12 rounded-xl border-2 border-duo-border bg-duo-bg p-3 focus:outline-none focus:border-duo-blue focus:ring-4 focus:ring-duo-blue/20 transition-all font-medium py-2.5 text-duo-text"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-12 w-12 rounded-xl bg-duo-blue text-white flex items-center justify-center hover:bg-duo-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITutorScreen;
