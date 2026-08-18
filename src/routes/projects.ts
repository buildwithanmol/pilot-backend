import { Router, type Request, type Response } from "express";
import { eq, count, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { projects } from "../db/schema.js";
import { getSelectedColumns } from "../utils/query.js";

const router = Router();

async function getAllProjects(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10) || 20));
    const offset = (page - 1) * limit;

    const statusParam = req.query.status;
    let whereCondition;
    if (statusParam !== undefined) {
      whereCondition = eq(projects.status, String(statusParam).toLowerCase() === "true");
    }

    const totalCountResult = await (
      whereCondition
        ? db.select({ total: count() }).from(projects).where(whereCondition)
        : db.select({ total: count() }).from(projects)
    );
    const total = Number(totalCountResult[0]?.total || 0);

    const selectedCols = getSelectedColumns(projects, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(projects)
      : db.select().from(projects);

    const data = await (
      whereCondition
        ? query.where(whereCondition).orderBy(desc(projects.createdAt)).limit(limit).offset(offset)
        : query.orderBy(desc(projects.createdAt)).limit(limit).offset(offset)
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
      message: error?.message || "Failed to fetch projects",
    });
  }
}

async function getProjectById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const selectedCols = getSelectedColumns(projects, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(projects)
      : db.select().from(projects);

    const results = await query.where(eq(projects.id, id)).limit(1);

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(200).json({
      success: true,
      data: results[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch project",
    });
  }
}

async function createProject(req: Request, res: Response) {
  try {
    const { name, description, status } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    const insertData: Record<string, any> = {
      name: name.trim(),
      description: description ?? null,
      status: status !== undefined ? Boolean(status) : true,
    };

    const created = await db
      .insert(projects)
      .values(insertData as typeof projects.$inferInsert)
      .returning();

    res.status(201).json({
      success: true,
      data: created[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to create project",
    });
  }
}

async function updateProject(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const { name, description, status } = req.body || {};

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = String(name).trim();
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = Boolean(status);

    const updated = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(200).json({
      success: true,
      data: updated[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to update project",
    });
  }
}

async function deleteProject(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Project ID is required" });
    }

    const deleted = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
      data: deleted[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete project",
    });
  }
}

router.get("/all", getAllProjects);
router.get("/:id", getProjectById);
router.get("/", getAllProjects);

router.post("/", createProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;
