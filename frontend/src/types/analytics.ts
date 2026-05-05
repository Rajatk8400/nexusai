export interface RevenueDataPoint {
  month: string;
  revenue: number;
  target: number;
  expenses: number;
}

export interface ChannelDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface ConversionDataPoint {
  week: string;
  rate: number;
}

export interface KPI {
  label: string;
  value: string;
  delta: string;
  deltaDir: "up" | "down";
  sub: string;
  color: "blue" | "emerald" | "amber" | "violet";
}
