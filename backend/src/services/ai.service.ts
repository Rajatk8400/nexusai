import { Sale, Product, Inventory, ForecastResult, User } from "../models";
import { AppError } from "../utils/AppError";
import { createLogger } from "../config/logger";

const log = createLogger("AIService");

// ── Statistical Forecasting Helpers ────────────────────────────────────────

interface DailyData {
  date: string;
  dayOfWeek: number;
  value: number;
}

function groupDataByDay(sales: any[], valueExtractor: (sale: any) => number, startDate: Date, days: number): DailyData[] {
  const result: Record<string, DailyData> = {};
  
  // Initialize all days to 0
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    result[dateStr] = { date: dateStr, dayOfWeek: d.getDay(), value: 0 };
  }

  // Populate actual data
  for (const sale of sales) {
    const dateStr = new Date(sale.saleDateAt).toISOString().split('T')[0];
    if (result[dateStr]) {
      result[dateStr].value += valueExtractor(sale);
    }
  }

  return Object.values(result).sort((a, b) => a.date.localeCompare(b.date));
}

function calculateTrend(data: DailyData[]) {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0, avg: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = data[i].value;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = (n * sumX2 - sumX * sumX);
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept, avg: sumY / n };
}

function calculateSeasonality(data: DailyData[], globalAvg: number) {
  const daySums = [0, 0, 0, 0, 0, 0, 0];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];

  for (const d of data) {
    daySums[d.dayOfWeek] += d.value;
    dayCounts[d.dayOfWeek]++;
  }

  const multipliers = [1, 1, 1, 1, 1, 1, 1];
  if (globalAvg > 0) {
    for (let i = 0; i < 7; i++) {
      if (dayCounts[i] > 0) {
        const dayAvg = daySums[i] / dayCounts[i];
        // Cap multipliers between 0.3 (very slow day) and 2.5 (very busy day)
        multipliers[i] = Math.max(0.3, Math.min(2.5, dayAvg / globalAvg));
      }
    }
  }
  return multipliers;
}

function calculateConfidenceScore(data: DailyData[], avg: number): number {
  if (data.length === 0 || avg === 0) return 0.5; // Default low confidence if no data
  const variance = data.reduce((acc, val) => acc + Math.pow(val.value - avg, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / avg; // Coefficient of Variation
  
  // If CV is 0 (constant sales), confidence is 0.95. If CV is > 1 (highly volatile), confidence drops.
  let confidence = 0.95 - (cv * 0.3);
  return Math.max(0.4, Math.min(0.95, confidence));
}

// ── Main Service ──────────────────────────────────────────────────────────

export class AIService {
  async generateDemandForecast(businessId: string, productId: string, days = 30) {
    const product = await Product.findOne({ _id: productId, businessId, deletedAt: null });
    if (!product) throw new AppError("Product not found", 404);

    const historicalDays = 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - historicalDays);

    const sales = await Sale.find({
      businessId,
      "items.productId": productId,
      status: "CONFIRMED",
      saleDateAt: { $gte: startDate }
    }).lean();

    const valueExtractor = (sale: any) => {
      const item = sale.items.find((i: any) => i.productId === productId);
      return item?.quantity || 0;
    };

    const dailyData = groupDataByDay(sales, valueExtractor, startDate, historicalDays);
    const { slope, intercept, avg } = calculateTrend(dailyData);
    const multipliers = calculateSeasonality(dailyData, avg);
    const confidenceScore = calculateConfidenceScore(dailyData, avg);

    const predictions = [];
    const now = new Date();
    for (let i = 1; i <= days; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + i);
      const targetDayOfWeek = targetDate.getDay();
      
      // y = mx + b (x is continuing from historical data, so x = historicalDays + i)
      const basePrediction = (slope * (historicalDays + i)) + intercept;
      
      // Apply seasonality multiplier
      let quantity = basePrediction * multipliers[targetDayOfWeek];
      quantity = Math.max(0, Math.round(quantity * 100) / 100);

      // Add a tiny bit of random noise (<= 5%) to represent natural real-world variation
      const noise = (Math.random() - 0.5) * 0.1 * quantity;
      quantity = Math.max(0, Math.round((quantity + noise) * 100) / 100);

      predictions.push({
        date: targetDate.toISOString().split('T')[0],
        quantity,
        confidence: confidenceScore
      });
    }

    const result = await ForecastResult.create({
      businessId,
      productId,
      type: "DEMAND",
      status: "COMPLETED",
      forecastPeriod: days,
      forecastStartAt: new Date(),
      forecastEndAt: predictions[predictions.length - 1].date,
      predictions,
      accuracy: confidenceScore - 0.05, // Placeholder for historical accuracy vs forecast
      confidenceScore,
      processedAt: new Date()
    });

    log.info("Demand forecast generated via statistical model", { productId, businessId });
    return result;
  }

  async generateRevenueForecast(businessId: string, days = 30) {
    const historicalDays = 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - historicalDays);

    const sales = await Sale.find({
      businessId,
      status: "CONFIRMED",
      saleDateAt: { $gte: startDate }
    }).lean();

    const valueExtractor = (sale: any) => sale.totalAmount;
    const dailyData = groupDataByDay(sales, valueExtractor, startDate, historicalDays);
    
    const { slope, intercept, avg } = calculateTrend(dailyData);
    const multipliers = calculateSeasonality(dailyData, avg);
    const confidenceScore = calculateConfidenceScore(dailyData, avg);

    const predictions = [];
    const now = new Date();
    for (let i = 1; i <= days; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + i);
      const targetDayOfWeek = targetDate.getDay();
      
      const basePrediction = (slope * (historicalDays + i)) + intercept;
      let revenue = basePrediction * multipliers[targetDayOfWeek];
      
      const noise = (Math.random() - 0.5) * 0.05 * revenue;
      revenue = Math.max(0, Math.round((revenue + noise) * 100) / 100);

      predictions.push({
        date: targetDate.toISOString().split('T')[0],
        revenue,
        bestCase: Math.round(revenue * 1.15 * 100) / 100,
        worstCase: Math.round(revenue * 0.85 * 100) / 100,
        confidence: confidenceScore
      });
    }

    const result = await ForecastResult.create({
      businessId,
      type: "REVENUE",
      status: "COMPLETED",
      forecastPeriod: days,
      forecastStartAt: new Date(),
      forecastEndAt: predictions[predictions.length - 1].date,
      predictions,
      confidenceScore,
      processedAt: new Date()
    });

    log.info("Revenue forecast generated via statistical model", { businessId });
    return result;
  }

  async getInventoryInsights(businessId: string, branchId?: string): Promise<any[]> {
    const inventory = await Inventory.find({ businessId, ...(branchId ? { branchId } : {}) }).lean();
    const productIds = inventory.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, businessId, deletedAt: null }).lean();
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const insights = [];

    for (const item of inventory) {
      const product = productMap.get(item.productId);
      if (!product) continue;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sales = await Sale.find({
        businessId,
        "items.productId": item.productId,
        status: "CONFIRMED",
        saleDateAt: { $gte: thirtyDaysAgo }
      }).select("items").lean();

      const totalSold = sales.reduce((sum, s) => {
        const line = s.items.find((i: any) => i.productId === item.productId);
        return sum + (line?.quantity || 0);
      }, 0);

      const velocity = totalSold / 30; // units per day
      const daysRemaining = velocity > 0 ? Math.floor(item.quantityAvailable / velocity) : 999;

      let status: "CRITICAL" | "WARNING" | "HEALTHY" | "EXCESS" = "HEALTHY";
      if (daysRemaining < 7) status = "CRITICAL";
      else if (daysRemaining < 15) status = "WARNING";
      else if (daysRemaining > 90 && velocity > 0) status = "EXCESS";

      insights.push({
        productId: item.productId,
        productName: product.name,
        sku: product.sku,
        currentStock: item.quantityAvailable,
        dailyVelocity: velocity.toFixed(2),
        daysRemaining: daysRemaining === 999 ? "99+" : daysRemaining,
        status,
        recommendation: status === "CRITICAL" ? "REORDER_NOW" : status === "WARNING" ? "REORDER_SOON" : "STABLE",
        suggestedOrder: status === "CRITICAL" || status === "WARNING" ? Math.max(Math.round(velocity * 30), (product as any).reorderQuantity || 10) : 0
      });
    }

    return insights.sort((a, b) => {
      if (a.status === "CRITICAL" && b.status !== "CRITICAL") return -1;
      if (a.status !== "CRITICAL" && b.status === "CRITICAL") return 1;
      if (a.status === "WARNING" && b.status === "HEALTHY") return -1;
      return 0;
    });
  }

  async getStaffProductivity(businessId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sales = await Sale.find({
      businessId,
      status: "CONFIRMED",
      saleDateAt: { $gte: thirtyDaysAgo }
    }).lean();

    const staffStats: Record<string, any> = {};

    for (const sale of sales) {
      const staffId = sale.createdById || "system";
      if (!staffStats[staffId]) {
        staffStats[staffId] = {
          staffId,
          totalRevenue: 0,
          orderCount: 0,
          avgOrderValue: 0,
          profitGenerated: 0
        };
      }
      staffStats[staffId].totalRevenue += sale.totalAmount;
      staffStats[staffId].orderCount += 1;
      staffStats[staffId].profitGenerated += (sale as any).profitAmount || 0;
    }

    const staffIds = Object.keys(staffStats);
    const users = await User.find({ _id: { $in: staffIds } }).select("firstName lastName").lean();
    const userMap = new Map(users.map(u => [u._id.toString(), `${u.firstName} ${u.lastName}`]));

    const results = Object.values(staffStats).map(s => ({
      ...s,
      staffName: userMap.get(s.staffId) || "Unknown Staff",
      avgOrderValue: s.orderCount > 0 ? Math.round((s.totalRevenue / s.orderCount) * 100) / 100 : 0,
      efficiencyScore: s.orderCount > 0 ? Math.min(100, Math.round((s.totalRevenue / s.orderCount / 100) * 10 + s.orderCount)) : 0
    }));

    return results.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getBusinessInsights(businessId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sales = await Sale.find({
      businessId,
      status: "CONFIRMED",
      saleDateAt: { $gte: thirtyDaysAgo }
    }).lean();

    if (sales.length === 0) return { insights: ["No recent sales data to analyze."], metrics: {} };

    // Day of week analysis
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    sales.forEach(s => {
      const d = new Date(s.saleDateAt).getDay();
      dayTotals[d] += s.totalAmount;
      dayCounts[d]++;
    });

    const dayAvgs = dayTotals.map((t, i) => ({ day: days[i], avg: dayCounts[i] > 0 ? t / dayCounts[i] : 0 }));
    const bestDay = [...dayAvgs].sort((a, b) => b.avg - a.avg)[0];

    const insights = [];
    insights.push(`Your busiest day on average is ${bestDay.day}.`);
    
    const totalRev = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const avgTicket = totalRev / sales.length;
    insights.push(`Average transaction value is ₹${avgTicket.toFixed(2)}.`);

    const highValueSales = sales.filter(s => s.totalAmount > avgTicket * 2).length;
    if (highValueSales > 0) {
      insights.push(`You had ${highValueSales} high-value transactions (> 2x average) this month.`);
    }

    return {
      insights,
      metrics: {
        totalRevenue: totalRev,
        transactionCount: sales.length,
        avgTicket,
        bestDay: bestDay.day
      }
    };
  }
}

export const aiService = new AIService();
