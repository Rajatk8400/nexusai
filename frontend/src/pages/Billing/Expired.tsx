import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { authApi } from "../../services/api";

const PLANS = [
  {
    id: "SIX_MONTHS",
    name: "Business Plus",
    duration: "6 Months",
    price: 1999,
    savings: null,
    features: ["All Inventory Features", "Full Sales Reporting", "WhatsApp Bill Sharing", "Basic AI Insights"],
  },
  {
    id: "YEARLY",
    name: "Enterprise Pro",
    duration: "12 Months",
    price: 3499,
    savings: "Save 12%",
    features: ["Everything in Business Plus", "Advanced AI Forecasting", "Priority Support", "Unlimited Users", "Multiple Branches"],
    recommended: true,
  }
];

export default function BillingExpiredPage() {
  const { logout } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "PAYPAL" | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSelectPlan = (plan: typeof PLANS[0]) => {
    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedPlan) return;
    setProcessing(true);
    try {
      // Call the backend upgrade endpoint
      const response = await fetch(`${(import.meta as any).env["VITE_API_URL"] ?? "http://localhost:4000/api/v1"}/business/upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("nexusai_access_token")}`
        },
        body: JSON.stringify({ planId: selectedPlan.id })
      });

      if (!response.ok) throw new Error("Upgrade failed");

      alert("Payment successful! Your account has been upgraded.");
      window.location.href = "/dashboard";
    } catch (e) {
      alert("Failed to process upgrade. Please contact support.");
    } finally {
      setProcessing(false);
    }
  };

  const upiLink = selectedPlan 
    ? `upi://pay?pa=nexusai@slc&pn=NexusAI&am=${selectedPlan.price}&cu=INR&tn=Plan Upgrade ${selectedPlan.id}`
    : "";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Your Free Trial has Expired</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            We hope you enjoyed NexusAI! Your 30-day trial has ended. 
            Choose a plan below to unlock all features and continue growing your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PLANS.map((plan) => (
            <Card 
              key={plan.id} 
              className={`p-8 relative transition-all hover:shadow-xl ${plan.recommended ? "border-2 border-blue-500 shadow-lg" : "border border-slate-200"}`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                  <p className="text-slate-400 text-sm">{plan.duration} Access</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-800">₹{plan.price.toLocaleString("en-IN")}</span>
                  <span className="text-slate-400 text-sm">/ period</span>
                </div>

                {plan.savings && (
                  <div className="inline-block bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                    {plan.savings}
                  </div>
                )}

                <ul className="space-y-3 pt-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.recommended ? "primary" : "secondary"} 
                  className="w-full py-3"
                  onClick={() => handleSelectPlan(plan)}
                >
                  Get Started
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <button 
            onClick={logout}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Secure Checkout"
        size="md"
      >
        {selectedPlan && (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plan Selected</p>
                <p className="font-bold text-slate-800">{selectedPlan.name} ({selectedPlan.duration})</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-xl font-black text-blue-600">₹{selectedPlan.price.toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-800">Select Payment Method</p>
              
              <div className="grid grid-cols-1 gap-3">
                {/* UPI Option */}
                <button
                  onClick={() => setPaymentMethod("UPI")}
                  className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all ${paymentMethod === "UPI" ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:border-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm font-black text-blue-600">UPI</div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800">UPI / QR Code</p>
                      <p className="text-xs text-slate-500">GPay, PhonePe, Paytm</p>
                    </div>
                  </div>
                  {paymentMethod === "UPI" && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">✓</div>}
                </button>

                {/* PayPal Option */}
                <button
                  onClick={() => setPaymentMethod("PAYPAL")}
                  className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all ${paymentMethod === "PAYPAL" ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:border-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#003087"><path d="M20.067 6.178c-.963-3.235-4.477-4.178-8.23-4.178H5.162c-.443 0-.825.32-.9.756l-2.227 13.064c-.05.29.174.55.468.55h3.693l-.316 1.856c-.051.29.173.55.467.55h3.136c.394 0 .733-.284.8-.673l.012-.07 1.125-6.6.027-.184c.067-.39.406-.673.8-.673h1.164c3.563 0 6.353-1.447 7.158-5.068.324-1.46.195-2.775-.468-3.33z"/></svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800">PayPal</p>
                      <p className="text-xs text-slate-500">Cards and Global Payments</p>
                    </div>
                  </div>
                  {paymentMethod === "PAYPAL" && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">✓</div>}
                </button>
              </div>
            </div>

            {paymentMethod === "UPI" && (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-4">
                <p className="text-xs text-slate-500">Scan this QR or click to pay with any UPI app</p>
                <div className="bg-white p-2 inline-block rounded-lg shadow-sm">
                   <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`} 
                    alt="UPI QR Code" 
                    className="w-32 h-32"
                   />
                </div>
                <div className="pt-2">
                   <a href={upiLink} className="text-blue-600 text-sm font-bold hover:underline">Open in UPI App</a>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100">
              <Button 
                variant="primary" 
                fullWidth 
                disabled={!paymentMethod || processing}
                onClick={handlePaymentSuccess}
              >
                {processing ? "Processing..." : paymentMethod ? `Pay ₹${selectedPlan.price.toLocaleString("en-IN")}` : "Select a method"}
              </Button>
              <p className="text-[10px] text-center text-slate-400 mt-4 px-8">
                By clicking pay, you agree to our Terms of Service. Secure 256-bit SSL encrypted payments.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
