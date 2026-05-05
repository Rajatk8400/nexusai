import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Business, Branch, IUser } from "../models";
import { createLogger } from "../config/logger";
import { AppError } from "../utils/AppError";

const log = createLogger("AuthService");

const ROLE_LEVELS: Record<string, number> = {
  SUPER_ADMIN: 100,
  BUSINESS_OWNER: 80,
  BRANCH_MANAGER: 60,
  STAFF: 40,
  ANALYST: 30,
  VIEWER: 10,
};

function signAccess(payload: object): string {
  return jwt.sign(payload, process.env["JWT_SECRET"]!, {
    expiresIn: process.env["JWT_EXPIRES_IN"] ?? "7d",
  } as jwt.SignOptions);
}

function signRefresh(payload: object): string {
  return jwt.sign(payload, process.env["JWT_REFRESH_SECRET"]!, {
    expiresIn: process.env["JWT_REFRESH_EXPIRES_IN"] ?? "30d",
  } as jwt.SignOptions);
}

function buildTokens(user: IUser) {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    roleLevel: user.roleLevel,
    businessId: user.businessId ?? null,
    branchId: user.branchId ?? null,
  };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh({ id: user._id.toString() });
  return { accessToken, refreshToken };
}

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName: string;
  }) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new AppError("Email already registered", 409);

    // Create business
    const slug = data.businessName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
    const business = await Business.create({
      name: data.businessName,
      slug: uniqueSlug,
      status: "ACTIVE",
    });

    // Create head-office branch
    const branch = await Branch.create({
      businessId: business._id.toString(),
      name: "Head Office",
      code: "HO",
      isHeadOffice: true,
      isActive: true,
    });

    // Create owner user
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: "BUSINESS_OWNER",
      roleLevel: ROLE_LEVELS["BUSINESS_OWNER"],
      businessId: business._id.toString(),
      branchId: branch._id.toString(),
      isActive: true,
    });

    // Update business ownerId
    await Business.findByIdAndUpdate(business._id, { ownerId: user._id.toString() });

    const { accessToken, refreshToken } = buildTokens(user);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    log.info("User registered", { userId: user._id, businessId: business._id });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        roleLevel: user.roleLevel,
        businessId: business._id.toString(),
        branchId: branch._id.toString(),
      },
      business: { 
        id: business._id.toString(), 
        name: business.name, 
        slug: business.slug,
        plan: (business as any).plan,
        planExpiresAt: (business as any).planExpiresAt
      },
      branch: { id: branch._id.toString(), name: branch.name, code: branch.code },
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null });
    if (!user) throw new AppError("Invalid email or password", 401);
    if (!user.isActive) throw new AppError("Account is disabled", 403);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError("Invalid email or password", 401);

    const business = user.businessId
      ? await Business.findById(user.businessId).lean()
      : null;
    const branch = user.branchId
      ? await Branch.findById(user.branchId).lean()
      : null;

    const { accessToken, refreshToken } = buildTokens(user);
    await User.findByIdAndUpdate(user._id, { refreshToken, lastLoginAt: new Date() });

    log.info("User logged in", { userId: user._id });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        roleLevel: user.roleLevel,
        businessId: user.businessId ?? null,
        branchId: user.branchId ?? null,
      },
      business: business
        ? { 
            id: business._id.toString(), 
            name: (business as any).name, 
            slug: (business as any).slug,
            plan: (business as any).plan,
            planExpiresAt: (business as any).planExpiresAt
          }
        : null,
      branch: branch
        ? { id: branch._id.toString(), name: (branch as any).name, code: (branch as any).code }
        : null,
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(token: string) {
    let payload: any;
    try {
      payload = jwt.verify(token, process.env["JWT_REFRESH_SECRET"]!);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const user = await User.findById(payload.id);
    if (!user || user.refreshToken !== token) throw new AppError("Refresh token revoked", 401);

    const { accessToken, refreshToken } = buildTokens(user);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    return { accessToken, refreshToken };
  }

  async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId).select("-passwordHash -refreshToken");
    if (!user) throw new AppError("User not found", 404);
    
    const business = user.businessId ? await Business.findById(user.businessId).lean() : null;
    const branch = user.branchId ? await Branch.findById(user.branchId).lean() : null;

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        roleLevel: user.roleLevel,
        businessId: user.businessId ?? null,
        branchId: user.branchId ?? null,
      },
      business: business ? {
        id: (business as any)._id.toString(),
        name: (business as any).name,
        slug: (business as any).slug,
        plan: (business as any).plan,
        planExpiresAt: (business as any).planExpiresAt,
      } : null,
      branch: branch ? {
        id: (branch as any)._id.toString(),
        name: (branch as any).name,
        code: (branch as any).code,
      } : null,
    };
  }
}

export const authService = new AuthService();
