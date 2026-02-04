
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Plus, 
  Send, 
  WifiOff,
  User,
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
  Bot
} from 'lucide-react';
import { BotSettings, ChatSession, Message, AutomationRule } from './types';
import { botBrain } from './services/geminiService';

const INITIAL_SETTINGS: BotSettings = {
  name: "المساعد الذكي (Smart Bot)",
  persona: "أنت خبير خدمة عملاء لمتجر إلكتروني سعودي. أسلوبك مهذب، سريع، وودود. تستخدم اللهجة السعودية البيضاء والرموز التعبيرية.",
  status: 'offline',
  autoReply: true,
  temperature: 0.7
};

const INITIAL_CHATS: ChatSession[] = [
  {
    id: '1',
    contactName: 'عبدالرحمن محمد',
    lastMessage: 'أهلاً، متوفر عندكم توصيل للرياض؟',
    timestamp: new Date(),
    unreadCount: 1,
    messages: [
      { id: 'm1', text: 'مرحباً، كيف يمكنني مساعدتك؟', sender: 'bot', timestamp: new Date(Date.now() - 100000) },
      { id: 'm2', text: 'أهلاً، متوفر عندكم توصيل للرياض؟', sender: 'user', timestamp: new Date() }
    ]
  },
  {
    id: '2',
    contactName: 'نورة السعيد',
    lastMessage: 'شكراً جزيلاً لك',
    timestamp: new Date(Date.now() - 3600000),
    unreadCount: 0,
    messages: [
      { id: 'n1', text: 'طلبي وصل، شكراً جزيلاً لك', sender: 'user', timestamp: new Date(Date.now() - 3600000) }
    ]
  }
];

const INITIAL_RULES: AutomationRule[] = [
  { id: 'r1', trigger: 'السلام', response: 'وعليكم السلام ورحمة الله وبركاته! كيف أقدر أخدمك اليوم؟ 🌸', isActive: true },
  { id: 'r2', trigger: 'سعر', response: 'أسعارنا تبدأ من 100 ريال وتختلف حسب المنتج. تقدر تشوف الكتالوج في الرابط...', isActive: true }
];

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-200 ${
      active ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
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
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, isTyping, activeChatId]);

  const toggleConnection = () => {
    if (settings.status === 'offline') {
      setSettings(prev => ({ ...prev, status: 'connecting' }));
      setTimeout(() => {
        setSettings(prev => ({ ...prev, status: 'online' }));
      }, 1500);
    } else {
      setSettings(prev => ({ ...prev, status: 'offline' }));
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeChatId || settings.status !== 'online') return;

    const currentText = inputText.trim();
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
      } else {
        const activeChat = chats.find(c => c.id === activeChatId);
        const history = (activeChat?.messages || []).slice(-10).map(m => ({
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
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="flex h-screen bg-[#f0f2f5] font-sans selection:bg-emerald-200" dir="rtl">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-l border-gray-200 flex flex-col p-4 shadow-sm z-20">
        <div className="flex items-center space-x-2 space-x-reverse px-2 mb-10">
          <div className="bg-emerald-600 p-2 rounded-xl text-white rotate-12 transition-transform">
            <Bot size={22} fill="white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-800">
            واتساب<span className="text-emerald-600">بوت</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1.5">
          <SidebarItem icon={LayoutDashboard} label="لوحة التحكم" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={MessageSquare} label="محاكي الدردشة" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          <SidebarItem icon={Zap} label="قواعد الأتمتة" active={activeTab === 'rules'} onClick={() => setActiveTab('rules')} />
          <SidebarItem icon={Settings} label="الإعدادات" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className={`p-4 rounded-2xl transition-all ${settings.status === 'online' ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50 border border-gray-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">حالة البوت</span>
              <div className={`w-2.5 h-2.5 rounded-full ${settings.status === 'online' ? 'bg-emerald-500 animate-pulse' : settings.status === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-400'}`}></div>
            </div>
            <button 
              onClick={toggleConnection}
              className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 space-x-reverse ${
                settings.status === 'online' 
                ? 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-100' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {settings.status === 'online' ? <WifiOff size={14} /> : <Power size={14} />}
              <span>{settings.status === 'online' ? 'إيقاف التشغيل' : settings.status === 'connecting' ? 'جاري الاتصال...' : 'بدء الاتصال'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
          <h2 className="text-lg font-bold text-gray-800">
            {activeTab === 'dashboard' && 'لوحة التحكم العامة'}
            {activeTab === 'chat' && 'محاكي الواتساب'}
            {activeTab === 'rules' && 'إدارة الأتمتة'}
            {activeTab === 'settings' && 'الإعدادات المتقدمة'}
          </h2>
          <div className="flex items-center space-x-4 space-x-reverse">
             <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <Users size={14} className="text-gray-400 ml-2" />
                <span className="text-xs font-medium text-gray-600">1,204 مشترك</span>
             </div>
             <div className="relative">
               <Bell size={18} className="text-gray-500 cursor-pointer" />
               <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
             </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-auto bg-[#f8fafb]">
          {activeTab === 'dashboard' && (
            <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'إجمالي الرسائل', value: '12,482', change: '+14%', color: 'emerald' },
                  { label: 'العملاء النشطون', value: '842', change: '+5%', color: 'blue' },
                  { label: 'دقة الرد الآلي', value: '98.2%', change: '+0.4%', color: 'amber' },
                  { label: 'سرعة الاستجابة', value: '1.2s', change: '-0.3s', color: 'purple' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                    <div className="text-sm text-gray-400 font-medium mb-1">{stat.label}</div>
                    <div className="text-xs font-bold text-emerald-500">{stat.change} من الأسبوع الماضي</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                    <CheckCircle className="text-emerald-500 ml-2" size={18} />
                    حالة الأنظمة الحالية
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-medium">محرك الذكاء الاصطناعي (Gemini)</span>
                      <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold">نشط</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-medium">قواعد الأتمتة المخصصة</span>
                      <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold">{rules.length} قواعد</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-medium">الاتصال برقم الواتساب</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${settings.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {settings.status === 'online' ? 'متصل' : 'غير متصل'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                    <ShieldCheck className="text-blue-500 ml-2" size={18} />
                    إحصائيات الأمان والخصوصية
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">
                    جميع محادثاتك مشفرة ومؤمنة بالكامل. يتم معالجة البيانات عبر بروتوكولات آمنة لضمان عدم تسريب بيانات العملاء.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border border-gray-100 rounded-xl text-center">
                      <div className="text-xl font-bold text-gray-800">100%</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">تشفير تام</div>
                    </div>
                    <div className="p-3 border border-gray-100 rounded-xl text-center">
                      <div className="text-xl font-bold text-gray-800">24/7</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">مراقبة النظام</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="h-full flex overflow-hidden">
              {/* CHAT LIST */}
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col z-10">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="البحث في المحادثات..." 
                      className="w-full pr-10 pl-4 py-2 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {chats.map(chat => (
                    <div 
                      key={chat.id}
                      onClick={() => setActiveChatId(chat.id)}
                      className={`p-4 flex items-center space-x-3 space-x-reverse cursor-pointer transition-all border-b border-gray-50 ${
                        activeChatId === chat.id ? 'bg-emerald-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center font-bold text-emerald-600 border-2 border-white shadow-sm">
                        {chat.contactName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-bold text-sm text-gray-800 truncate">{chat.contactName}</span>
                          <span className="text-[10px] text-gray-400">{chat.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="text-xs text-gray-500 truncate flex items-center">
                           {chat.unreadCount > 0 && <span className="w-2 h-2 bg-emerald-500 rounded-full ml-1 flex-shrink-0"></span>}
                           {chat.lastMessage}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SIMULATOR WINDOW */}
              <div className="flex-1 flex flex-col bg-[#efeae2] relative">
                {activeChat ? (
                  <>
                    <header className="h-16 bg-[#f0f2f5] px-6 flex items-center justify-between border-b border-gray-200 shadow-sm z-10">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center font-bold text-white shadow-sm">
                          {activeChat.contactName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-800">{activeChat.contactName}</div>
                          <div className="text-[10px] text-emerald-600 font-bold">متصل الآن</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 space-x-reverse text-gray-500">
                        <Search size={18} className="cursor-pointer hover:text-emerald-600" />
                        <MoreVertical size={18} className="cursor-pointer hover:text-emerald-600" />
                      </div>
                    </header>

                    <div 
                      className="flex-1 overflow-y-auto p-6 space-y-3 flex flex-col"
                      style={{backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'contain'}}
                    >
                      {activeChat.messages.map(msg => (
                        <div 
                          key={msg.id} 
                          className={`max-w-[75%] px-3 py-1.5 rounded-xl text-sm shadow-sm relative animate-in slide-in-from-bottom-2 duration-300 ${
                            msg.sender === 'bot' 
                              ? 'bg-white self-start rounded-tr-none' 
                              : 'bg-[#dcf8c6] self-end rounded-tl-none'
                          }`}
                        >
                          <div className="pr-1 pl-6 leading-relaxed text-gray-800">{msg.text}</div>
                          <div className="text-[9px] text-gray-400 text-left mt-1">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="bg-white self-start px-4 py-2 rounded-xl rounded-tr-none shadow-sm animate-pulse">
                          <div className="flex space-x-1 space-x-reverse">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="bg-[#f0f2f5] p-3 flex items-center space-x-3 space-x-reverse border-t border-gray-200">
                      <form onSubmit={handleSendMessage} className="flex-1 flex items-center space-x-3 space-x-reverse">
                        <button type="button" className="text-gray-500 hover:text-emerald-600 p-1">
                          <Plus size={22} />
                        </button>
                        <input 
                          disabled={settings.status !== 'online'}
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder={settings.status === 'online' ? "اكتب رسالة..." : "البوت غير متصل"} 
                          className="flex-1 bg-white px-4 py-2.5 rounded-xl border-none focus:ring-1 focus:ring-emerald-500 text-sm shadow-sm outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <button 
                          disabled={!inputText.trim() || settings.status !== 'online'}
                          type="submit"
                          className={`p-2.5 rounded-full transition-all shadow-md active:scale-95 ${
                            inputText.trim() && settings.status === 'online' 
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                            : 'text-gray-400 bg-white'
                          }`}
                        >
                          <Send size={20} className="transform rotate-180" />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-white">
                    <div className="bg-emerald-50 p-8 rounded-full mb-4">
                      <MessageCircle size={64} className="text-emerald-200" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">ابدأ المحاكاة</h3>
                    <p className="text-sm">اختر جهة اتصال من القائمة اليمنى لاختبار ردود البوت</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/30">
                  <h3 className="font-bold text-gray-800">إضافة قاعدة رد تلقائي جديدة</h3>
                  <Zap className="text-amber-500" size={20} />
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">الكلمة المفتاحية (Trigger)</label>
                    <input 
                      type="text" 
                      value={newRule.trigger}
                      onChange={(e) => setNewRule({...newRule, trigger: e.target.value})}
                      placeholder="مثال: سعر، توصيل، السلام"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">نص الرد (Response)</label>
                    <input 
                      type="text" 
                      value={newRule.response}
                      onChange={(e) => setNewRule({...newRule, response: e.target.value})}
                      placeholder="اكتب الرد الذي سيصل للعميل"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button 
                      onClick={addRule}
                      className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2 space-x-reverse"
                    >
                      <Plus size={18} />
                      <span>إضافة القاعدة</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 px-2">القواعد الحالية ({rules.length})</h3>
                {rules.map(rule => (
                  <div key={rule.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-emerald-200 transition-all group">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-1">
                        <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{rule.trigger}</span>
                        <div className="h-px w-8 bg-gray-200"></div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{rule.response}</p>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                       <button 
                        onClick={() => deleteRule(rule.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div 
                        onClick={() => setRules(rules.map(r => r.id === rule.id ? {...r, isActive: !r.isActive} : r))}
                        className={`w-11 h-6 rounded-full relative cursor-pointer transition-all ${rule.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${rule.isActive ? 'left-1' : 'right-1'}`}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                      <Settings size={20} />
                    </div>
                    <h3 className="font-bold text-gray-800">إعدادات شخصية البوت</h3>
                  </div>
                  <button className="text-emerald-600 text-sm font-bold px-4 py-1.5 rounded-lg hover:bg-emerald-50 transition-all">حفظ التغييرات</button>
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">اسم البوت (يظهر للعملاء)</label>
                    <input 
                      type="text" 
                      value={settings.name}
                      onChange={(e) => setSettings({...settings, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-gray-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">تعليمات الذكاء الاصطناعي (System Prompt)</label>
                    <textarea 
                      rows={5}
                      value={settings.persona}
                      onChange={(e) => setSettings({...settings, persona: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none bg-gray-50/30 leading-relaxed text-sm"
                    />
                    <p className="mt-3 text-[11px] text-gray-400 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                      هذا النص يحدد "شخصية" البوت وكيفية تعامله مع العملاء. يمكنك تحديد نبرة الصوت، اللهجة، والمهام الموكلة إليه بدقة.
                    </p>
                  </div>

                  <div className="pt-4 grid grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-800">الرد التلقائي</span>
                        <div 
                          onClick={() => setSettings({...settings, autoReply: !settings.autoReply})}
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${settings.autoReply ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings.autoReply ? 'left-0.5' : 'right-0.5'}`}></div>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500">تمكين البوت من الرد على الرسائل تلقائياً باستخدام القواعد والذكاء الاصطناعي.</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-800">درجة الإبداع (Temp)</span>
                        <span className="text-xs font-bold text-emerald-600">{settings.temperature}</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.1" 
                        value={settings.temperature}
                        onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">القيم الأعلى تجعل البوت أكثر إبداعاً وعشوائية، والأقل تجعله أكثر دقة وتركيزاً.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center justify-between group hover:bg-red-100/50 transition-all">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="p-3 bg-white text-red-500 rounded-2xl shadow-sm border border-red-50">
                    <Trash size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-800">حذف جميع البيانات</h4>
                    <p className="text-xs text-red-600/70">سيتم مسح جميع المحادثات، القواعد، والإعدادات نهائياً.</p>
                  </div>
                </div>
                <button className="bg-white text-red-600 px-6 py-2.5 rounded-xl font-bold border border-red-200 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                  مسح شامل
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
