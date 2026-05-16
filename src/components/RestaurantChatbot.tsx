import { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Mic,
  MicOff,
  Check,
  CheckCheck,
  Crown,
  ArrowUpRight,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  image?: string;
  status?: 'sending' | 'sent' | 'read';
}

interface RestaurantChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  restaurantImage?: string;
}

const quickActions = [
  { label: 'Signature dishes', query: 'What are your signature dishes?' },
  { label: 'Wine pairing', query: 'Recommend a wine pairing' },
  { label: 'Chef\'s tasting menu', query: 'Tell me about the tasting menu' },
  { label: 'Dietary needs', query: 'What vegetarian options do you have?' },
  { label: 'Make a reservation', query: 'I\'d like to make a reservation' },
  { label: 'Private dining', query: 'Do you offer private dining?' },
];

const typingDurations = [1800, 2800, 2200, 3000, 2000];

const RestaurantChatbot = ({ isOpen, onClose, restaurantName }: RestaurantChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Good evening. Welcome to ${restaurantName}. I am your personal concierge.`,
      sender: 'bot',
      timestamp: new Date(),
      status: 'read',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesElRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    const el = messagesElRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isTyping]);

  const respond = (userMsg: string, hasImage: boolean) => {
    const delay = typingDurations[Math.floor(Math.random() * typingDurations.length)];
    setIsTyping(true);

    const lower = userMsg.toLowerCase();

    let response = '';
    if (lower.includes('signature') || lower.includes('recommend') || lower.includes('best')) {
      response = `Our signature offerings change with the seasons, guided by what is finest. I would be delighted to recommend our chef's tasting menu — a curated journey of five courses, each paired with an optional wine selection. Shall I reserve a table for you?`;
    } else if (lower.includes('vegetarian') || lower.includes('dietary') || lower.includes('allerg')) {
      response = `Of course. Our kitchen takes dietary preferences with the utmost seriousness. We offer an exquisite vegetarian tasting menu, and every dish can be adapted for gluten-free or other requirements. Would you like me to note any specific dietary needs for your reservation?`;
    } else if (lower.includes('reservation') || lower.includes('book') || lower.includes('table')) {
      response = `It would be my pleasure to arrange a table for you. May I know your preferred date, time, and the size of your party? I shall ensure everything is prepared to your liking.`;
    } else if (lower.includes('wine') || lower.includes('pairing')) {
      response = `Our sommelier has curated an exceptional wine list featuring both old-world classics and emerging vineyards. I can recommend a glass or bottle to complement each course. May I suggest our reserve Burgundy or perhaps a Super Tuscan?`;
    } else if (lower.includes('menu') || lower.includes('course') || lower.includes('tasting')) {
      response = `The tasting menu is a narrative in five acts — each plate a chapter. Begin with amuse-bouche, followed by appetiser, a seafood interlude, the main course, and conclude with a dessert crafted by our pâtissier. The full experience takes approximately two hours. Shall I arrange it?`;
    } else if (lower.includes('private') || lower.includes('event') || lower.includes('celebrat')) {
      response = `Our private dining room seats up to twenty guests and offers an intimate setting for special occasions. We also offer a chef's table experience within the kitchen itself. Would you like me to connect you with our events team?`;
    } else if (lower.includes('hour') || lower.includes('open') || lower.includes('time')) {
      response = `We welcome guests from 17:00 to 23:00, Tuesday through Sunday. Our kitchen takes the final order at 22:00. May I reserve a table for you this evening?`;
    } else {
      response = `Thank you for your inquiry. ${hasImage ? 'I have received your image and ' : ''}Allow me to assist you with the finest care. Would you like me to arrange a reservation, recommend a dish, or perhaps tell you more about our culinary philosophy? I am entirely at your service.`;
    }

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date(),
        status: 'read',
      }]);
      setIsTyping(false);
      setShowWelcome(false);
    }, delay);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;

    const text = inputMessage.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      content: text || 'Sent an image',
      sender: 'user',
      timestamp: new Date(),
      image: selectedImage || undefined,
      status: 'sending',
    };

    setMessages(prev => [...prev, userMessage]);
    const sentText = text;
    const sentImage = !!selectedImage;
    setInputMessage('');
    setSelectedImage(null);
    setShowWelcome(false);

    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
      ));
    }, 400);

    respond(sentText, sentImage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };

  const handleQuickAction = (query: string) => {
    setInputMessage(query);
    inputRef.current?.focus();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorder.onstop = () => {
        toast.success('Voice recorded');
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error('Microphone access unavailable');
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
        toast.error('Image must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      backgroundColor: '#0D0A08',
      overflow: 'hidden',
    }}>

      <div style={{
        height: '100dvh',
        maxWidth: '430px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* ── Ambient Glow (subtle) ── */}
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: '-160px', left: '-160px', width: '320px', height: '320px',
            borderRadius: '50%', opacity: 0.06,
            background: 'radial-gradient(circle, #C8A45C 0%, transparent 70%)',
            animation: 'pulse-soft 6s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '-160px', right: '-160px', width: '384px', height: '384px',
            borderRadius: '50%', opacity: 0.05,
            background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)',
            animation: 'pulse-soft 8s ease-in-out infinite',
            animationDelay: '3s',
          }} />
        </div>

        {/* ── Gold Motes ── */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute', width: 4, height: 4, borderRadius: '50%',
              background: '#C8A45C', top: `${15 + i * 10}%`, left: `${8 + i * 11}%`,
              opacity: 0.3, boxShadow: '0 0 6px rgba(200,164,92,0.6)',
              animation: `float ${5 + i * 0.7}s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
            }} />
          ))}
        </div>

        {/* ═══════════════ HEADER (fixed top) ═══════════════ */}
        <div style={{
          position: 'relative', flexShrink: 0, zIndex: 10,
          background: 'linear-gradient(180deg, #1A1410 0%, #0D0A08 100%)',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, #C8A45C, transparent)',
          }} />
          <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(200,164,92,0.2), rgba(212,175,55,0.1))',
                  border: '1.5px solid rgba(200,164,92,0.4)',
                  boxShadow: '0 0 24px rgba(200,164,92,0.15)',
                }}>
                  <Crown style={{ width: 20, height: 20, color: '#C8A45C' }} />
                </div>
                <div style={{
                  position: 'absolute', bottom: -2, right: -2, width: 12, height: 12,
                  borderRadius: '50%', border: '2px solid #0D0A08',
                  background: '#34D399', boxShadow: '0 0 8px rgba(52,211,153,0.4)',
                }} />
              </div>
              <div>
                <div style={{
                  fontSize: 13, fontWeight: 700, letterSpacing: '0.25em',
                  textTransform: 'uppercase', color: '#C8A45C',
                }}>Concierge</div>
                <div style={{ fontSize: 11, fontWeight: 500, marginTop: 1, color: 'rgba(255,255,255,0.4)' }}>
                  {restaurantName}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,164,92,0.2)',
                color: 'rgba(255,255,255,0.5)', transition: 'all 0.3s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(200,164,92,0.15)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* ═══════════════ MESSAGES (only this scrolls) ═══════════════ */}
        <div ref={messagesElRef} style={{
          flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          background: 'linear-gradient(180deg, #0D0A08 0%, #120E0A 100%)',
          overscrollBehavior: 'contain',
        }}>
          <div style={{ padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Welcome Card */}
              {showWelcome && messages.length === 1 && (
                <div style={{ animation: 'slideUpIn 0.6s cubic-bezier(0.22,1,0.36,1)' }}>
                  <div style={{
                    padding: 20, borderRadius: 24,
                    background: 'linear-gradient(135deg, rgba(200,164,92,0.08), rgba(212,175,55,0.04))',
                    border: '1px solid rgba(200,164,92,0.2)',
                    boxShadow: '0 4px 32px rgba(200,164,92,0.06)',
                  }}>
                    <p style={{ fontSize: 14, lineHeight: 1.6, fontWeight: 500, marginBottom: 10, color: 'rgba(255,255,255,0.85)' }}>
                      Good evening. Welcome to {restaurantName}. I am your personal concierge.
                    </p>
                    <p style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)' }}>
                      How may I curate your evening? Whether you desire a table, a recommendation, or simply wish to learn more — I am entirely at your service.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {(showWelcome || messages.length <= 2) && (
                <div style={{ animation: 'slideUpIn 0.6s cubic-bezier(0.22,1,0.36,1)', animationDelay: '0.15s' }}>
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.3em',
                    textTransform: 'uppercase', marginBottom: 10, color: 'rgba(200,164,92,0.6)',
                  }}>
                    How may I assist?
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.query)}
                        className="group"
                        style={{
                          cursor: 'pointer', textAlign: 'left', padding: '8px 16px', borderRadius: 16,
                          fontSize: 12, fontWeight: 500, transition: 'all 0.3s',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,164,92,0.15)',
                          color: 'rgba(255,255,255,0.6)',
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget;
                          el.style.background = 'rgba(200,164,92,0.1)';
                          el.style.borderColor = 'rgba(200,164,92,0.3)';
                          el.style.color = '#C8A45C';
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget;
                          el.style.background = 'rgba(255,255,255,0.04)';
                          el.style.borderColor = 'rgba(200,164,92,0.15)';
                          el.style.color = 'rgba(255,255,255,0.6)';
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {action.label}
                          <ArrowUpRight style={{
                            width: 12, height: 12, color: '#C8A45C',
                            opacity: 0, transition: 'opacity 0.3s',
                          }} className="group-hover:opacity-100" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex', gap: 10, alignItems: 'flex-end',
                    flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                    animation: 'slideUpIn 0.4s cubic-bezier(0.22,1,0.36,1)',
                  }}
                >
                  {/* Avatar */}
                  <div style={{ flexShrink: 0, paddingBottom: 4 }}>
                    {message.sender === 'bot' ? (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(200,164,92,0.2), rgba(212,175,55,0.1))',
                        border: '1px solid rgba(200,164,92,0.3)',
                      }}>
                        <Crown style={{ width: 16, height: 16, color: '#C8A45C' }} />
                      </div>
                    ) : (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}>
                        <User style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.5)' }} />
                      </div>
                    )}
                  </div>

                  {/* Bubble */}
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                  }}>
                    {message.image && (
                      <div style={{ marginBottom: 6, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(200,164,92,0.2)' }}>
                        <img src={message.image} alt="Shared" style={{ width: '100%', height: 'auto', maxHeight: 140, objectFit: 'cover' }} />
                      </div>
                    )}

                    {message.sender === 'bot' ? (
                      <div style={{
                        padding: '14px 18px', borderRadius: 20, fontSize: 13.5, lineHeight: 1.6,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                        border: '1px solid rgba(200,164,92,0.15)',
                        color: 'rgba(255,255,255,0.88)',
                        borderBottomLeftRadius: 6,
                      }}>
                        {message.content}
                      </div>
                    ) : (
                      <div style={{
                        padding: '14px 18px', borderRadius: 20, fontSize: 13.5, lineHeight: 1.6, fontWeight: 500,
                        background: 'linear-gradient(135deg, rgba(200,164,92,0.15), rgba(212,175,55,0.08))',
                        border: '1px solid rgba(200,164,92,0.25)',
                        color: '#F5F0E8',
                        borderBottomRightRadius: 6,
                        boxShadow: '0 2px 16px rgba(200,164,92,0.08)',
                      }}>
                        {message.content}
                      </div>
                    )}

                    {/* Status */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '0 4px',
                      flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)' }}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.sender === 'user' && message.status === 'sent' && (
                        <Check style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.25)' }} />
                      )}
                      {message.sender === 'user' && message.status === 'read' && (
                        <CheckCheck style={{ width: 12, height: 12, color: '#C8A45C' }} />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing */}
              {isTyping && (
                <div style={{
                  display: 'flex', gap: 10, alignItems: 'flex-end',
                  animation: 'slideUpIn 0.3s cubic-bezier(0.22,1,0.36,1)',
                }}>
                  <div style={{ flexShrink: 0, paddingBottom: 4 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, rgba(200,164,92,0.2), rgba(212,175,55,0.1))',
                      border: '1px solid rgba(200,164,92,0.3)',
                    }}>
                      <Crown style={{ width: 16, height: 16, color: '#C8A45C' }} />
                    </div>
                  </div>
                  <div style={{
                    padding: '14px 18px', borderRadius: 20,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                    border: '1px solid rgba(200,164,92,0.15)',
                    borderBottomLeftRadius: 6,
                  }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 7, height: 7, borderRadius: '50%',
                          backgroundColor: '#C8A45C',
                          animation: `bounce 0.8s infinite`,
                          animationDelay: `${i * 0.15}s`,
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* ═══════════════ INPUT BAR (fixed bottom) ═══════════════ */}
        <div style={{
          position: 'relative', flexShrink: 0, zIndex: 10,
          background: 'linear-gradient(0deg, #0D0A08 0%, #120E0A 100%)',
          borderTop: '1px solid rgba(200,164,92,0.1)',
        }}>

          {selectedImage && (
            <div style={{ padding: '12px 20px 0' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={selectedImage} alt="Preview" style={{
                  width: 56, height: 56, objectFit: 'cover', borderRadius: 12,
                  border: '2px solid rgba(200,164,92,0.4)',
                }} />
                <button
                  onClick={() => setSelectedImage(null)}
                  style={{
                    position: 'absolute', top: -8, right: -8, width: 20, height: 20,
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'transform 0.2s',
                    background: '#C8A45C', color: '#0D0A08', border: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </div>
            </div>
          )}

          <div style={{ padding: '12px 20px 10px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            {/* Image */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,164,92,0.15)',
                color: 'rgba(255,255,255,0.4)',
              }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(200,164,92,0.1)'; el.style.color = '#C8A45C'; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = 'rgba(255,255,255,0.4)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>

            {/* Voice */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                background: isRecording ? '#C8A45C' : 'rgba(255,255,255,0.04)',
                border: isRecording ? 'none' : '1px solid rgba(200,164,92,0.15)',
                color: isRecording ? '#0D0A08' : 'rgba(255,255,255,0.4)',
                boxShadow: isRecording ? '0 0 24px rgba(200,164,92,0.4)' : 'none',
              }}
              onMouseEnter={e => { if (!isRecording) { const el = e.currentTarget; el.style.background = 'rgba(200,164,92,0.1)'; el.style.color = '#C8A45C'; }}}
              onMouseLeave={e => { if (!isRecording) { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = 'rgba(255,255,255,0.4)'; }}}
            >
              {isRecording ? <MicOff style={{ width: 18, height: 18 }} /> : <Mic style={{ width: 18, height: 18 }} />}
            </button>

            {/* Text Input */}
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                autoComplete="off"
                style={{
                  width: '100%', height: 48, padding: '0 20px', borderRadius: 18,
                  fontSize: 14, fontWeight: 500, outline: 'none', border: '1px solid rgba(200,164,92,0.15)',
                  background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.85)',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(200,164,92,0.4)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(200,164,92,0.15)'}
              />
            </div>

            {/* Send */}
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() && !selectedImage}
              style={{
                width: 48, height: 48, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
                border: 'none',
                background: (inputMessage.trim() || selectedImage)
                  ? 'linear-gradient(135deg, #C8A45C, #D4AF37)'
                  : 'rgba(255,255,255,0.04)',
                color: (inputMessage.trim() || selectedImage) ? '#0D0A08' : 'rgba(255,255,255,0.3)',
                boxShadow: (inputMessage.trim() || selectedImage)
                  ? '0 4px 24px rgba(200,164,92,0.35)' : 'none',
                opacity: (inputMessage.trim() || selectedImage) ? 1 : 0.3,
              }}
              onMouseEnter={e => {
                if (inputMessage.trim() || selectedImage)
                  e.currentTarget.style.boxShadow = '0 4px 32px rgba(200,164,92,0.5)';
              }}
              onMouseLeave={e => {
                if (inputMessage.trim() || selectedImage)
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(200,164,92,0.35)';
              }}
            >
              <Send style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <div style={{ padding: '0 20px 12px', textAlign: 'center' }}>
            <span style={{
              fontSize: 9, fontWeight: 500, letterSpacing: '0.35em',
              textTransform: 'uppercase', color: 'rgba(200,164,92,0.2)',
            }}>
              Concierge
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RestaurantChatbot;
