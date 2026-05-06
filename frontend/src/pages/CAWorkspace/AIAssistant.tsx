import { useState, useRef, useEffect } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { SparkleIcon } from "../../components/ui/Icons";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello! I'm your NexusAI Accounting Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      let response = "I'm analyzing your financial data. One moment please...";
      if (input.toLowerCase().includes("gst")) response = "Your total GST payable for May is ₹1,20,000. You have ₹45,000 in claimable ITC.";
      if (input.toLowerCase().includes("expense")) response = "Your top expenses this month are: 1. Marketing (₹45k), 2. Rent (₹30k), 3. AWS (₹12k).";
      if (input.toLowerCase().includes("report")) response = "I've generated a draft GSTR-1 report for May. You can download it in the GST tab.";
      
      setMessages([...newMessages, { role: "assistant", text: response }]);
    }, 1000);
  };

  const suggestions = [
    "Show this month GST",
    "Find duplicate invoices",
    "Show top expenses",
    "Predict tax liability"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 group-hover:translate-x-full transition-transform duration-500" />
          <SparkleIcon size={24} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <Card className="w-[380px] h-[500px] flex flex-col shadow-2xl border-indigo-100 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
           {/* Header */}
           <div className="p-4 bg-indigo-600 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
                   <SparkleIcon size={18} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">NexusAI Assistant</h3>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                       <span className="text-[10px] font-bold opacity-80 uppercase">AI Online</span>
                    </div>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <XIcon size={18} />
              </button>
           </div>

           {/* Messages */}
           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-sm ${
                     m.role === 'user' 
                     ? 'bg-indigo-600 text-white rounded-br-none' 
                     : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                   }`}>
                     {m.text}
                   </div>
                </div>
              ))}
              
              {/* Smart Suggestions */}
              {messages.length === 1 && (
                <div className="space-y-2 pt-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Try asking:</p>
                   <div className="flex flex-wrap gap-2">
                      {suggestions.map((s) => (
                        <button 
                          key={s} 
                          onClick={() => { setInput(s); }}
                          className="px-3 py-1.5 bg-white border border-slate-100 text-indigo-600 rounded-full text-[10px] font-bold hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
                        >
                          {s}
                        </button>
                      ))}
                   </div>
                </div>
              )}
           </div>

           {/* Input Area */}
           <div className="p-4 bg-white border-t border-slate-100 space-y-3">
              <div className="relative">
                 <input 
                   type="text" 
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                   placeholder="Ask anything about accounting..."
                   className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all pr-20"
                 />
                 <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                       <MicrophoneIcon size={16} />
                    </button>
                    <button 
                      onClick={handleSend}
                      className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                       <SendIcon size={16} />
                    </button>
                 </div>
              </div>
              <p className="text-[10px] text-center text-slate-400 font-medium">
                AI can make mistakes. Verify important financial data.
              </p>
           </div>
        </Card>
      )}
    </div>
  );
}

function SendIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function XIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function MicrophoneIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
