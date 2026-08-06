import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../services/api";

export default function SettingsPage() {
  const { business, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: business?.name || "",
    upiId: (business as any)?.upiId || "",
    gstNumber: (business as any)?.gstNumber || "",
  });

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name,
        upiId: (business as any).upiId || "",
        gstNumber: (business as any).gstNumber || "",
      });
    }
  }, [business]);

  const handleSaveBusiness = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${(import.meta as any).env["VITE_API_URL"] ?? "http://localhost:4000/api/v1"}/business`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("nexusai_access_token")}`
        },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error("Failed to save");
      alert("Settings updated successfully!");
    } catch (e) {
      alert("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }
    setPassLoading(true);
    setPassError(null);
    setPassSuccess(null);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPassSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPassError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setPassLoading(false);
    }
  };

  // Sync tab with URL if needed
  useEffect(() => {
    if (location.pathname.includes("/billing")) {
      setActiveTab("billing");
    } else if (location.pathname.includes("/campaigns")) {
      setActiveTab("campaigns");
    }
  }, [location]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your business profile and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Tabs Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          {[
            { id: "general", label: "General", icon: "🏢" },
            { id: "account", label: "Account", icon: "👤" },
            { id: "billing", label: "Billing & Subscription", icon: "💳" },
            { id: "campaigns", label: "Campaigns", icon: "📣" },
            { id: "notifications", label: "Notifications", icon: "🔔" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === "general" && (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Business Profile</h3>
                <Button variant="primary" size="sm" disabled={isSaving} onClick={handleSaveBusiness}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Name</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business UPI ID (for receiving payments)</label>
                    <input 
                      type="text"
                      placeholder="e.g. yourname@okaxis"
                      value={formData.upiId}
                      onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Number (Optional)</label>
                    <input 
                      type="text"
                      placeholder="22AAAAA0000A1Z5"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Slug</label>
                  <p className="text-slate-500 font-medium">nexusai.app/{business?.slug}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business ID</label>
                  <p className="text-slate-400 font-mono text-xs bg-slate-50 px-2 py-1 rounded inline-block">{business?.id}</p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "account" && (
            <div className="space-y-6">
              <Card className="p-6 space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                    <p className="text-slate-800 font-bold">{user?.firstName} {user?.lastName}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                    <p className="text-slate-800 font-bold">{user?.email}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</label>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <p className="text-slate-800 font-bold">{user?.role?.replace("_", " ")}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Change Password Card */}
              <Card className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Change Password</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Ensure your account is using a long, random password to stay secure.</p>
                  </div>
                </div>

                {passError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                    {passError}
                  </div>
                )}
                {passSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium">
                    {passSuccess}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Min 6 characters"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Confirm new password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button variant="primary" size="sm" type="submit" disabled={passLoading}>
                      {passLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {activeTab === "billing" && (
            <Card className="p-6 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Subscription Status</h3>
                  <p className="text-slate-500 text-sm">Manage your current plan and usage</p>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Trial Active
                </div>
              </div>

              <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl text-white shadow-xl shadow-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center md:text-left">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl">
                    ⚡
                  </div>
                  <div>
                    <p className="font-black text-xl">Free Trial Explorer</p>
                    <p className="text-blue-100 text-sm opacity-80">Full access until June 4, 2026</p>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  className="bg-white text-blue-600 border-0 hover:bg-blue-50 shadow-lg px-8 py-3 font-black"
                  onClick={() => navigate("/billing/expired")}
                >
                  UPGRADE NOW
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Products", value: "Unlimited", sub: "Cloud Storage" },
                  { label: "AI Forecasts", value: "30 / day", sub: "Smart Analysis" },
                  { label: "Users", value: "Up to 5", sub: "Team Access" },
                ].map((stat, i) => (
                  <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">{stat.value}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "campaigns" && (
            <div className="p-16 text-center space-y-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
               <div className="text-4xl">📢</div>
               <div>
                <h3 className="font-bold text-slate-800">Marketing Campaigns</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">SMS and WhatsApp marketing tools are currently in private beta. Contact support to request access.</p>
               </div>
               <Button variant="secondary" size="sm">Notify Me When Ready</Button>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="p-16 text-center text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
               <p className="text-sm font-medium">Notification preferences are managed by your system administrator.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}