import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellIcon, SearchIcon, ChevronDownIcon, LogoutIcon, MenuIcon } from "../ui/Icons";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input, { Select } from "../ui/Input";
import { alertsData } from "../../mock/analytics";
import { useAuth } from "../../context/AuthContext";
import { Alert } from "../ui";

interface NavbarProps {
  title: string;
  onMenuClick?: () => void;
}

export default function Navbar({ title, onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("analyst");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user
    ? (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase()
    : "??";
  const fullName = user ? `${user.firstName} ${user.lastName}` : "User";

  const closeAll = () => {
    setNotifOpen(false);
    setProfileOpen(false);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 gap-4 flex-shrink-0 relative z-30">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>

        {/* Title */}
        <div className="flex-1">
          <h1 className="text-sm md:text-lg font-black text-slate-800 tracking-tight line-clamp-1">{title}</h1>
          <p className="text-xs text-slate-400">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-64 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
          <SearchIcon size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search anything..."
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
            aria-label="Notifications"
          >
            <BellIcon />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={closeAll} />
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-20">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="font-bold text-slate-800 text-sm">Notifications</p>
                  <Badge variant="info">{alertsData.length} new</Badge>
                </div>
                <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                  {alertsData.map((a) => (
                    <div key={a.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                            a.type === "warning"
                              ? "bg-amber-400"
                              : a.type === "success"
                              ? "bg-emerald-400"
                              : "bg-blue-400"
                          }`}
                        />
                        <div>
                          <p className="text-xs text-slate-700">{a.message}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-slate-100">
                  <Button variant="ghost" size="sm" fullWidth className="text-blue-600">
                    View all notifications
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-slate-100 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xs">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-slate-700">{fullName}</p>
              <p className="text-xs text-slate-400">{user?.role ?? "User"}</p>
            </div>
            <ChevronDownIcon size={14} />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={closeAll} />
              <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-20">
                <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-emerald-50 border-b border-slate-100">
                  <p className="font-bold text-slate-800 text-sm">{fullName}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <div className="mt-1.5">
                    <Badge variant="success">Active Account</Badge>
                  </div>
                </div>
                {[
                  { label: "My Profile", action: () => { navigate("/settings"); closeAll(); } },
                  { label: "API Keys", action: undefined },
                  { label: "Invite Team", action: () => { setInviteOpen(true); closeAll(); } },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-slate-100">
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2">
                    <LogoutIcon /> Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Invite Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite Team Member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setInviteOpen(false)}>
              Send Invite
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Email Address"
            placeholder="colleague@company.com"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <Select
            label="Role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            options={[
              { value: "admin", label: "Admin" },
              { value: "analyst", label: "Analyst" },
              { value: "viewer", label: "Viewer" },
            ]}
          />
          <Alert
            type="info"
            message="They'll receive an email to join your NexusAI workspace."
          />
        </div>
      </Modal>
    </>
  );
}
