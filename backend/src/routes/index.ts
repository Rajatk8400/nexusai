import { Router } from "express";
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
import { authenticate, requireBusiness } from "../middlewares/auth.middleware";
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
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ── Admin ──────────────────────────────────────────────────────
router.get("/admin/stats",      authenticate, (req, res, next) => adminController.getStats(req as any, res, next));
router.get("/admin/businesses", authenticate, (req, res, next) => adminController.getBusinesses(req as any, res, next));
router.post("/admin/approve",   authenticate, (req, res, next) => adminController.approveUpgrade(req as any, res, next));
router.post("/admin/update-plan", authenticate, (req, res, next) => adminController.updatePlan(req as any, res, next));

// ── Auth (public) ─────────────────────────────────────────────
router.post("/auth/register", validate(authValidation.register), (req, res, next) => authController.register(req as any, res, next));
router.post("/auth/login",    validate(authValidation.login), (req, res, next) => authController.login(req as any, res, next));
router.post("/auth/refresh",  validate(authValidation.refresh), (req, res, next) => authController.refresh(req as any, res, next));

// ── Auth (protected) ──────────────────────────────────────────
router.post("/auth/logout",  authenticate, (req, res, next) => authController.logout(req as any, res, next));
router.get("/auth/profile",  authenticate, (req, res, next) => authController.profile(req as any, res, next));
router.post("/business/upgrade", authenticate, (req, res, next) => businessController.upgrade(req as any, res, next));
router.put("/business", authenticate, (req, res, next) => businessController.update(req as any, res, next));

// ── Dashboard ─────────────────────────────────────────────────
router.get("/dashboard",         ...businessGuard, (req, res, next) => dashboardController.overview(req as any, res, next));
router.get("/dashboard/revenue", ...businessGuard, (req, res, next) => saleController.revenueChart(req as any, res, next));
router.get("/dashboard/kpis",    ...businessGuard, (req, res, next) => saleController.dashboard(req as any, res, next));

// ── Products ──────────────────────────────────────────────────
router.get("/products",            ...businessGuard, (req, res, next) => productController.list(req as any, res, next));
router.post("/products",           ...businessGuard, validate(productValidation.create), (req, res, next) => productController.create(req as any, res, next));
router.get("/products/stock-value",...businessGuard, (req, res, next) => productController.stockValue(req as any, res, next));
router.get("/products/:id",        ...businessGuard, (req, res, next) => productController.getById(req as any, res, next));
router.put("/products/:id",        ...businessGuard, validate(productValidation.update), (req, res, next) => productController.update(req as any, res, next));
router.delete("/products/:id",     ...businessGuard, (req, res, next) => productController.delete(req as any, res, next));

// ── Sales ─────────────────────────────────────────────────────
router.get("/sales",     ...businessGuard, (req, res, next) => saleController.list(req as any, res, next));
router.post("/sales",    ...businessGuard, validate(saleValidation.create), (req, res, next) => saleController.create(req as any, res, next));
router.get("/sales/:id", ...businessGuard, (req, res, next) => saleController.getById(req as any, res, next));
router.put("/sales/:id/eway-bill", ...businessGuard, (req, res, next) => saleController.updateEwayBill(req as any, res, next));

// ── Inventory ─────────────────────────────────────────────────
router.get("/inventory",           ...businessGuard, (req, res, next) => inventoryController.getStock(req as any, res, next));
router.post("/inventory/adjust",   ...businessGuard, (req, res, next) => inventoryController.adjust(req as any, res, next));
router.get("/inventory/low-stock", ...businessGuard, (req, res, next) => inventoryController.getLowStock(req as any, res, next));
router.get("/inventory/movements", ...businessGuard, (req, res, next) => inventoryController.getMovements(req as any, res, next));

// ── AI & Forecasts ──────────────────────────────────────────
router.get("/ai/forecast/demand/:productId", ...businessGuard, (req, res, next) => aiController.getDemandForecast(req as any, res, next));
router.get("/ai/forecast/revenue",           ...businessGuard, (req, res, next) => aiController.getRevenueForecast(req as any, res, next));
router.get("/ai/inventory-insights",         ...businessGuard, (req, res, next) => aiController.getInventoryInsights(req as any, res, next));
router.get("/ai/staff-productivity",         ...businessGuard, (req, res, next) => aiController.getStaffProductivity(req as any, res, next));
router.get("/ai/business-insights",          ...businessGuard, (req, res, next) => aiController.getBusinessInsights(req as any, res, next));

// ── Customers & Khata ──────────────────────────────────────────
router.get("/customers",                   ...businessGuard, (req, res, next) => customerController.list(req as any, res, next));
router.get("/customers/:id",               ...businessGuard, (req, res, next) => customerController.getById(req as any, res, next));
router.get("/customers/:id/transactions",  ...businessGuard, (req, res, next) => customerController.getTransactions(req as any, res, next));
router.post("/customers/:id/transactions", ...businessGuard, (req, res, next) => customerController.recordTransaction(req as any, res, next));

// ── Reports & Tax ──────────────────────────────────────────────
router.get("/reports/gstr1", ...businessGuard, (req, res, next) => reportController.getGSTR1(req as any, res, next));

// ── Campaigns & Marketing ──────────────────────────────────────
router.get("/campaigns/stats", ...businessGuard, (req, res, next) => campaignController.getStats(req as any, res, next));
router.post("/campaigns/send", ...businessGuard, (req, res, next) => campaignController.sendCampaign(req as any, res, next));

// ── Expenses ───────────────────────────────────────────────────
router.get("/expenses",      ...businessGuard, (req, res, next) => expenseController.list(req as any, res, next));
router.post("/expenses",     ...businessGuard, (req, res, next) => expenseController.create(req as any, res, next));
router.delete("/expenses/:id", ...businessGuard, (req, res, next) => expenseController.delete(req as any, res, next));

// ── Purchases ──────────────────────────────────────────────────
router.get("/purchases",  ...businessGuard, (req, res, next) => purchaseController.list(req as any, res, next));
router.post("/purchases", ...businessGuard, (req, res, next) => purchaseController.create(req as any, res, next));

// ── AI Document Engine ────────────────────────────────────────
router.get("/documents",            ...businessGuard, (req, res, next) => documentController.list(req as any, res, next));
router.post("/documents/upload",    ...businessGuard, upload.single("file"), (req, res, next) => documentController.upload(req as any, res, next));
router.post("/documents/send-to-ca", ...businessGuard, (req, res, next) => documentController.sendToCa(req as any, res, next));
router.delete("/documents/:id",     ...businessGuard, (req, res, next) => documentController.delete(req as any, res, next));

// ── Health ────────────────────────────────────────────────────
router.get("/health", (req, res) => res.json({ status: "ok", version: "2.1.0", timestamp: new Date().toISOString() }));

export default router;
