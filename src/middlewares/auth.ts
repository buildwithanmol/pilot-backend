import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  sub: string;
  role: "admin" | "smm" | "editor";
  email?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing or malformed",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;

    req.user = decoded;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error?.name === "TokenExpiredError" ? "Token expired" : "Invalid authorization token",
    });
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      req.user = decoded;
    }
  } catch {
  }
  next();
}

export function authorizeRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (req.user.role === "admin" || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: Access restricted to roles [${allowedRoles.join(", ")}]`,
    });
  };
}

export function smmCreateLinksGuard(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required to create channel links",
    });
  }

  if (req.user.role === "admin") {
    return next();
  }

  if (req.user.role === "smm") {
    const body = req.body;
    const items = Array.isArray(body)
      ? body
      : (Array.isArray(body?.links) ? body.links : (Array.isArray(body?.items) ? body.items : [body]));

    for (const item of items) {
      if (item && item.eId && String(item.eId) !== req.user.sub) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: SMM employees can only create links for their own employee ID",
        });
      }
      if (item && item.employeeId && String(item.employeeId) !== req.user.sub) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: SMM employees can only create links for their own employee ID",
        });
      }
      if (item && !item.eId && !item.employeeId) {
        item.eId = req.user.sub;
      }
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Forbidden: Only SMM and Admin roles have permission to create channel links",
  });
}
