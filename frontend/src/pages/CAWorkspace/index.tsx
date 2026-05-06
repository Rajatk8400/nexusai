import { useState } from "react";
import Card from "../../components/ui/Card";
import OverviewTab from "./OverviewTab";
import PurchasesTab from "./PurchasesTab";
import SalesTab from "./SalesTab";
import ExpensesTab from "./ExpensesTab";
import GSTTab from "./GSTTab";
import DocumentsTab from "./DocumentsTab";
import AIAssistant from "./AIAssistant";

type Tab = "overview" | "purchases" | "sales" | "expenses" | "gst" | "documents";

export default function CAWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "purchases", label: "Purchases", icon: "🛒" },
    { id: "sales", label: "Sales", icon: "💰" },
    { id: "expenses", label: "Expenses", icon: "📉" },
    { id: "gst", label: "GST", icon: "🏦" },
    { id: "documents", label: "Documents", icon: "📄" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab data={{}} />;
      case "purchases": return <PurchasesTab />;
      case "sales": return <SalesTab />;
      case "expenses": return <ExpensesTab />;
      case "gst": return <GSTTab />;
      case "documents": return <DocumentsTab />;
      default: return <OverviewTab data={{}} />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto min-h-screen pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            AI CA Workspace
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase rounded-full">Pro</span>
          </h1>
          <p className="text-slate-500 text-sm">Centralized AI accounting & compliance workspace</p>
        </div>
        <div className="flex bg-slate-100/50 backdrop-blur-md p-1 rounded-xl self-start md:self-center border border-slate-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === t.id ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden lg:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {renderTabContent()}
      </div>

      {/* Floating AI Assistant */}
      <AIAssistant />
    </div>
  );
}
