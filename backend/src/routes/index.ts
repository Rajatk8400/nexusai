import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  authController,
  productController,
  saleController,
  inventoryController,
  dashboardController,
  aiController,
  businessController,
  customerController,
  reportController,
  campaignController,
  expenseController,
  purchaseController,
  adminController,
  documentController,
} from "../controllers";
import { authenticate, requireBusiness, AuthRequest } from "../middlewares/auth.middleware";
import { checkSubscription } from "../middlewares/subscription.middleware";
import { validate } from "../middlewares/validate.middleware";
import { authValidation, productValidation, saleValidation } from "../validations";

const router = Router();

// Middleware group for core business features
const businessGuard = [authenticate, requireBusiness, checkSubscription];

// ── Multer Configuration ──────────────────────────────────────
const uploadDir = path.join(__dirname, "../../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => cb(null, uploadDir),
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ── Admin ──────────────────────────────────────────────────────
router.get("/admin/stats",      authenticate, (req: Request, res: Response, next: NextFunction) => adminController.getStats(req as AuthRequest, res, next));
router.get("/admin/businesses", authenticate, (req: Request, res: Response, next: NextFunction) => adminController.getBusinesses(req as AuthRequest, res, next));
router.post("/admin/approve",   authenticate, (req: Request, res: Response, next: NextFunction) => adminController.approveUpgrade(req as AuthRequest, res, next));
router.post("/admin/update-plan", authenticate, (req: Request, res: Response, next: NextFunction) => adminController.updatePlan(req as AuthRequest, res, next));

// ── Auth (public) ─────────────────────────────────────────────
router.post("/auth/register", validate(authValidation.register), (req: Request, res: Response, next: NextFunction) => authController.register(req as AuthRequest, res, next));
router.post("/auth/login",    validate(authValidation.login), (req: Request, res: Response, next: NextFunction) => authController.login(req as AuthRequest, res, next));
router.post("/auth/refresh",  validate(authValidation.refresh), (req: Request, res: Response, next: NextFunction) => authController.refresh(req as AuthRequest, res, next));

// ── Auth (protected) ──────────────────────────────────────────
router.post("/auth/logout",  authenticate, (req: Request, res: Response, next: NextFunction) => authController.logout(req as AuthRequest, res, next));
router.get("/auth/profile",  authenticate, (req: Request, res: Response, next: NextFunction) => authController.profile(req as AuthRequest, res, next));
router.post("/business/upgrade", authenticate, (req: Request, res: Response, next: NextFunction) => businessController.upgrade(req as AuthRequest, res, next));
router.put("/business", authenticate, (req: Request, res: Response, next: NextFunction) => businessController.update(req as AuthRequest, res, next));

// ── Dashboard ─────────────────────────────────────────────────
router.get("/dashboard",         ...businessGuard, (req: Request, res: Response, next: NextFunction) => dashboardController.overview(req as AuthRequest, res, next));
router.get("/dashboard/revenue", ...businessGuard, (req: Request, res: Response, next: NextFunction) => saleController.revenueChart(req as AuthRequest, res, next));
router.get("/dashboard/kpis",    ...businessGuard, (req: Request, res: Response, next: NextFunction) => saleController.dashboard(req as AuthRequest, res, next));

// ── Products ──────────────────────────────────────────────────
router.get("/products",            ...businessGuard, (req: Request, res: Response, next: NextFunction) => productController.list(req as AuthRequest, res, next));
router.post("/products",           ...businessGuard, validate(productValidation.create), (req: Request, res: Response, next: NextFunction) => productController.create(req as AuthRequest, res, next));
router.get("/products/stock-value",...businessGuard, (req: Request, res: Response, next: NextFunction) => productController.stockValue(req as AuthRequest, res, next));
router.get("/products/:id",        ...businessGuard, (req: Request, res: Response, next: NextFunction) => productController.getById(req as AuthRequest, res, next));
router.put("/products/:id",        ...businessGuard, validate(productValidation.update), (req: Request, res: Response, next: NextFunction) => productController.update(req as AuthRequest, res, next));
router.delete("/products/:id",     ...businessGuard, (req: Request, res: Response, next: NextFunction) => productController.delete(req as AuthRequest, res, next));

// ── Sales ─────────────────────────────────────────────────────
router.get("/sales",     ...businessGuard, (req: Request, res: Response, next: NextFunction) => saleController.list(req as AuthRequest, res, next));
router.post("/sales",    ...businessGuard, validate(saleValidation.create), (req: Request, res: Response, next: NextFunction) => saleController.create(req as AuthRequest, res, next));
router.get("/sales/:id", ...businessGuard, (req: Request, res: Response, next: NextFunction) => saleController.getById(req as AuthRequest, res, next));
router.put("/sales/:id/eway-bill", ...businessGuard, (req: Request, res: Response, next: NextFunction) => saleController.updateEwayBill(req as AuthRequest, res, next));

// ── Inventory ─────────────────────────────────────────────────
router.get("/inventory",           ...businessGuard, (req: Request, res: Response, next: NextFunction) => inventoryController.getStock(req as AuthRequest, res, next));
router.post("/inventory/adjust",   ...businessGuard, (req: Request, res: Response, next: NextFunction) => inventoryController.adjust(req as AuthRequest, res, next));
router.get("/inventory/low-stock", ...businessGuard, (req: Request, res: Response, next: NextFunction) => inventoryController.getLowStock(req as AuthRequest, res, next));
router.get("/inventory/movements", ...businessGuard, (req: Request, res: Response, next: NextFunction) => inventoryController.getMovements(req as AuthRequest, res, next));

// ── AI & Forecasts ──────────────────────────────────────────
router.get("/ai/forecast/demand/:productId", ...businessGuard, (req: Request, res: Response, next: NextFunction) => aiController.getDemandForecast(req as AuthRequest, res, next));
router.get("/ai/forecast/revenue",           ...businessGuard, (req: Request, res: Response, next: NextFunction) => aiController.getRevenueForecast(req as AuthRequest, res, next));
router.get("/ai/inventory-insights",         ...businessGuard, (req: Request, res: Response, next: NextFunction) => aiController.getInventoryInsights(req as AuthRequest, res, next));
router.get("/ai/staff-productivity",         ...businessGuard, (req: Request, res: Response, next: NextFunction) => aiController.getStaffProductivity(req as AuthRequest, res, next));
router.get("/ai/business-insights",          ...businessGuard, (req: Request, res: Response, next: NextFunction) => aiController.getBusinessInsights(req as AuthRequest, res, next));

// ── Customers & Khata ──────────────────────────────────────────
router.get("/customers",                   ...businessGuard, (req: Request, res: Response, next: NextFunction) => customerController.list(req as AuthRequest, res, next));
router.get("/customers/:id",               ...businessGuard, (req: Request, res: Response, next: NextFunction) => customerController.getById(req as AuthRequest, res, next));
router.get("/customers/:id/transactions",  ...businessGuard, (req: Request, res: Response, next: NextFunction) => customerController.getTransactions(req as AuthRequest, res, next));
router.get("/customers/:id/trust-score",   ...businessGuard, (req: Request, res: Response, next: NextFunction) => customerController.getTrustScore(req as AuthRequest, res, next));
router.post("/customers/:id/transactions", ...businessGuard, (req: Request, res: Response, next: NextFunction) => customerController.recordTransaction(req as AuthRequest, res, next));

// ── Reports & Tax ──────────────────────────────────────────────
router.get("/reports/gstr1", ...businessGuard, (req: Request, res: Response, next: NextFunction) => reportController.getGSTR1(req as AuthRequest, res, next));

// ── Campaigns & Marketing ──────────────────────────────────────
router.get("/campaigns/stats", ...businessGuard, (req: Request, res: Response, next: NextFunction) => campaignController.getStats(req as AuthRequest, res, next));
router.post("/campaigns/send", ...businessGuard, (req: Request, res: Response, next: NextFunction) => campaignController.sendCampaign(req as AuthRequest, res, next));

// ── Expenses ───────────────────────────────────────────────────
router.get("/expenses",      ...businessGuard, (req: Request, res: Response, next: NextFunction) => expenseController.list(req as AuthRequest, res, next));
router.post("/expenses",     ...businessGuard, (req: Request, res: Response, next: NextFunction) => expenseController.create(req as AuthRequest, res, next));
router.delete("/expenses/:id", ...businessGuard, (req: Request, res: Response, next: NextFunction) => expenseController.delete(req as AuthRequest, res, next));

// ── Purchases ──────────────────────────────────────────────────
router.get("/purchases",  ...businessGuard, (req: Request, res: Response, next: NextFunction) => purchaseController.list(req as AuthRequest, res, next));
router.post("/purchases", ...businessGuard, (req: Request, res: Response, next: NextFunction) => purchaseController.create(req as AuthRequest, res, next));

// ── AI Document Engine ────────────────────────────────────────
router.get("/documents",            ...businessGuard, (req: Request, res: Response, next: NextFunction) => documentController.list(req as AuthRequest, res, next));
router.post("/documents/upload",    ...businessGuard, upload.single("file"), (req: Request, res: Response, next: NextFunction) => documentController.upload(req as AuthRequest, res, next));
router.post("/documents/send-to-ca", ...businessGuard, (req: Request, res: Response, next: NextFunction) => documentController.sendToCa(req as AuthRequest, res, next));
router.delete("/documents/:id",     ...businessGuard, (req: Request, res: Response, next: NextFunction) => documentController.delete(req as AuthRequest, res, next));

// ── Health ────────────────────────────────────────────────────
router.get("/health", (_req: Request, res: Response) => res.json({ status: "ok", version: "2.1.0", timestamp: new Date().toISOString() }));

export default router;
