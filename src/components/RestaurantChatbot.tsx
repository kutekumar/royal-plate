import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface RestaurantChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  restaurantImage?: string;
}

const RestaurantChatbot = ({ isOpen, onClose, restaurantName, restaurantImage }: RestaurantChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello! 👋 Welcome to ${restaurantName}! I'm here to help you with any questions about our menu, recommendations, pricing, ingredients, or anything else. How can I assist you today?`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot response (will be replaced with N8N AI integration)
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Thank you for reaching out! I'm here to help you. Let me get that information for you right away. We're excited to assist you with your dining experience at ${restaurantName}! 😊`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in">
      <div className="h-full flex flex-col max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-card/90 backdrop-blur-xl border-b border-border/50 shadow-lg">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-primary">
                  <AvatarImage src={restaurantImage} alt={restaurantName} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {restaurantName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card animate-pulse"></div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{restaurantName}</h2>
                <p className="text-xs text-muted-foreground">
                  Online now • Happy to help you
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-4">
          <div className="space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                {message.sender === 'bot' ? (
                  <Avatar className="w-8 h-8 border border-primary/20">
                    <AvatarImage src={restaurantImage} alt={restaurantName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {restaurantName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="w-8 h-8 bg-muted">
                    <AvatarFallback>
                      <UserIcon className="w-4 h-4 text-foreground" />
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Message Bubble */}
                <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  <Card
                    className={`px-4 py-3 ${
                      message.sender === 'bot'
                        ? 'bg-card border-border/50'
                        : 'bg-primary text-primary-foreground border-primary luxury-shadow'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </Card>
                  <span className="text-[10px] text-muted-foreground mt-1 px-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 border border-primary/20">
                  <AvatarImage src={restaurantImage} alt={restaurantName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {restaurantName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Card className="px-4 py-3 bg-card border-border/50">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested Questions (Optional - Shows on initial load) */}
        {messages.length === 1 && (
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "What's your most popular dish?",
                "Do you have vegetarian options?",
                "What are your opening hours?",
                "Show me the dessert menu",
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 hover:bg-primary/10 hover:text-primary hover:border-primary"
                  onClick={() => setInputMessage(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-card/90 backdrop-blur-xl border-t border-border/50 shadow-lg">
          <div className="px-4 py-4 flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about our menu, prices, or restaurant..."
              className="flex-1 bg-muted/50 border-border/50 focus:border-primary"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="luxury-gradient hover:shadow-xl hover:shadow-primary/30 transition-all"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="px-4 pb-3 pt-0">
            <p className="text-[10px] text-muted-foreground text-center">
              We're here to help • Responses may take a moment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantChatbot;
