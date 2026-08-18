import { Router, type Request, type Response } from "express";
import { eq, count, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { settings } from "../db/schema.js";
import { getSelectedColumns } from "../utils/query.js";

const router = Router();

async function getActiveSettings(req: Request, res: Response) {
  try {
    const selectedCols = getSelectedColumns(settings, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(settings)
      : db.select().from(settings);

    const results = await query.orderBy(desc(settings.createdAt)).limit(1);

    if (results && results.length > 0) {
      return res.status(200).json({
        success: true,
        data: results[0],
      });
    }

    const defaultCreated = await db
      .insert(settings)
      .values({
        editorDailyUploadLimit: 10,
        smmChannelLimit: 20,
      })
      .returning();

    res.status(200).json({
      success: true,
      data: defaultCreated[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch settings",
    });
  }
}

async function getAllSettings(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10) || 20));
    const offset = (page - 1) * limit;

    const totalCountResult = await db.select({ total: count() }).from(settings);
    const total = Number(totalCountResult[0]?.total || 0);

    const selectedCols = getSelectedColumns(settings, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(settings)
      : db.select().from(settings);

    const data = await query.orderBy(desc(settings.createdAt)).limit(limit).offset(offset);

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
      message: error?.message || "Failed to fetch settings",
    });
  }
}

async function getSettingsById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Settings ID is required" });
    }

    const selectedCols = getSelectedColumns(settings, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(settings)
      : db.select().from(settings);

    const results = await query.where(eq(settings.id, id)).limit(1);

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: "Settings record not found" });
    }

    res.status(200).json({
      success: true,
      data: results[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch settings",
    });
  }
}

async function createSettings(req: Request, res: Response) {
  try {
    const { editorDailyUploadLimit, smmChannelLimit } = req.body || {};

    const insertData: Record<string, any> = {};
    if (editorDailyUploadLimit !== undefined) {
      insertData.editorDailyUploadLimit = parseInt(String(editorDailyUploadLimit), 10);
    }
    if (smmChannelLimit !== undefined) {
      insertData.smmChannelLimit = parseInt(String(smmChannelLimit), 10);
    }

    const created = await db
      .insert(settings)
      .values(insertData as typeof settings.$inferInsert)
      .returning();

    res.status(201).json({
      success: true,
      data: created[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to create settings",
    });
  }
}

async function updateSettings(req: Request, res: Response) {
  try {
    const paramId = req.params.id ? String(req.params.id) : undefined;
    const { editorDailyUploadLimit, smmChannelLimit } = req.body || {};

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (editorDailyUploadLimit !== undefined) {
      updateData.editorDailyUploadLimit = parseInt(String(editorDailyUploadLimit), 10);
    }
    if (smmChannelLimit !== undefined) {
      updateData.smmChannelLimit = parseInt(String(smmChannelLimit), 10);
    }

    if (paramId && paramId !== "undefined") {
      const updated = await db
        .update(settings)
        .set(updateData)
        .where(eq(settings.id, paramId))
        .returning();

      if (!updated || updated.length === 0) {
        return res.status(404).json({ success: false, message: "Settings record not found" });
      }

      return res.status(200).json({
        success: true,
        data: updated[0],
      });
    }

    const existing = await db.select().from(settings).orderBy(desc(settings.createdAt)).limit(1);

    if (existing && existing.length > 0) {
      const updated = await db
        .update(settings)
        .set(updateData)
        .where(eq(settings.id, existing[0].id))
        .returning();

      return res.status(200).json({
        success: true,
        data: updated[0],
      });
    }

    const created = await db
      .insert(settings)
      .values({
        editorDailyUploadLimit: updateData.editorDailyUploadLimit ?? 10,
        smmChannelLimit: updateData.smmChannelLimit ?? 20,
      })
      .returning();

    res.status(200).json({
      success: true,
      data: created[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to update settings",
    });
  }
}

async function deleteSettings(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Settings ID is required" });
    }

    const deleted = await db
      .delete(settings)
      .where(eq(settings.id, id))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ success: false, message: "Settings record not found" });
    }

    res.status(200).json({
      success: true,
      message: "Settings deleted successfully",
      data: deleted[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete settings",
    });
  }
}

router.get("/all", getAllSettings);
router.get("/:id", getSettingsById);
router.get("/", getActiveSettings);

router.post("/", createSettings);
router.put("/:id", updateSettings);
router.delete("/:id", deleteSettings);

export default router;
