import { NavLink, useNavigate } from "react-router-dom";
import {
  GridIcon, ChartIcon, UsersIcon, SparkleIcon,
  FileIcon, GearIcon, ChevronLeftIcon,
  DownloadIcon, PlusIcon,
} from "../ui/Icons";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

// Box icon for Products
function BoxIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

const navItems = [
  { id: "dashboard",  label: "Dashboard",  path: "/dashboard",  Icon: GridIcon },
  { id: "products",   label: "Products",   path: "/products",   Icon: BoxIcon },
  { id: "purchases",  label: "Stock In",    path: "/purchases",  Icon: PackageIcon },
  { id: "sales",      label: "Sales",      path: "/sales",      Icon: PlusIcon },
  { id: "inventory",  label: "Inventory",  path: "/inventory",  Icon: DownloadIcon },
  { id: "analytics",  label: "Analytics",  path: "/analytics",  Icon: ChartIcon },
  { id: "customers",  label: "Customers",  path: "/customers",  Icon: UsersIcon },
  { id: "expenses",   label: "Expenses",   path: "/expenses",   Icon: ReceiptIcon },
  { id: "ai-insights",label: "AI Insights",path: "/ai-insights",Icon: SparkleIcon, badge: "New" },
  { id: "reports",    label: "Reports",    path: "/reports",    Icon: FileIcon },
  { id: "settings",   label: "Settings",   path: "/settings",   Icon: GearIcon },
];

function ReceiptIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/>
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
      <path d="M12 17.5V6.5"/>
    </svg>
  );
}

function PackageIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m7.5 4.27 9 5.15"/>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <path d="m3.27 6.96 8.73 5.05 8.73-5.05"/>
      <path d="M12 22.08V12"/>
    </svg>
  );
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onToggle, onClose }: SidebarProps) {
  const navigate = useNavigate();
  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:flex flex-col h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 flex-shrink-0 ${
          collapsed ? "lg:w-16" : "lg:w-60"
        } ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/40">
            <SparkleIcon size={16} className="text-white" />
          </div>
          <div className={`${collapsed ? "lg:hidden" : "block"}`}>
            <p className="font-black text-white text-sm tracking-tight">NexusAI</p>
            <p className="text-slate-500 text-xs">for MSMEs</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-0.5">
          {navItems.map(({ id, label, path, Icon, badge }) => (
            <NavLink
              key={id}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className={`flex-1 text-left ${collapsed ? "lg:hidden" : "block"}`}>{label}</span>
              {badge && !collapsed && <Badge variant="new">{badge}</Badge>}
            </NavLink>
          ))}
        </nav>

        {/* Upgrade CTA */}
        <div className={`mx-3 mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-emerald-600/20 border border-blue-500/20 ${collapsed ? "lg:hidden" : "block"}`}>
          <p className="text-xs font-bold text-white mb-1">Upgrade to Enterprise</p>
          <p className="text-xs text-slate-400 mb-3">Unlock advanced AI & priority support</p>
          <Button variant="primary" size="sm" fullWidth onClick={() => { navigate("/billing/expired"); onClose(); }}>Upgrade Now</Button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center py-3 border-t border-slate-800 text-slate-500 hover:text-white transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeftIcon
            size={16}
            className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </aside>
    </>
  );
}