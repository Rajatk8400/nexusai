import { FilterQuery } from "mongoose";
import { Customer, ICustomer } from "../models";

export interface SendCampaignInput {
  template: string;
  segment: "ALL" | "DUE";
  channel: "WHATSAPP" | "SMS";
}

export interface CampaignTargetResult {
  customerName: string;
  phone?: string;
  link: string;
  status: string;
}

export interface SendCampaignResult {
  campaignId: string;
  targetCount: number;
  results: CampaignTargetResult[];
}

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

  async sendCampaign(businessId: string, data: SendCampaignInput): Promise<SendCampaignResult> {
    const filter: FilterQuery<ICustomer> = { businessId, deletedAt: null };
    if (data.segment === "DUE") {
      filter.balance = { $gt: 0 };
    }

    const customers = await Customer.find(filter).select("name phone balance").lean();
    
    const results: CampaignTargetResult[] = customers.map((c) => {
      const message = data.template
        .replace(/{name}/g, c.name)
        .replace(/{balance}/g, (c.balance ?? 0).toString());
      
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
