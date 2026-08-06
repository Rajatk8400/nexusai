import { JwtPayload } from "jsonwebtoken";

export interface AuthUserPayload extends JwtPayload {
  id: string;
  email: string;
  role: string;
  roleLevel: number;
  businessId?: string | null;
  branchId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
      businessId?: string;
    }
  }
}
