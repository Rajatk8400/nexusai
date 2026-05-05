export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "new";
export type ButtonVariant = "primary" | "secondary" | "emerald" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type AlertType = "info" | "success" | "warning" | "danger";
export type ColorKey = "blue" | "emerald" | "amber" | "violet" | "red";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  badge?: string;
}
