import type {
  RevenueDataPoint,
  ChannelDataPoint,
  ConversionDataPoint,
  KPI,
} from "../types/analytics";

export const revenueData: RevenueDataPoint[] = [
  { month: "Aug", revenue: 42000, target: 45000, expenses: 28000 },
  { month: "Sep", revenue: 51000, target: 48000, expenses: 31000 },
  { month: "Oct", revenue: 47000, target: 50000, expenses: 29000 },
  { month: "Nov", revenue: 63000, target: 55000, expenses: 34000 },
  { month: "Dec", revenue: 71000, target: 60000, expenses: 38000 },
  { month: "Jan", revenue: 68000, target: 65000, expenses: 36000 },
  { month: "Feb", revenue: 84000, target: 70000, expenses: 42000 },
];

export const channelData: ChannelDataPoint[] = [
  { name: "Organic", value: 38, color: "#3b82f6" },
  { name: "Referral", value: 27, color: "#10b981" },
  { name: "Paid Ads", value: 21, color: "#8b5cf6" },
  { name: "Direct", value: 14, color: "#f59e0b" },
];

export const conversionData: ConversionDataPoint[] = [
  { week: "W1", rate: 3.2 },
  { week: "W2", rate: 4.1 },
  { week: "W3", rate: 3.8 },
  { week: "W4", rate: 5.2 },
  { week: "W5", rate: 4.9 },
  { week: "W6", rate: 6.1 },
  { week: "W7", rate: 5.8 },
  { week: "W8", rate: 7.3 },
];

export const kpiData: KPI[] = [
  {
    label: "Monthly Recurring Revenue",
    value: "₹8.4L",
    delta: "18.3%",
    deltaDir: "up",
    sub: "vs last month ₹7.1L",
    color: "blue",
  },
  {
    label: "Active Customers",
    value: "2,847",
    delta: "6.1%",
    deltaDir: "up",
    sub: "124 new this month",
    color: "emerald",
  },
  {
    label: "Avg. Conversion Rate",
    value: "5.8%",
    delta: "0.4%",
    deltaDir: "down",
    sub: "Industry avg: 4.2%",
    color: "amber",
  },
  {
    label: "AI Predictions Served",
    value: "1.2M",
    delta: "31%",
    deltaDir: "up",
    sub: "Avg latency 42ms",
    color: "violet",
  },
];

export const alertsData = [
  { id: 1, type: "warning" as const, message: "3 accounts approaching usage limit", time: "2 min ago" },
  { id: 2, type: "success" as const, message: "AI model retrained — accuracy +2.3%", time: "1 hr ago" },
  { id: 3, type: "info" as const, message: "Scheduled maintenance: Sunday 2–4 AM IST", time: "3 hr ago" },
];
