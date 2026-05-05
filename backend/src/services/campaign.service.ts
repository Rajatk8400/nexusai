import { Customer } from "../models";
import { AppError } from "../utils/AppError";

export class CampaignService {
  async getStats(businessId: string) {
    const totalCustomers = await Customer.countDocuments({ businessId, deletedAt: null });
    const customersWithBalance = await Customer.countDocuments({ businessId, deletedAt: null, balance: { $gt: 0 } });
    
    return {
      totalCustomers,
      customersWithBalance,
      availableChannels: ["WHATSAPP", "SMS"],
    };
  }

  async sendCampaign(businessId: string, data: { template: string, segment: "ALL" | "DUE", channel: "WHATSAPP" | "SMS" }) {
    const filter: any = { businessId, deletedAt: null };
    if (data.segment === "DUE") {
      filter.balance = { $gt: 0 };
    }

    const customers = await Customer.find(filter).select("name phone balance").lean();
    
    const results = customers.map(c => {
      let message = data.template
        .replace(/{name}/g, c.name)
        .replace(/{balance}/g, c.balance.toString());
      
      // For WhatsApp, we generate the link
      const phone = c.phone?.replace(/\D/g, "");
      const finalPhone = phone?.length === 10 ? `91${phone}` : phone;
      const link = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;

      return {
        customerName: c.name,
        phone: c.phone,
        link,
        status: "PENDING"
      };
    });

    return {
      campaignId: Date.now().toString(36),
      targetCount: customers.length,
      results
    };
  }
}

export const campaignService = new CampaignService();
