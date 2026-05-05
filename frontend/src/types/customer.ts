export type CustomerPlan = "Starter" | "Growth" | "Enterprise";
export type CustomerStatus = "Active" | "At Risk" | "Trial" | "Churned";

export interface Customer {
  id: string;
  company: string;
  contact: string;
  email: string;
  plan: CustomerPlan;
  mrr: number;
  status: CustomerStatus;
  health: number; // 0-100
  joinedAt: string;
}
