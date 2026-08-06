import { z } from "zod";

export const authValidation = {
  register: z.object({
    body: z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      phone: z.string().optional(),
      businessName: z.string().min(1, "Business name is required"),
      currency: z.string().optional(),
    }),
  }),
  login: z.object({
    body: z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(1, "Password is required"),
    }),
  }),
  refresh: z.object({
    body: z.object({
      refreshToken: z.string().min(1, "Refresh token is required"),
    }),
  }),
  forgotPassword: z.object({
    body: z.object({
      email: z.string().email("Invalid email address"),
    }),
  }),
  resetPassword: z.object({
    body: z.object({
      email: z.string().email("Invalid email address"),
      newPassword: z.string().min(6, "New password must be at least 6 characters"),
    }),
  }),
};
