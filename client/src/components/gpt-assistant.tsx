import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, TrendingUp, FileText, Users, MessageSquare, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

export function GPTAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage = content.trim();
    setInputValue('');
    addMessage('user', userMessage);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/gpt/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      addMessage('assistant', data.response);
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickAction = async (action: () => Promise<string>) => {
    setIsLoading(true);
    try {
      const result = await action();
      addMessage('assistant', result);
    } catch (error) {
      console.error('Quick action error:', error);
      addMessage('assistant', 'Sorry, I encountered an error processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'business-report',
      title: 'Business Report',
      description: 'Generate comprehensive business overview',
      icon: <FileText className="h-5 w-5" />,
      action: async () => {
        const response = await fetch('/api/gpt/business-report');
        const data = await response.json();
        return data.report;
      },
    },
    {
      id: 'revenue-trends',
      title: 'Revenue Trends',
      description: 'Analyze revenue patterns and growth',
      icon: <TrendingUp className="h-5 w-5" />,
      action: async () => {
        const response = await fetch('/api/gpt/revenue-trends');
        const data = await response.json();
        return data.analysis;
      },
    },
    {
      id: 'staff-insights',
      title: 'Staff Insights',
      description: 'Get staff performance analysis',
      icon: <Users className="h-5 w-5" />,
      action: async () => {
        const response = await fetch('/api/gpt/staff-insights');
        const data = await response.json();
        return data.insights;
      },
    },
  ];

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <Card className="mb-4 border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-800">AI Business Assistant</CardTitle>
              <CardDescription className="text-gray-600">
                Your intelligent business partner for insights and analysis
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className="h-auto p-3 flex flex-col items-start space-y-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              onClick={() => handleQuickAction(action.action)}
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <div className="text-blue-600">{action.icon}</div>
                <span className="font-medium text-sm">{action.title}</span>
              </div>
              <span className="text-xs text-gray-600 text-left">{action.description}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col min-h-0 border-0 shadow-sm">
        <CardHeader className="pb-3 border-b bg-gray-50">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Chat</span>
            {isTyping && (
              <Badge variant="secondary" className="ml-2">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                AI is typing...
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Start a conversation with your AI business assistant</p>
                <p className="text-xs mt-1">Ask about revenue, expenses, staff performance, or any business insights</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Form */}
          <div className="border-t p-4 bg-white">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about your business..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!inputValue.trim() || isLoading}
                className="px-4"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          💡 Try asking: "How is my business performing this month?" or "What are my top revenue sources?"
        </p>
      </div>
    </div>
  );
}
