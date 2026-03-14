import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Send,
  User as UserIcon,
  Mic,
  MicOff,
  Image as ImageIcon,
  Sparkles,
  Volume2,
  VolumeX,
  Loader2,
  Check,
  CheckCheck
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import LogoImg from '@/imgs/logo.png';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  image?: string;
  isAudio?: boolean;
  status?: 'sending' | 'sent' | 'read';
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
      content: `Welcome to ${restaurantName}! ✨ I'm here to help you discover our exquisite menu, make recommendations, answer questions about ingredients, pricing, and more. How may I assist you today?`,
      sender: 'bot',
      timestamp: new Date(),
      status: 'read',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage || 'Sent an image',
      sender: 'user',
      timestamp: new Date(),
      image: selectedImage || undefined,
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setSelectedImage(null);
    setIsTyping(true);

    // Update message status to sent
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );
    }, 500);

    // Simulate bot response (will be replaced with AI integration)
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Thank you for your message! I'm here to provide you with the finest assistance. ${
          selectedImage ? "I can see the image you've shared. " : ""
        }Let me help you with that right away. Our team at ${restaurantName} is dedicated to making your experience exceptional! 🌟`,
        sender: 'bot',
        timestamp: new Date(),
        status: 'read',
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);

      // Mark user message as read
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'read' } : msg
        )
      );
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Here you would send the audio to your AI service for transcription
        toast.success('Voice message recorded!');
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Recording... Tap to stop');
    } catch (error) {
      toast.error('Could not access microphone');
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        toast.success('Image selected! Add a message or send directly.');
      };
      reader.readAsDataURL(file);
    }
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Text-to-speech not supported');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#1D2956]/98 via-[#0F172A]/98 to-black/98 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="h-full flex flex-col max-w-md mx-auto relative">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#536DFE]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#536DFE] to-[#6B7FFF] shadow-2xl shadow-[#536DFE]/20">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-md"></div>
                <Avatar className="w-12 h-12 border-3 border-white/30 shadow-xl relative">
                  <AvatarImage src={LogoImg} alt="Royal Plate" />
                  <AvatarFallback className="bg-white text-[#536DFE] font-bold">
                    RP
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-lg">
                  <div className="w-full h-full bg-emerald-400 rounded-full animate-ping"></div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Talk To Us
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                </h2>
                <p className="text-xs text-white/80 font-medium">
                  {restaurantName} • Always here to help
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-white/20 text-white transition-all hover:rotate-90 duration-300"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-6 relative">
          <div className="space-y-6 mb-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-4 duration-500`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Avatar */}
                {message.sender === 'bot' ? (
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-[#536DFE]/20 rounded-full blur-md"></div>
                    <Avatar className="w-10 h-10 border-2 border-[#536DFE]/30 shadow-lg relative bg-gradient-to-br from-[#536DFE] to-[#6B7FFF]">
                      <AvatarImage src={LogoImg} alt="Royal Plate" />
                      <AvatarFallback className="bg-[#536DFE] text-white font-bold text-xs">
                        RP
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ) : (
                  <Avatar className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600/50 shadow-lg flex-shrink-0">
                    <AvatarFallback>
                      <UserIcon className="w-5 h-5 text-gray-300" />
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Message Bubble */}
                <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  {message.image && (
                    <div className="mb-2 rounded-2xl overflow-hidden shadow-xl border-2 border-white/10">
                      <img src={message.image} alt="Uploaded" className="max-w-full h-auto" />
                    </div>
                  )}
                  <div className="relative group">
                    <Card
                      className={`px-4 py-3 shadow-xl border-0 transition-all duration-300 ${
                        message.sender === 'bot'
                          ? 'bg-gradient-to-br from-white/95 to-white/90 text-[#1D2956] backdrop-blur-sm'
                          : 'bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] text-white shadow-[#536DFE]/30'
                      }`}
                    >
                      <p className="text-sm leading-relaxed font-medium">{message.content}</p>
                    </Card>

                    {/* Message Actions */}
                    {message.sender === 'bot' && (
                      <button
                        onClick={() => isSpeaking ? stopSpeaking() : speakMessage(message.content)}
                        className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#536DFE] text-white p-2 rounded-full shadow-lg hover:scale-110"
                      >
                        {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 px-2">
                    <span className="text-[10px] text-white/60 font-medium">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.sender === 'user' && (
                      <span className="text-white/60">
                        {message.status === 'sending' && <Loader2 className="w-3 h-3 animate-spin" />}
                        {message.status === 'sent' && <Check className="w-3 h-3" />}
                        {message.status === 'read' && <CheckCheck className="w-3 h-3 text-[#536DFE]" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 animate-in slide-in-from-bottom-4">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-[#536DFE]/20 rounded-full blur-md"></div>
                  <Avatar className="w-10 h-10 border-2 border-[#536DFE]/30 shadow-lg relative bg-gradient-to-br from-[#536DFE] to-[#6B7FFF]">
                    <AvatarImage src={LogoImg} alt="Royal Plate" />
                    <AvatarFallback className="bg-[#536DFE] text-white font-bold text-xs">
                      RP
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Card className="px-5 py-3 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-[#536DFE] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-[#536DFE] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-[#536DFE] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Suggestions */}
        {messages.length === 1 && (
          <div className="px-4 pb-3 relative">
            <p className="text-xs text-white/70 mb-3 font-semibold flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Quick questions
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "What's your signature dish?",
                "Show me vegetarian options",
                "What are your hours?",
                "Tell me about desserts",
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 hover:scale-105 transition-all duration-200 backdrop-blur-sm font-medium"
                  onClick={() => setInputMessage(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Image Preview */}
        {selectedImage && (
          <div className="px-4 pb-3 relative">
            <div className="relative inline-block">
              <img src={selectedImage} alt="Selected" className="h-20 w-20 object-cover rounded-xl border-2 border-[#536DFE]/50 shadow-lg" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="relative bg-gradient-to-r from-[#1D2956]/95 to-[#0F172A]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl">
          <div className="px-4 py-4 flex gap-2 items-end">
            {/* Image Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:scale-110 transition-all duration-200 flex-shrink-0"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>

            {/* Voice Recording */}
            <Button
              variant="ghost"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              className={`rounded-full border flex-shrink-0 transition-all duration-200 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-400 animate-pulse scale-110'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:scale-110'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#536DFE] focus:ring-2 focus:ring-[#536DFE]/30 rounded-2xl h-12 px-4 backdrop-blur-sm font-medium"
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() && !selectedImage}
              className="rounded-full h-12 w-12 bg-gradient-to-br from-[#536DFE] to-[#6B7FFF] hover:from-[#6B7FFF] hover:to-[#536DFE] shadow-xl shadow-[#536DFE]/30 hover:shadow-2xl hover:shadow-[#536DFE]/50 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0"
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          <div className="px-4 pb-3 pt-0">
            <p className="text-[10px] text-white/50 text-center font-medium flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              Powered by AI • We're here to make your experience exceptional
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantChatbot;
