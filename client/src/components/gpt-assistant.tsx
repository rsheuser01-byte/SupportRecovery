import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Send, Bot, TrendingUp, FileText, Users, MessageSquare, 
  Sparkles, Plus, DollarSign, UserPlus, Building, Code, Search,
  Calendar, Calculator, BarChart3, Target, Zap, Clock
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isAction?: boolean;
  actionType?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => Promise<string>;
  category: 'analysis' | 'actions' | 'data';
}

export function GPTAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your AI Business Assistant. I can help you with:

🔍 **Data Analysis**
• Revenue trends and financial reports
• Staff performance insights
• Business summaries and recommendations

⚡ **Quick Actions**
• Generate business reports
• Analyze revenue trends
• Get staff insights

💼 **Business Operations**
• Add revenue entries
• Create expenses
• Manage patients and staff
• Track time entries

What would you like me to help you with today?`,
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/gpt/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check if the AI created an expense and invalidate the cache
      if (data.response && typeof data.response === 'string') {
        if (data.response.includes('Successfully created expense') || 
            data.response.includes('expense created successfully') ||
            data.response.includes('Expense created successfully')) {
          // Invalidate the expenses query cache to refresh the UI
          queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
          toast({ title: "Expense created! Refreshing expenses list..." });
        }
        
        // Check for other entities and invalidate their caches too
        if (data.response.includes('Successfully created revenue') || 
            data.response.includes('revenue entry created successfully')) {
          queryClient.invalidateQueries({ queryKey: ['/api/revenue-entries'] });
          toast({ title: "Revenue entry created! Refreshing revenue list..." });
        }
        
        if (data.response.includes('Successfully created patient') || 
            data.response.includes('patient created successfully')) {
          queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
          toast({ title: "Patient created! Refreshing patients list..." });
        }
        
        if (data.response.includes('Successfully created staff') || 
            data.response.includes('staff member created successfully')) {
          queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
          toast({ title: "Staff member created! Refreshing staff list..." });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleQuickAction = async (action: () => Promise<string>) => {
    setIsLoading(true);
    try {
      const result = await action();
      const actionMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: result,
        timestamp: new Date(),
        isAction: true
      };
      setMessages(prev => [...prev, actionMessage]);
    } catch (error) {
      console.error('Quick action error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Failed to execute action. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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
      category: 'analysis',
      action: async () => {
        const response = await fetch('/api/gpt/business-report');
        const data = await response.json();
        return data.report;
      }
    },
    {
      id: 'revenue-trends',
      title: 'Revenue Trends',
      description: 'Analyze revenue patterns and performance',
      icon: <TrendingUp className="h-5 w-5" />,
      category: 'analysis',
      action: async () => {
        const response = await fetch('/api/gpt/revenue-trends');
        const data = await response.json();
        return data.analysis;
      }
    },
    {
      id: 'staff-insights',
      title: 'Staff Insights',
      description: 'Get staff performance and insights',
      icon: <Users className="h-5 w-5" />,
      category: 'analysis',
      action: async () => {
        const response = await fetch('/api/gpt/staff-insights');
        const data = await response.json();
        return data.insights;
      }
    },
    {
      id: 'add-revenue',
      title: 'Add Revenue',
      description: 'Create new revenue entry',
      icon: <DollarSign className="h-5 w-5" />,
      category: 'actions',
      action: async () => {
        return `To add a new revenue entry, I'll need:
• Date of service
• Check date
• Amount
• House/facility
• Service code
• Patient (optional)
• Notes (optional)

Would you like me to help you create one?`;
      }
    },
    {
      id: 'add-expense',
      title: 'Add Expense',
      description: 'Create new expense record',
      icon: <Calculator className="h-5 w-5" />,
      category: 'actions',
      action: async () => {
        return `To add a new expense, I'll need:
• Date
• Amount
• Vendor
• Category
• Description (optional)

Would you like me to help you create one?`;
      }
    },
    {
      id: 'add-patient',
      title: 'Add Patient',
      description: 'Create new patient record',
      icon: <UserPlus className="h-5 w-5" />,
      category: 'actions',
      action: async () => {
        return `To add a new patient, I'll need:
• Patient name
• Phone (optional)
• House/facility (optional)
• Program (optional)
• Start date (optional)

Would you like me to help you create one?`;
      }
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const formatMessage = (content: string) => {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />')
      .replace(/•/g, '• ');
  };

  const getActionIcon = (category: string) => {
    switch (category) {
      case 'analysis': return <BarChart3 className="h-4 w-4" />;
      case 'actions': return <Zap className="h-4 w-4" />;
      case 'data': return <Search className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">AI Business Assistant</h1>
              <p className="text-purple-100">Your intelligent business partner</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowActions(!showActions)}
            className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
          >
            {showActions ? 'Hide Actions' : 'Show Actions'}
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      {showActions && (
        <div className="bg-white p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-3 justify-start hover:shadow-md transition-all"
                onClick={() => handleQuickAction(action.action)}
                disabled={isLoading}
              >
                <div className="flex items-center space-x-3">
                  {action.icon}
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-gray-500">{action.description}</div>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {getActionIcon(action.category)}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 bg-gray-50 p-4">
        <ScrollArea className="h-[500px] w-full">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: formatMessage(message.content)
                    }}
                  />
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Form */}
      <div className="bg-white p-4 border-t">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about your business, or request an action..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 p-4 rounded-b-lg border-t">
        <div className="text-sm text-blue-700">
          <strong>💡 Tips:</strong> Try asking me to "add a revenue entry for $500 from ABC House" or 
          "show me staff performance" or "generate a business report". I can access all your business data 
          and help you manage operations!
        </div>
      </div>
    </div>
  );
}
