import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/sales": "Sales",
  "/inventory": "Inventory",
  "/analytics": "Analytics",
  "/customers": "Customers",
  "/ai-insights": "AI Insights",
  "/campaigns": "Campaigns",
  "/reports": "Reports",
  "/billing": "Billing",
  "/settings": "Settings",
};

function PlanReminder() {
  const { business } = useAuth();
  const navigate = useNavigate();

  if (!business?.planExpiresAt) return null;

  const expiryDate = new Date(business.planExpiresAt);
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Don't show if more than 7 days left
  if (diffDays > 7) return null;
  // Don't show if already expired (the middleware will handle redirection anyway)
  if (diffDays < 0) return null;

  const isTrial = business.plan === "TRIAL";
  const isExpiredToday = diffDays === 0;

  return (
    <div className={`px-6 py-2.5 flex items-center justify-between text-white shadow-lg relative z-20 ${isExpiredToday ? "bg-gradient-to-r from-red-600 to-red-500" : "bg-gradient-to-r from-amber-600 to-amber-500"}`}>
      <div className="flex items-center gap-3 text-sm font-black tracking-tight uppercase">
        <span className="text-xl">⚠️</span>
        <span>
          {isExpiredToday 
            ? `Critical: Your ${isTrial ? "Free Trial" : "Business Plan"} expires today!` 
            : `Reminder: Your ${isTrial ? "Free Trial" : "Business Plan"} expires in ${diffDays} days.`}
        </span>
      </div>
      <Button 
        variant="secondary" 
        size="sm" 
        className="bg-white text-slate-900 border-0 py-1.5 h-auto px-6 font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-50 active:scale-95 transition-all"
        onClick={() => navigate("/billing/expired")}
      >
        {isTrial ? "SUBSCRIBE NOW" : "RENEW PLAN"}
      </Button>
    </div>
  );
}

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar title={title} />
        <PlanReminder />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
