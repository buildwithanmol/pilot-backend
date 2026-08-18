import { Router, type Request, type Response } from "express";
import { eq, count, and, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { employees, employeeFolders } from "../db/schema.js";
import { getSelectedColumns } from "../utils/query.js";

const router = Router();

async function getAllFolders(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10) || 20));
    const offset = (page - 1) * limit;
    const eId = req.query.eId || req.query.employeeId ? String(req.query.eId || req.query.employeeId) : undefined;

    const whereCondition = eId ? eq(employeeFolders.eId, eId) : undefined;

    const totalCountResult = await (
      whereCondition
        ? db.select({ total: count() }).from(employeeFolders).where(whereCondition)
        : db.select({ total: count() }).from(employeeFolders)
    );
    const total = Number(totalCountResult[0]?.total || 0);

    const data = await (
      whereCondition
        ? db.select().from(employeeFolders).where(whereCondition).orderBy(desc(employeeFolders.createdAt)).limit(limit).offset(offset)
        : db.select().from(employeeFolders).orderBy(desc(employeeFolders.createdAt)).limit(limit).offset(offset)
    );

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch folders",
    });
  }
}

async function getFolderById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Folder ID is required" });
    }

    const results = await db.select().from(employeeFolders).where(eq(employeeFolders.id, id)).limit(1);

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: "Folder not found" });
    }

    res.status(200).json({
      success: true,
      data: results[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch folder",
    });
  }
}

async function createFolder(req: Request, res: Response) {
  try {
    const { eId, employeeId, folderId, folderName, folder_name } = req.body || {};
    const targetEmployeeId = String(eId || employeeId || "");

    if (!targetEmployeeId || targetEmployeeId === "undefined") {
      return res.status(400).json({
        success: false,
        message: "eId (employee ID) is required",
      });
    }

    const emp = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, targetEmployeeId), eq(employees.isDeleted, false)))
      .limit(1);

    if (!emp || emp.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (emp[0].role === "editor") {
      const existingFolders = await db
        .select({ total: count() })
        .from(employeeFolders)
        .where(eq(employeeFolders.eId, targetEmployeeId));

      const folderCount = Number(existingFolders[0]?.total || 0);
      if (folderCount >= 1) {
        return res.status(400).json({
          success: false,
          message: "Editors are strictly allowed only one folder. Update or delete the existing folder first.",
        });
      }
    }

    const nameVal = folderName !== undefined ? folderName : (folder_name !== undefined ? folder_name : null);

    const created = await db
      .insert(employeeFolders)
      .values({
        eId: targetEmployeeId,
        folderId: folderId ?? null,
        folderName: nameVal,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: created[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to create folder",
    });
  }
}

async function updateFolder(req: Request, res: Response) {
  try {
    const paramId = req.params.id ? String(req.params.id) : undefined;
    const bodyId = req.body?.id ? String(req.body.id) : undefined;
    const id = paramId || bodyId;

    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Folder ID is required" });
    }

    const { folderId, folderName, folder_name, eId, employeeId } = req.body || {};

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (folderId !== undefined) updateData.folderId = folderId;
    if (folderName !== undefined) updateData.folderName = folderName;
    else if (folder_name !== undefined) updateData.folderName = folder_name;
    if (eId !== undefined || employeeId !== undefined) {
      const newEmployeeId = String(eId || employeeId);
      const emp = await db
        .select()
        .from(employees)
        .where(and(eq(employees.id, newEmployeeId), eq(employees.isDeleted, false)))
        .limit(1);

      if (!emp || emp.length === 0) {
        return res.status(404).json({ success: false, message: "New employee not found" });
      }

      if (emp[0].role === "editor") {
        const existingFolders = await db
          .select({ total: count() })
          .from(employeeFolders)
          .where(and(eq(employeeFolders.eId, newEmployeeId)));

        const folderCount = Number(existingFolders[0]?.total || 0);
        if (folderCount >= 1) {
          return res.status(400).json({
            success: false,
            message: "Editors are strictly allowed only one folder",
          });
        }
      }

      updateData.eId = newEmployeeId;
    }

    const updated = await db
      .update(employeeFolders)
      .set(updateData)
      .where(eq(employeeFolders.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: "Folder not found" });
    }

    res.status(200).json({
      success: true,
      data: updated[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to update folder",
    });
  }
}

async function deleteFolder(req: Request, res: Response) {
  try {
    const paramId = req.params.id ? String(req.params.id) : undefined;
    const bodyId = req.body?.id ? String(req.body.id) : undefined;
    const queryId = req.query.id ? String(req.query.id) : undefined;
    const id = paramId || bodyId || queryId;

    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Folder ID is required" });
    }

    const deleted = await db
      .delete(employeeFolders)
      .where(eq(employeeFolders.id, id))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ success: false, message: "Folder not found" });
    }

    res.status(200).json({
      success: true,
      message: "Folder deleted successfully",
      data: deleted[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete folder",
    });
  }
}

async function getAllEmployees(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10) || 20));
    const offset = (page - 1) * limit;
    const includeDeleted = String(req.query.includeDeleted).toLowerCase() === "true";

    const whereCondition = includeDeleted ? undefined : eq(employees.isDeleted, false);

    const totalCountResult = await (
      whereCondition
        ? db.select({ total: count() }).from(employees).where(whereCondition)
        : db.select({ total: count() }).from(employees)
    );
    const total = Number(totalCountResult[0]?.total || 0);

    const selectedCols = getSelectedColumns(employees, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(employees)
      : db.select().from(employees);

    const data = await (
      whereCondition
        ? query.where(whereCondition).orderBy(desc(employees.createdAt)).limit(limit).offset(offset)
        : query.orderBy(desc(employees.createdAt)).limit(limit).offset(offset)
    );

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch employees",
    });
  }
}

async function getEmployeeById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Employee ID is required" });
    }

    const includeDeleted = String(req.query.includeDeleted).toLowerCase() === "true";
    const whereCondition = includeDeleted
      ? eq(employees.id, id)
      : and(eq(employees.id, id), eq(employees.isDeleted, false));

    const selectedCols = getSelectedColumns(employees, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(employees)
      : db.select().from(employees);

    const results = await query.where(whereCondition).limit(1);

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      data: results[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch employee",
    });
  }
}

async function updateEmployee(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Employee ID is required" });
    }

    const { firstName, lastName, email, password, role, salary, isDeleted } = req.body;

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) {
      const isAlreadyHashed = typeof password === "string" && /^\$2[abxy]\$\d{2}\$/.test(password);
      updateData.password = isAlreadyHashed ? password : await bcrypt.hash(String(password), 10);
    }
    if (role !== undefined) updateData.role = role;
    if (salary !== undefined) updateData.salary = salary;
    if (isDeleted !== undefined) updateData.isDeleted = isDeleted;

    const updated = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      data: updated[0],
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to update employee",
    });
  }
}

async function createEmployee(req: Request, res: Response) {
  try {
    const paramId = req.params.id ? String(req.params.id) : undefined;
    const { id: bodyId, firstName, lastName, email, password, role, salary } = req.body;

    const id = paramId || (bodyId ? String(bodyId) : undefined);

    if (!firstName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "firstName, email, password, and role are required",
      });
    }

    const isAlreadyHashed = typeof password === "string" && /^\$2[abxy]\$\d{2}\$/.test(password);
    const hashedPassword = isAlreadyHashed ? password : await bcrypt.hash(String(password), 10);

    const insertData: Record<string, any> = {
      firstName,
      lastName: lastName ?? null,
      email,
      password: hashedPassword,
      role,
      salary: salary !== undefined ? salary : null,
    };

    if (id) {
      insertData.id = id;
    }

    const created = await db
      .insert(employees)
      .values(insertData as typeof employees.$inferInsert)
      .returning();

    res.status(201).json({
      success: true,
      data: created[0],
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({ success: false, message: "Email or ID already in use" });
    }
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to create employee",
    });
  }
}

async function deleteEmployee(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Employee ID is required" });
    }

    const deleted = await db
      .update(employees)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      message: "Employee soft deleted successfully",
      data: deleted[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete employee",
    });
  }
}

router.get("/folders", getAllFolders);
router.get("/folders/:id", getFolderById);
router.post("/folders", createFolder);
router.put("/folders/:id", updateFolder);
router.delete("/folders/:id", deleteFolder);

router.get("/all", getAllEmployees);
router.get("/:id", getEmployeeById);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;