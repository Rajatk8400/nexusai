import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";

export default function SuspendedPage() {
  const { business, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // Redirect if business becomes active
  useEffect(() => {
    if (business?.status === "ACTIVE") {
      navigate("/dashboard");
    }
  }, [business?.status, navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center space-y-6 border-t-4 border-red-500">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v10M12 16v2M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"/>
          </svg>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Services Blocked</h1>
          <p className="text-slate-500">
            Your access to NexusAI has been suspended. This could be due to pending verification, policy violations, or other administrative reasons.
          </p>
        </div>

        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
          <p className="text-sm font-bold text-red-700">Action Required</p>
          <p className="text-xs text-red-600 mt-1">Please contact NexusAI support or your account manager for assistance.</p>
        </div>

        <div className="pt-4 space-y-3">
          <Button 
            variant="primary" 
            fullWidth 
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {refreshing ? "Checking..." : "Check Status"}
          </Button>
          <Button 
            variant="secondary" 
            fullWidth 
            onClick={() => window.location.href = "mailto:support@nexusai.com"}
          >
            Contact Support
          </Button>
          <Button variant="secondary" fullWidth onClick={logout}>Back to Login</Button>
        </div>
        
        <p className="text-[10px] text-slate-400 font-medium">Developed by MakeEasy Group</p>
      </div>
    </div>
  );
}
