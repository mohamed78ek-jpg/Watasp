
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Plus, 
  Send, 
  WifiOff,
  Zap,
  ShieldCheck,
  Search,
  MoreVertical,
  Users,
  Bell,
  Trash2,
  CheckCircle,
  Power,
  Trash,
  MessageCircle,
  Bot,
  Phone,
  Terminal,
  Activity,
  Film,
  Star,
  Clapperboard,
  Tv,
  TrendingUp,
  Heart
} from 'lucide-react';
import { BotSettings, ChatSession, Message, AutomationRule, CommandLog } from './types';
import { botBrain } from './services/geminiService';

const INITIAL_SETTINGS: BotSettings = {
  name: "سيني بوت (CineBot) 🎬",
  phoneNumber: "0695 4757 82",
  persona: "أنت خبير سينمائي وموسوعة أفلام عالمية. مهمتك مساعدة المستخدمين في اختيار الأفلام والمسلسلات، تقديم ملخصات بدون حرق، وتزويدهم بالتقييمات. أسلوبك مشوق، فني، ودود، وتستخدم الرموز التعبيرية السينمائية.",
  status: 'offline',
  autoReply: true,
  temperature: 0.8
};

const INITIAL_CHATS: ChatSession[] = [
  {
    id: '1',
    contactName: 'أحمد علي',
    lastMessage: 'أبحث عن فيلم رعب قوي لنهاية الأسبوع؟',
    timestamp: new Date(),
    unreadCount: 1,
    messages: [
      { id: 'm1', text: 'مرحباً بك في سيني بوت! هل تبحث عن سهرة سينمائية اليوم؟ 🍿', sender: 'bot', timestamp: new Date(Date.now() - 100000) },
      { id: 'm2', text: 'أهلاً، أبحث عن فيلم رعب قوي لنهاية الأسبوع؟', sender: 'user', timestamp: new Date() }
    ]
  },
  {
    id: '2',
    contactName: 'سارة خالد',
    lastMessage: 'إيش رأيك في فيلم Oppenheimer؟',
    timestamp: new Date(Date.now() - 3600000),
    unreadCount: 0,
    messages: [
      { id: 'n1', text: 'إيش رأيك في فيلم Oppenheimer؟ ينفع أشوفه مع العائلة؟', sender: 'user', timestamp: new Date(Date.now() - 3600000) }
    ]
  }
];

const INITIAL_RULES: AutomationRule[] = [
  { id: 'r1', trigger: 'أفضل فيلم', response: 'حسب التصنيفات العالمية، فيلم (The Godfather) يتصدر القائمة، لكن لو تحب شيء حديث ففيلم (Oppenheimer) أو (Interstellar) خيارات أسطورية! 📽️✨', isActive: true },
  { id: 'r2', trigger: 'تقييم', response: 'أنا هنا لخدمتك! أعطني اسم الفيلم وسأزودك بتقييمه في IMDb و Rotten Tomatoes فوراً. ⭐️', isActive: true },
  { id: 'r3', trigger: 'أكشن', response: 'لعشاق الأدرينالين! أرشح لك سلسلة John Wick أو فيلم Mad Max: Fury Road. استعد للحماس! 🔥🎬', isActive: true }
];

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-200 ${
      active ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'settings' | 'rules'>('dashboard');
  const [settings, setSettings] = useState<BotSettings>(INITIAL_SETTINGS);
  const [chats, setChats] = useState<ChatSession[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>(chats[0].id);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
  const [newRule, setNewRule] = useState({ trigger: '', response: '' });
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, isTyping, activeChatId]);

  const toggleConnection = () => {
    if (settings.status === 'offline') {
      setSettings(prev => ({ ...prev, status: 'connecting' }));
      setTimeout(() => {
        setSettings(prev => ({ ...prev, status: 'online' }));
        logCommand(`Bot Linked to ${settings.phoneNumber}`, 'success');
      }, 1500);
    } else {
      setSettings(prev => ({ ...prev, status: 'offline' }));
      logCommand('CineBot Shutdown', 'success');
    }
  };

  const logCommand = (cmd: string, status: 'success' | 'failed') => {
    const newLog: CommandLog = {
      id: Date.now().toString(),
      command: cmd,
      status,
      timestamp: new Date()
    };
    setCommandLogs(prev => [newLog, ...prev].slice(0, 10));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeChatId || settings.status !== 'online') return;

    const currentText = inputText.trim();
    
    // Command Processing Logic
    if (currentText.startsWith('/')) {
      processCommand(currentText);
      setInputText('');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentText,
      sender: 'user',
      timestamp: new Date()
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, userMessage],
          lastMessage: currentText,
          timestamp: new Date(),
          unreadCount: 0
        };
      }
      return chat;
    }));
    setInputText('');

    if (settings.autoReply) {
      setIsTyping(true);
      const matchedRule = rules.find(r => r.isActive && currentText.toLowerCase().includes(r.trigger.toLowerCase()));
      let botResponseText = "";
      
      if (matchedRule) {
        await new Promise(r => setTimeout(r, 1000));
        botResponseText = matchedRule.response;
        logCommand(`Rule Triggered: ${matchedRule.trigger}`, 'success');
      } else {
        const activeChat = chats.find(c => c.id === activeChatId);
        const history = (activeChat?.messages || []).slice(-10)
          .filter(m => m.sender !== 'system')
          .map(m => ({
            role: m.sender === 'bot' ? 'model' : 'user' as any,
            parts: [{ text: m.text }]
          }));
        botResponseText = await botBrain.getResponse(currentText, settings.persona, history);
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, botMessage],
            lastMessage: botResponseText,
            timestamp: new Date()
          };
        }
        return chat;
      }));
      setIsTyping(false);
    }
  };

  const processCommand = (cmd: string) => {
    const parts = cmd.toLowerCase().split(' ');
    const command = parts[0];
    let response = "";

    switch(command) {
      case '/status':
        response = `حالة البوت السينمائي: ${settings.status === 'online' ? 'جاهز للعرض ✅' : 'في الكواليس ❌'}`;
        logCommand('Status Check', 'success');
        break;
      case '/info':
        response = `🎬 اسم البوت: ${settings.name}\n📞 الرقم المرتبط: ${settings.phoneNumber}\n🌟 الشخصية: خبير أفلام\n📊 عدد قواعد الأتمتة: ${rules.length}`;
        logCommand('Bot Info Command', 'success');
        break;
      case '/recommend':
        response = "جرب مشاهدة فيلم (The Prestige) للمخرج نولان، فيلم يجمع بين الغموض والإثارة بطريقة عبقرية!";
        logCommand('Quick Recommendation', 'success');
        break;
      default:
        response = "أمر غير معروف. جرب /info أو /status أو /recommend";
        logCommand(`Unknown Command: ${cmd}`, 'failed');
    }

    const systemMsg: Message = {
      id: Date.now().toString(),
      text: `[نظام الأوامر]: ${response}`,
      sender: 'system',
      timestamp: new Date()
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return { ...chat, messages: [...chat.messages, systemMsg], lastMessage: response, timestamp: new Date() };
      }
      return chat;
    }));
  };

  const addRule = () => {
    if (!newRule.trigger || !newRule.response) return;
    const rule: AutomationRule = {
      id: Date.now().toString(),
      trigger: newRule.trigger,
      response: newRule.response,
      isActive: true
    };
    setRules([...rules, rule]);
    setNewRule({ trigger: '', response: '' });
    logCommand(`Created Rule: ${rule.trigger}`, 'success');
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="flex h-screen bg-[#f0f2f5] font-sans selection:bg-indigo-200" dir="rtl">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-l border-gray-200 flex flex-col p-4 shadow-sm z-20">
        <div className="flex items-center space-x-2 space-x-reverse px-2 mb-10">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg transition-transform hover:scale-110">
            <Film size={22} fill="white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-800">
            سيني<span className="text-indigo-600">بوت</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1.5">
          <SidebarItem icon={LayoutDashboard} label="لوحة التحكم" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={MessageSquare} label="محاكي السينما" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          <SidebarItem icon={Zap} label="أتمتة الأفلام" active={activeTab === 'rules'} onClick={() => setActiveTab('rules')} />
          <SidebarItem icon={Settings} label="إعدادات البوت" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className={`p-4 rounded-2xl transition-all ${settings.status === 'online' ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50 border border-gray-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">حالة البث</span>
              <div className={`w-2.5 h-2.5 rounded-full ${settings.status === 'online' ? 'bg-indigo-500 animate-pulse' : settings.status === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-400'}`}></div>
            </div>
            <div className="mb-3">
                <div className="text-sm font-bold text-gray-800 truncate">{settings.name}</div>
                <div className="text-[10px] text-gray-500 flex items-center mt-0.5 font-mono">
                    <Phone size={10} className="ml-1 text-indigo-600" />
                    {settings.phoneNumber}
                </div>
            </div>
            <button 
              onClick={toggleConnection}
              className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 space-x-reverse ${
                settings.status === 'online' 
                ? 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-100' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
              }`}
            >
              {settings.status === 'online' ? <WifiOff size={14} /> : <Power size={14} />}
              <span>{settings.status === 'online' ? 'إيقاف التشغيل' : settings.status === 'connecting' ? 'جاري الاتصال...' : 'بدء العرض'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center space-x-3 space-x-reverse">
            <h2 className="text-lg font-bold text-gray-800">
              {activeTab === 'dashboard' && 'الإحصائيات السينمائية'}
              {activeTab === 'chat' && 'محاكي الدردشة السينمائية'}
              {activeTab === 'rules' && 'أتمتة التوصيات'}
              {activeTab === 'settings' && 'إعدادات الخبير'}
            </h2>
            {settings.status === 'online' && (
              <span className="flex items-center bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                <Activity size={10} className="ml-1" />
                نشط على {settings.phoneNumber}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
             <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <Star size={14} className="text-amber-400 ml-2" />
                <span className="text-xs font-medium text-gray-600">4.9/5 متوسط التقييم</span>
             </div>
             <div className="relative">
               <Bell size={18} className="text-gray-500 cursor-pointer" />
               <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-[#f8fafb]">
          {activeTab === 'dashboard' && (
            <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'توصيات مقدمة', value: '3,842', change: '+12%', icon: Film },
                  { label: 'أوامر مستلمة', value: commandLogs.length.toString(), change: 'Live', icon: Terminal },
                  { label: 'مستخدمين نشطين', value: '1,204', change: '+8%', icon: Users },
                  { label: 'أفلام تم تقييمها', value: '542', change: '+24', icon: Star },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                       <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                       <stat.icon size={18} className="text-indigo-400" />
                    </div>
                    <div className="text-sm text-gray-400 font-medium mb-1">{stat.label}</div>
                    <div className="text-xs font-bold text-indigo-500">{stat.change}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                      <Clapperboard className="text-indigo-500 ml-2" size={18} />
                      نظام التوصيات الذكي (Gemini 2.5)
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                      البوت مرتبط برقم الواتساب <span className="font-mono text-indigo-600 font-bold">{settings.phoneNumber}</span> ويقوم بمعالجة طلبات الأفلام والمسلسلات في ثوانٍ معدودة.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                        <span className="text-sm font-medium">مستقبل الأوامر المباشر</span>
                        <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold">مفعل</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium">الربط مع قواعد بيانات الأفلام</span>
                        <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold">نشط</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 flex flex-col overflow-hidden h-[400px]">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                    <div className="flex items-center space-x-2 space-x-reverse text-indigo-400">
                      <Terminal size={16} />
                      <span className="text-xs font-bold uppercase tracking-widest">تتبع الأوامر المباشرة</span>
                    </div>
                  </div>
                  <div className="flex-1 p-4 font-mono text-[10px] overflow-y-auto space-y-2">
                    {commandLogs.length === 0 ? (
                      <div className="text-slate-600 italic">بانتظار استقبال أوامر على {settings.phoneNumber}...</div>
                    ) : (
                      commandLogs.map(log => (
                        <div key={log.id} className="animate-in fade-in slide-in-from-right-1">
                          <span className="text-slate-500">[{log.timestamp.toLocaleTimeString()}]</span>{' '}
                          <span className={log.status === 'success' ? 'text-indigo-400' : 'text-rose-400'}>
                            {log.status === 'success' ? '>' : '!'} {log.command}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="h-full flex overflow-hidden">
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col z-10">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="البحث في المحادثات..." 
                      className="w-full pr-10 pl-4 py-2 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 text-sm transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {chats.map(chat => (
                    <div 
                      key={chat.id}
                      onClick={() => setActiveChatId(chat.id)}
                      className={`p-4 flex items-center space-x-3 space-x-reverse cursor-pointer transition-all border-b border-gray-50 ${
                        activeChatId === chat.id ? 'bg-indigo-50 border-r-4 border-indigo-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="h-12 w-12 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center font-bold text-indigo-600 border-2 border-white shadow-sm">
                        {chat.contactName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-bold text-sm text-gray-800 truncate">{chat.contactName}</span>
                          <span className="text-[10px] text-gray-400">{chat.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">{chat.lastMessage}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-[#efeae2] relative">
                {activeChat ? (
                  <>
                    <header className="h-16 bg-[#f0f2f5] px-6 flex items-center justify-between border-b border-gray-200 shadow-sm z-10">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center font-bold text-white shadow-sm">
                          {activeChat.contactName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-800">{activeChat.contactName}</div>
                          <div className="text-[10px] text-indigo-600 font-bold">نشط الآن</div>
                        </div>
                      </div>
                    </header>

                    <div 
                      className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col"
                      style={{backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'contain'}}
                    >
                      {activeChat.messages.map(msg => (
                        <div 
                          key={msg.id} 
                          className={`max-w-[80%] px-3 py-2 rounded-xl text-sm shadow-sm relative animate-in slide-in-from-bottom-2 duration-300 ${
                            msg.sender === 'bot' 
                              ? 'bg-white self-start rounded-tr-none border-l-4 border-indigo-500' 
                              : msg.sender === 'system'
                              ? 'bg-slate-900 text-indigo-400 self-center rounded-lg text-center font-mono border border-slate-700 text-[11px] py-1 px-4'
                              : 'bg-[#dcf8c6] self-end rounded-tl-none'
                          }`}
                        >
                          <div className="leading-relaxed whitespace-pre-line text-gray-800">{msg.text}</div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="bg-white self-start px-4 py-2 rounded-xl rounded-tr-none shadow-sm animate-pulse border-l-4 border-indigo-500">
                          <div className="flex space-x-1 space-x-reverse">
                            <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="bg-[#f0f2f5] p-3 border-t border-gray-200">
                      <form onSubmit={handleSendMessage} className="flex items-center space-x-3 space-x-reverse">
                        <input 
                          disabled={settings.status !== 'online'}
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder={settings.status === 'online' ? "اطلب توصية أو استخدم /أمر..." : "البوت مغلق"} 
                          className="flex-1 bg-white px-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm outline-none transition-all disabled:bg-gray-100"
                        />
                        <button 
                          disabled={!inputText.trim() || settings.status !== 'online'}
                          type="submit"
                          className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Send size={20} className="transform rotate-180" />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <Film size={64} className="mb-4 opacity-20" />
                    <p>اختر محادثة للبدء</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
                  <h3 className="font-bold text-gray-800">إضافة رد تلقائي سينمائي</h3>
                  <Zap className="text-amber-500" size={20} />
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    value={newRule.trigger}
                    onChange={(e) => setNewRule({...newRule, trigger: e.target.value})}
                    placeholder="الكلمة المفتاحية (Trigger)"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    type="text" 
                    value={newRule.response}
                    onChange={(e) => setNewRule({...newRule, response: e.target.value})}
                    placeholder="الرد التلقائي (Response)"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button 
                    onClick={addRule}
                    className="md:col-span-2 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700"
                  >
                    حفظ القاعدة
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {rules.map(rule => (
                  <div key={rule.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg mr-2">{rule.trigger}</span>
                      <p className="text-sm text-gray-600 mt-2">{rule.response}</p>
                    </div>
                    <button onClick={() => deleteRule(rule.id)} className="text-gray-300 hover:text-red-500 p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-8 max-w-3xl mx-auto animate-in fade-in duration-500">
               <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">اسم البوت</label>
                    <input 
                      type="text" 
                      value={settings.name}
                      onChange={(e) => setSettings({...settings, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الرقم المرتبط بالأوامر</label>
                    <input 
                      type="text" 
                      value={settings.phoneNumber}
                      onChange={(e) => setSettings({...settings, phoneNumber: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الخلفية المعرفية</label>
                    <textarea 
                      rows={5}
                      value={settings.persona}
                      onChange={(e) => setSettings({...settings, persona: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                    />
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
