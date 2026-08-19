import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { employees } from "../db/schema.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "pilot_jwt_super_secret_key_2026";

async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const empRes = await db
      .select()
      .from(employees)
      .where(and(eq(employees.email, cleanEmail), eq(employees.isDeleted, false)))
      .limit(1);

    if (!empRes || empRes.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const employee = empRes[0];
    const isPasswordValid = await bcrypt.compare(String(password), employee.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const payload = {
      sub: employee.id,
      role: employee.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        tokenType: "Bearer",
        expiresIn: "24h",
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          role: employee.role,
          salary: employee.salary,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Login failed",
    });
  }
}

async function getMe(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const empRes = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        email: employees.email,
        role: employees.role,
        salary: employees.salary,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .where(and(eq(employees.id, userId), eq(employees.isDeleted, false)))
      .limit(1);

    if (!empRes || empRes.length === 0) {
      return res.status(404).json({ success: false, message: "Employee profile not found" });
    }

    res.status(200).json({
      success: true,
      data: empRes[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch profile",
    });
  }
}

router.post("/login", login);
router.get("/me", authenticate, getMe);

export default router;
