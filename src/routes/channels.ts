import { Router, type Request, type Response } from "express";
import { eq, count, and, desc, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { channels, channelRecords, employees, projects } from "../db/schema.js";
import { getSelectedColumns } from "../utils/query.js";
import { authenticate, smmCreateLinksGuard } from "../middlewares/auth.js";

const router = Router();

async function getAllLinks(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10) || 20));
    const offset = (page - 1) * limit;

    const eId = req.query.eId || req.query.employeeId ? String(req.query.eId || req.query.employeeId) : undefined;
    const cId = req.query.cId || req.query.channelId ? String(req.query.cId || req.query.channelId) : undefined;
    const pId = req.query.pId || req.query.projectId ? String(req.query.pId || req.query.projectId) : undefined;
    const dateParam = req.query.date ? String(req.query.date) : undefined;

    const conditions: any[] = [];
    if (eId) conditions.push(eq(channelRecords.eId, eId));
    if (cId) conditions.push(eq(channelRecords.cId, cId));
    if (pId) conditions.push(eq(channelRecords.pId, pId));
    if (dateParam) conditions.push(eq(channelRecords.date, dateParam));

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const totalCountResult = await (
      whereCondition
        ? db.select({ total: count() }).from(channelRecords).where(whereCondition)
        : db.select({ total: count() }).from(channelRecords)
    );
    const total = Number(totalCountResult[0]?.total || 0);

    const selectedCols = getSelectedColumns(channelRecords, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(channelRecords)
      : db.select().from(channelRecords);

    const data = await (
      whereCondition
        ? query.where(whereCondition).orderBy(desc(channelRecords.createdAt)).limit(limit).offset(offset)
        : query.orderBy(desc(channelRecords.createdAt)).limit(limit).offset(offset)
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
      message: error?.message || "Failed to fetch links",
    });
  }
}

async function getLinkById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Link record ID is required" });
    }

    const selectedCols = getSelectedColumns(channelRecords, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(channelRecords)
      : db.select().from(channelRecords);

    const results = await query.where(eq(channelRecords.id, id)).limit(1);

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: "Link record not found" });
    }

    res.status(200).json({
      success: true,
      data: results[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch link record",
    });
  }
}

async function createLinks(req: Request, res: Response) {
  try {
    const body = req.body;
    const items = Array.isArray(body) ? body : (Array.isArray(body?.links) ? body.links : (Array.isArray(body?.items) ? body.items : [body]));

    if (!items || items.length === 0 || !items[0]) {
      return res.status(400).json({
        success: false,
        message: "Payload cannot be empty",
      });
    }

    const insertRows: (typeof channelRecords.$inferInsert)[] = [];
    const today = new Date().toISOString().split("T")[0];

    for (const item of items) {
      const eId = item.eId || item.employeeId || req.user?.sub;
      const cId = item.cId || item.channelId;
      const pId = item.pId || item.projectId;
      const link = item.link || item.url;
      const date = item.date || today;

      if (!eId || !cId || !pId || !link) {
        return res.status(400).json({
          success: false,
          message: "eId, cId, pId, and link are required for each record",
        });
      }

      insertRows.push({
        eId: String(eId),
        cId: String(cId),
        pId: String(pId),
        date: String(date),
        link: String(link),
      });
    }

    const created = await db.insert(channelRecords).values(insertRows).returning();

    res.status(201).json({
      success: true,
      count: created.length,
      data: Array.isArray(body) || Array.isArray(body?.links) || Array.isArray(body?.items) ? created : created[0],
    });
  } catch (error: any) {
    if (error?.code === "23505" || error?.cause?.code === "23505") {
      return res.status(409).json({ success: false, message: "Link already exists" });
    }
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to create links",
    });
  }
}

async function updateLinkById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Link ID is required" });
    }

    const { eId, employeeId, cId, channelId, pId, projectId, date, link } = req.body || {};

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (eId !== undefined || employeeId !== undefined) updateData.eId = String(eId || employeeId);
    if (cId !== undefined || channelId !== undefined) updateData.cId = String(cId || channelId);
    if (pId !== undefined || projectId !== undefined) updateData.pId = String(pId || projectId);
    if (date !== undefined) updateData.date = String(date);
    if (link !== undefined) updateData.link = String(link);

    const updated = await db
      .update(channelRecords)
      .set(updateData)
      .where(eq(channelRecords.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: "Link record not found" });
    }

    res.status(200).json({
      success: true,
      data: updated[0],
    });
  } catch (error: any) {
    if (error?.code === "23505" || error?.cause?.code === "23505") {
      return res.status(409).json({ success: false, message: "Link already exists" });
    }
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to update link record",
    });
  }
}

async function updateLinks(req: Request, res: Response) {
  try {
    const body = req.body;
    const isBulk = Array.isArray(body) || Array.isArray(body?.links) || Array.isArray(body?.items) || Array.isArray(body?.records);

    if (isBulk) {
      const items = Array.isArray(body) ? body : (body.links || body.items || body.records);
      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: "Bulk update payload cannot be empty" });
      }

      const updatedResults: any[] = [];

      for (const item of items) {
        if (!item.id) {
          continue;
        }

        const updateData: Record<string, any> = {
          updatedAt: new Date(),
        };

        if (item.eId !== undefined || item.employeeId !== undefined) updateData.eId = String(item.eId || item.employeeId);
        if (item.cId !== undefined || item.channelId !== undefined) updateData.cId = String(item.cId || item.channelId);
        if (item.pId !== undefined || item.projectId !== undefined) updateData.pId = String(item.pId || item.projectId);
        if (item.date !== undefined) updateData.date = String(item.date);
        if (item.link !== undefined || item.url !== undefined) updateData.link = String(item.link || item.url);

        const updated = await db
          .update(channelRecords)
          .set(updateData)
          .where(eq(channelRecords.id, String(item.id)))
          .returning();

        if (updated && updated.length > 0) {
          updatedResults.push(updated[0]);
        }
      }

      return res.status(200).json({
        success: true,
        count: updatedResults.length,
        data: updatedResults,
      });
    }

    const { id, eId, employeeId, cId, channelId, pId, projectId, date, link } = body || {};
    if (!id) {
      return res.status(400).json({ success: false, message: "Link ID is required for update" });
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (eId !== undefined || employeeId !== undefined) updateData.eId = String(eId || employeeId);
    if (cId !== undefined || channelId !== undefined) updateData.cId = String(cId || channelId);
    if (pId !== undefined || projectId !== undefined) updateData.pId = String(pId || projectId);
    if (date !== undefined) updateData.date = String(date);
    if (link !== undefined) updateData.link = String(link);

    const updated = await db
      .update(channelRecords)
      .set(updateData)
      .where(eq(channelRecords.id, String(id)))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: "Link record not found" });
    }

    res.status(200).json({
      success: true,
      data: updated[0],
    });
  } catch (error: any) {
    if (error?.code === "23505" || error?.cause?.code === "23505") {
      return res.status(409).json({ success: false, message: "Link already exists" });
    }
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to update links",
    });
  }
}

async function deleteLinkById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Link record ID is required" });
    }

    const deleted = await db
      .delete(channelRecords)
      .where(eq(channelRecords.id, id))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ success: false, message: "Link record not found" });
    }

    res.status(200).json({
      success: true,
      message: "Link record deleted successfully",
      data: deleted[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete link record",
    });
  }
}

async function deleteLinks(req: Request, res: Response) {
  try {
    const paramId = req.params.id ? String(req.params.id) : undefined;
    const bodyId = req.body?.id ? String(req.body.id) : undefined;
    const queryId = req.query.id ? String(req.query.id) : undefined;
    const singleId = paramId || bodyId || queryId;

    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.map(String)
      : (singleId ? [singleId] : undefined);

    if (!ids || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Link record ID(s) required" });
    }

    const deleted = await db
      .delete(channelRecords)
      .where(inArray(channelRecords.id, ids))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ success: false, message: "No link records found to delete" });
    }

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${deleted.length} link record(s)`,
      count: deleted.length,
      data: deleted,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete links",
    });
  }
}

async function getAllChannels(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10) || 20));
    const offset = (page - 1) * limit;

    const eId = req.query.eId || req.query.employeeId ? String(req.query.eId || req.query.employeeId) : undefined;
    const platform = req.query.platform ? String(req.query.platform) as "yt" | "ig" : undefined;
    const includeDeleted = String(req.query.includeDeleted).toLowerCase() === "true";

    const conditions: any[] = [];
    if (eId) conditions.push(eq(channels.eId, eId));
    if (platform) conditions.push(eq(channels.platform, platform));
    if (!includeDeleted) {
      conditions.push(eq(channels.isDeleted, false));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const totalCountResult = await (
      whereCondition
        ? db.select({ total: count() }).from(channels).where(whereCondition)
        : db.select({ total: count() }).from(channels)
    );
    const total = Number(totalCountResult[0]?.total || 0);

    const selectedCols = getSelectedColumns(channels, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(channels)
      : db.select().from(channels);

    const data = await (
      whereCondition
        ? query.where(whereCondition).orderBy(desc(channels.createdAt)).limit(limit).offset(offset)
        : query.orderBy(desc(channels.createdAt)).limit(limit).offset(offset)
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
      message: error?.message || "Failed to fetch channels",
    });
  }
}

async function getChannelById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Channel ID is required" });
    }

    const includeDeleted = String(req.query.includeDeleted).toLowerCase() === "true";
    const whereCondition = includeDeleted
      ? eq(channels.id, id)
      : and(eq(channels.id, id), eq(channels.isDeleted, false));

    const selectedCols = getSelectedColumns(channels, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(channels)
      : db.select().from(channels);

    const results = await query.where(whereCondition).limit(1);

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    res.status(200).json({
      success: true,
      data: results[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch channel",
    });
  }
}

async function createChannel(req: Request, res: Response) {
  try {
    const { eId, employeeId, name, platform, url, isDeleted } = req.body || {};
    const targetEmployeeId = String(eId || employeeId || "");

    if (!targetEmployeeId || targetEmployeeId === "undefined") {
      return res.status(400).json({ success: false, message: "eId (employee ID) is required" });
    }

    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ success: false, message: "Channel URL is required" });
    }

    const emp = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, targetEmployeeId), eq(employees.isDeleted, false)))
      .limit(1);

    if (!emp || emp.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const insertData: typeof channels.$inferInsert = {
      eId: targetEmployeeId,
      name: name ? String(name).trim() : null,
      platform: platform === "yt" || platform === "ig" ? platform : null,
      url: url.trim(),
      isDeleted: isDeleted !== undefined ? Boolean(isDeleted) : false,
    };

    const created = await db.insert(channels).values(insertData).returning();

    res.status(201).json({
      success: true,
      data: created[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to create channel",
    });
  }
}

async function updateChannel(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Channel ID is required" });
    }

    const { eId, employeeId, name, platform, url, isDeleted } = req.body || {};

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (eId !== undefined || employeeId !== undefined) {
      const newEmployeeId = String(eId || employeeId);
      const emp = await db
        .select()
        .from(employees)
        .where(and(eq(employees.id, newEmployeeId), eq(employees.isDeleted, false)))
        .limit(1);

      if (!emp || emp.length === 0) {
        return res.status(404).json({ success: false, message: "Employee not found" });
      }
      updateData.eId = newEmployeeId;
    }

    if (name !== undefined) updateData.name = String(name).trim();
    if (platform !== undefined) {
      updateData.platform = platform === "yt" || platform === "ig" ? platform : null;
    }
    if (url !== undefined) updateData.url = String(url).trim();
    if (isDeleted !== undefined) updateData.isDeleted = Boolean(isDeleted);

    const updated = await db
      .update(channels)
      .set(updateData)
      .where(eq(channels.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    res.status(200).json({
      success: true,
      data: updated[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to update channel",
    });
  }
}

async function deleteChannel(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Channel ID is required" });
    }

    const deleted = await db
      .update(channels)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(channels.id, id))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ success: false, message: "Channel not found" });
    }

    res.status(200).json({
      success: true,
      message: "Channel soft deleted successfully",
      data: deleted[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete channel",
    });
  }
}

router.get("/links/all", getAllLinks);
router.get("/links/:id", getLinkById);
router.get("/links", getAllLinks);
router.post("/links", smmCreateLinksGuard, createLinks);
router.put("/links/:id", updateLinkById);
router.put("/links", updateLinks);
router.delete("/links/:id", deleteLinkById);
router.delete("/links", deleteLinks);

router.get("/all", getAllChannels);
router.get("/:id", getChannelById);
router.get("/", getAllChannels);
router.post("/", createChannel);
router.put("/:id", updateChannel);
router.delete("/:id", deleteChannel);

export default router;
