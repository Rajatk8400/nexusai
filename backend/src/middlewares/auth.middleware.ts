import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import { AuthUserPayload } from "../types/express";

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return next(new AppError("No token provided", 401));

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env["JWT_SECRET"]!) as unknown as AuthUserPayload;
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      roleLevel: payload.roleLevel,
      businessId: payload.businessId ?? null,
      branchId: payload.branchId ?? null,
    };
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401));
  }
}

export function requireRole(minLevel: number) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.roleLevel < minLevel) {
      return next(new AppError("Insufficient permissions", 403));
    }
    next();
  };
}

export function requireBusiness(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user?.businessId) return next(new AppError("No business associated with account", 403));
  next();
}
