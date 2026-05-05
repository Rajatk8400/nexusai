import { Response } from "express";

export function sendSuccess(res: Response, data: any, message = "Success", statusCode = 200) {
  res.status(statusCode).json({ success: true, message, data });
}

export function sendCreated(res: Response, data: any, message = "Created") {
  sendSuccess(res, data, message, 201);
}

export function sendError(res: Response, message: string, statusCode = 500, details?: any) {
  res.status(statusCode).json({ success: false, message, ...(details ? { details } : {}) });
}
