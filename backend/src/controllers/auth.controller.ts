import { Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { sendSuccess, sendCreated } from "../utils/response";
import { AuthRequest } from "../middlewares/auth.middleware";

export const authController = {
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      sendCreated(res, result, "Account created successfully");
    } catch (e) { next(e); }
  },

  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      sendSuccess(res, result, "Login successful");
    } catch (e) { next(e); }
  },

  async forgotPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      sendSuccess(res, result, "Account verified");
    } catch (e) { next(e); }
  },

  async resetPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, newPassword } = req.body;
      const result = await authService.resetPassword(email, newPassword);
      sendSuccess(res, result, "Password updated successfully");
    } catch (e) { next(e); }
  },

  async refresh(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshTokens(refreshToken);
      sendSuccess(res, tokens, "Tokens refreshed");
    } catch (e) { next(e); }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(req.user!.id);
      sendSuccess(res, null, "Logged out");
    } catch (e) { next(e); }
  },

  async profile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getProfile(req.user!.id);
      sendSuccess(res, user);
    } catch (e) { next(e); }
  },
};
