import { useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { SparkleIcon } from "../../components/ui/Icons";
import { customerApi } from "../../services/api";

interface QuickEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerId: string;
  customerName: string;
}

export default function QuickEntryModal({ open, onClose, onSuccess, customerId, customerName }: QuickEntryModalProps) {
  const [type, setType] = useState<"UDHAR" | "PAYMENT">("UDHAR");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVoiceInput = () => {
    setIsListening(true);
    // Real implementation would use Web Speech API or similar
    setTimeout(() => {
      setIsListening(false);
      alert("Voice recognition is a premium feature. Please type for now.");
    }, 1000);
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount))) return;
    
    try {
      setLoading(true);
      await customerApi.recordTransaction(customerId, {
        type,
        amount: Number(amount),
        notes,
        paymentMethod: "CASH" // Defaulting for quick entry
      });
      onSuccess();
      onClose();
      // Clear form
      setAmount("");
      setNotes("");
    } catch (e) {
      console.error(e);
      alert("Failed to record transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Quick Entry for ${customerName}`}
      size="sm"
    >
      <div className="space-y-6 py-2">
        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button 
             onClick={() => setType("UDHAR")}
             className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${
               type === "UDHAR" ? "bg-rose-500 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
             }`}
           >
             Udhar (Out)
           </button>
           <button 
             onClick={() => setType("PAYMENT")}
             className={`flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all ${
               type === "PAYMENT" ? "bg-emerald-500 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
             }`}
           >
             Payment (In)
           </button>
        </div>

        <div className="space-y-4">
           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-2xl font-black outline-none focus:ring-2 transition-all ${
                  type === "UDHAR" ? "text-rose-600 focus:ring-rose-500/20" : "text-emerald-600 focus:ring-emerald-500/20"
                }`}
              />
           </div>

           <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes / Items</label>
                <button 
                  onClick={handleVoiceInput}
                  className={`text-[10px] font-black uppercase flex items-center gap-1.5 transition-colors ${
                    isListening ? "text-indigo-600 animate-pulse" : "text-slate-400 hover:text-indigo-600"
                  }`}
                >
                   <span className="text-sm">🎙️</span> {isListening ? "Listening..." : "Voice Input"}
                </button>
              </div>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Milk, Bread, Eggs..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 transition-all h-24"
              />
           </div>
        </div>

        <div className="pt-2">
           <Button 
             variant="primary" 
             fullWidth 
             disabled={loading || !amount}
             className={type === "UDHAR" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"}
             onClick={handleSubmit}
           >
              {loading ? "Recording..." : type === "UDHAR" ? "Confirm Udhar" : "Confirm Payment"}
           </Button>
           
           {type === "UDHAR" && (
             <div className="mt-4 flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <SparkleIcon size={14} className="text-indigo-600" />
                <p className="text-[10px] font-bold text-indigo-700 leading-tight">
                   AI Insight: Udhar increases outstanding. Automated reminder will be scheduled.
                </p>
             </div>
           )}
        </div>
      </div>
    </Modal>
  );
}
