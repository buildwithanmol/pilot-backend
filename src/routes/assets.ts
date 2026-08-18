import { Router, type Request, type Response } from "express";
import { eq, count, and, desc, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { assets, assetContacts, assetEmails, employees } from "../db/schema.js";
import { getSelectedColumns } from "../utils/query.js";

const router = Router();

async function createAssetContact(req: Request, res: Response) {
  try {
    const body = req.body;
    const items = Array.isArray(body)
      ? body
      : (Array.isArray(body?.contacts) ? body.contacts : [body]);

    if (!items || items.length === 0 || !items[0]) {
      return res.status(400).json({ success: false, message: "Payload cannot be empty" });
    }

    const insertRows: (typeof assetContacts.$inferInsert)[] = [];

    for (const item of items) {
      const aId = item.aId || item.assetId;
      const contact = item.contact;

      if (!aId || !contact) {
        return res.status(400).json({
          success: false,
          message: "aId (asset ID) and contact are required for each entry",
        });
      }

      insertRows.push({
        aId: String(aId),
        contact: String(contact).trim(),
      });
    }

    const created = await db.insert(assetContacts).values(insertRows).returning();

    res.status(201).json({
      success: true,
      count: created.length,
      data: Array.isArray(body) || Array.isArray(body?.contacts) ? created : created[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to create asset contact",
    });
  }
}

async function updateAssetContact(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Contact record ID is required" });
    }

    const { contact, aId, assetId } = req.body || {};

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (contact !== undefined) updateData.contact = String(contact).trim();
    if (aId !== undefined || assetId !== undefined) updateData.aId = String(aId || assetId);

    const updated = await db
      .update(assetContacts)
      .set(updateData)
      .where(eq(assetContacts.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: "Asset contact record not found" });
    }

    res.status(200).json({
      success: true,
      data: updated[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to update asset contact",
    });
  }
}

async function deleteAssetContact(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Contact record ID is required" });
    }

    const deleted = await db
      .delete(assetContacts)
      .where(eq(assetContacts.id, id))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ success: false, message: "Asset contact record not found" });
    }

    res.status(200).json({
      success: true,
      message: "Asset contact deleted successfully",
      data: deleted[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete asset contact",
    });
  }
}

async function createAssetEmail(req: Request, res: Response) {
  try {
    const body = req.body;
    const items = Array.isArray(body)
      ? body
      : (Array.isArray(body?.emails) ? body.emails : [body]);

    if (!items || items.length === 0 || !items[0]) {
      return res.status(400).json({ success: false, message: "Payload cannot be empty" });
    }

    const insertRows: (typeof assetEmails.$inferInsert)[] = [];

    for (const item of items) {
      const aId = item.aId || item.assetId;
      const email = item.email;

      if (!aId || !email) {
        return res.status(400).json({
          success: false,
          message: "aId (asset ID) and email are required for each entry",
        });
      }

      insertRows.push({
        aId: String(aId),
        email: String(email).trim(),
      });
    }

    const created = await db.insert(assetEmails).values(insertRows).returning();

    res.status(201).json({
      success: true,
      count: created.length,
      data: Array.isArray(body) || Array.isArray(body?.emails) ? created : created[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to create asset email",
    });
  }
}

async function updateAssetEmail(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Email record ID is required" });
    }

    const { email, aId, assetId } = req.body || {};

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (email !== undefined) updateData.email = String(email).trim();
    if (aId !== undefined || assetId !== undefined) updateData.aId = String(aId || assetId);

    const updated = await db
      .update(assetEmails)
      .set(updateData)
      .where(eq(assetEmails.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: "Asset email record not found" });
    }

    res.status(200).json({
      success: true,
      data: updated[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to update asset email",
    });
  }
}

async function deleteAssetEmail(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Email record ID is required" });
    }

    const deleted = await db
      .delete(assetEmails)
      .where(eq(assetEmails.id, id))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ success: false, message: "Asset email record not found" });
    }

    res.status(200).json({
      success: true,
      message: "Asset email deleted successfully",
      data: deleted[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete asset email",
    });
  }
}

async function getAllAssets(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10) || 20));
    const offset = (page - 1) * limit;

    const eId = req.query.eId || req.query.employeeId ? String(req.query.eId || req.query.employeeId) : undefined;
    const whereCondition = eId ? eq(assets.eId, eId) : undefined;

    const totalCountResult = await (
      whereCondition
        ? db.select({ total: count() }).from(assets).where(whereCondition)
        : db.select({ total: count() }).from(assets)
    );
    const total = Number(totalCountResult[0]?.total || 0);

    const selectedCols = getSelectedColumns(assets, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(assets)
      : db.select().from(assets);

    const data = await (
      whereCondition
        ? query.where(whereCondition).orderBy(desc(assets.createdAt)).limit(limit).offset(offset)
        : query.orderBy(desc(assets.createdAt)).limit(limit).offset(offset)
    );

    if (data.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    const assetIds = data.map((a: any) => a.id).filter(Boolean);

    let allContacts: (typeof assetContacts.$inferSelect)[] = [];
    let allEmails: (typeof assetEmails.$inferSelect)[] = [];

    if (assetIds.length > 0) {
      [allContacts, allEmails] = await Promise.all([
        db.select().from(assetContacts).where(inArray(assetContacts.aId, assetIds)),
        db.select().from(assetEmails).where(inArray(assetEmails.aId, assetIds)),
      ]);
    }

    const contactMap = new Map<string, any[]>();
    for (const c of allContacts) {
      if (!contactMap.has(c.aId)) contactMap.set(c.aId, []);
      contactMap.get(c.aId)!.push(c);
    }

    const emailMap = new Map<string, any[]>();
    for (const em of allEmails) {
      if (!emailMap.has(em.aId)) emailMap.set(em.aId, []);
      emailMap.get(em.aId)!.push(em);
    }

    const populatedData = data.map((assetItem: any) => ({
      ...assetItem,
      contacts: contactMap.get(assetItem.id) || [],
      emails: emailMap.get(assetItem.id) || [],
    }));

    res.status(200).json({
      success: true,
      data: populatedData,
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
      message: error?.message || "Failed to fetch assets",
    });
  }
}

async function getAssetById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Asset ID is required" });
    }

    const selectedCols = getSelectedColumns(assets, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(assets)
      : db.select().from(assets);

    const results = await query.where(eq(assets.id, id)).limit(1);

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: "Asset not found" });
    }

    const [contactsList, emailsList] = await Promise.all([
      db.select().from(assetContacts).where(eq(assetContacts.aId, id)),
      db.select().from(assetEmails).where(eq(assetEmails.aId, id)),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...results[0],
        contacts: contactsList,
        emails: emailsList,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch asset",
    });
  }
}

async function createAsset(req: Request, res: Response) {
  try {
    const { eId, employeeId, model, imei1, imei2, contacts: initialContacts, emails: initialEmails } = req.body || {};
    const targetEmployeeId = String(eId || employeeId || "");

    if (!targetEmployeeId || targetEmployeeId === "undefined") {
      return res.status(400).json({ success: false, message: "eId (employee ID) is required" });
    }

    if (!model || typeof model !== "string" || !model.trim()) {
      return res.status(400).json({ success: false, message: "Asset model is required" });
    }

    const emp = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, targetEmployeeId), eq(employees.isDeleted, false)))
      .limit(1);

    if (!emp || emp.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const insertData: typeof assets.$inferInsert = {
      eId: targetEmployeeId,
      model: model.trim(),
      imei1: imei1 ? String(imei1).trim() : null,
      imei2: imei2 ? String(imei2).trim() : null,
    };

    const created = await db.insert(assets).values(insertData).returning();
    const createdAsset = created[0];

    let createdContacts: any[] = [];
    if (Array.isArray(initialContacts) && initialContacts.length > 0) {
      const contactRows = initialContacts
        .map((c: any) => (typeof c === "string" ? c : c?.contact))
        .filter(Boolean)
        .map((c: string) => ({
          aId: createdAsset.id,
          contact: String(c).trim(),
        }));

      if (contactRows.length > 0) {
        createdContacts = await db.insert(assetContacts).values(contactRows).returning();
      }
    }

    let createdEmails: any[] = [];
    if (Array.isArray(initialEmails) && initialEmails.length > 0) {
      const emailRows = initialEmails
        .map((em: any) => (typeof em === "string" ? em : em?.email))
        .filter(Boolean)
        .map((em: string) => ({
          aId: createdAsset.id,
          email: String(em).trim(),
        }));

      if (emailRows.length > 0) {
        createdEmails = await db.insert(assetEmails).values(emailRows).returning();
      }
    }

    res.status(201).json({
      success: true,
      data: {
        ...createdAsset,
        contacts: createdContacts,
        emails: createdEmails,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to create asset",
    });
  }
}

async function updateAsset(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Asset ID is required" });
    }

    const { eId, employeeId, model, imei1, imei2 } = req.body || {};

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

    if (model !== undefined) updateData.model = String(model).trim();
    if (imei1 !== undefined) updateData.imei1 = imei1 ? String(imei1).trim() : null;
    if (imei2 !== undefined) updateData.imei2 = imei2 ? String(imei2).trim() : null;

    const updated = await db
      .update(assets)
      .set(updateData)
      .where(eq(assets.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: "Asset not found" });
    }

    const [contactsList, emailsList] = await Promise.all([
      db.select().from(assetContacts).where(eq(assetContacts.aId, id)),
      db.select().from(assetEmails).where(eq(assetEmails.aId, id)),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...updated[0],
        contacts: contactsList,
        emails: emailsList,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to update asset",
    });
  }
}

async function deleteAsset(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Asset ID is required" });
    }

    const deleted = await db
      .delete(assets)
      .where(eq(assets.id, id))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ success: false, message: "Asset not found" });
    }

    res.status(200).json({
      success: true,
      message: "Asset deleted successfully",
      data: deleted[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete asset",
    });
  }
}

router.post("/contacts", createAssetContact);
router.put("/contacts/:id", updateAssetContact);
router.delete("/contacts/:id", deleteAssetContact);

router.post("/emails", createAssetEmail);
router.put("/emails/:id", updateAssetEmail);
router.delete("/emails/:id", deleteAssetEmail);

router.get("/all", getAllAssets);
router.get("/:id", getAssetById);
router.get("/", getAllAssets);
router.post("/", createAsset);
router.put("/:id", updateAsset);
router.delete("/:id", deleteAsset);

export default router;
