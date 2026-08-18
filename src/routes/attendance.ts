import { Router, type Request, type Response } from "express";
import { eq, count, and, desc, gte, lte, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { attendance, employees, channels, channelRecords, settings } from "../db/schema.js";
import { getSelectedColumns } from "../utils/query.js";

const router = Router();

function getDatesInRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const current = new Date(startStr);
  const end = new Date(endStr);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

async function syncAttendance(req: Request, res: Response) {
  try {
    const queryOrBody = { ...req.query, ...req.body };
    const today = new Date().toISOString().split("T")[0];

    const startDateStr = String(queryOrBody.startDate || queryOrBody.start || today);
    const endDateStr = String(queryOrBody.endDate || queryOrBody.end || startDateStr);
    const targetEmployeeId = queryOrBody.eId || queryOrBody.employeeId ? String(queryOrBody.eId || queryOrBody.employeeId) : undefined;
    const minThresholdPercentage = Math.max(1, Math.min(100, parseFloat(String(queryOrBody.minThresholdPercentage || "80")) || 80));
    const saveToDb = queryOrBody.saveToDb !== undefined ? String(queryOrBody.saveToDb).toLowerCase() !== "false" : true;

    const dates = getDatesInRange(startDateStr, endDateStr);
    if (dates.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid date range" });
    }

    const settingsRes = await db.select().from(settings).orderBy(desc(settings.createdAt)).limit(1);
    const smmChannelLimit = settingsRes[0]?.smmChannelLimit ?? 4;

    const empConditions = [
      eq(employees.role, "smm"),
      eq(employees.isDeleted, false),
    ];
    if (targetEmployeeId) {
      empConditions.push(eq(employees.id, targetEmployeeId));
    }

    const smmEmployees = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        email: employees.email,
      })
      .from(employees)
      .where(and(...empConditions));

    if (smmEmployees.length === 0) {
      return res.status(404).json({ success: false, message: "No active SMM employees found" });
    }

    const smmIds = smmEmployees.map((e) => e.id);

    const channelCounts = await db
      .select({
        eId: channels.eId,
        totalChannels: count(),
      })
      .from(channels)
      .where(and(inArray(channels.eId, smmIds), eq(channels.isDeleted, false)))
      .groupBy(channels.eId);

    const channelMap = new Map<string, number>();
    for (const row of channelCounts) {
      channelMap.set(row.eId, Number(row.totalChannels || 0));
    }

    const recordCounts = await db
      .select({
        eId: channelRecords.eId,
        date: channelRecords.date,
        totalLinks: count(),
      })
      .from(channelRecords)
      .where(
        and(
          inArray(channelRecords.eId, smmIds),
          gte(channelRecords.date, dates[0]),
          lte(channelRecords.date, dates[dates.length - 1])
        )
      )
      .groupBy(channelRecords.eId, channelRecords.date);

    const linkCountMap = new Map<string, number>();
    for (const row of recordCounts) {
      const dateKey = typeof row.date === "string" ? row.date : new Date(row.date).toISOString().split("T")[0];
      linkCountMap.set(`${row.eId}|${dateKey}`, Number(row.totalLinks || 0));
    }

    const existingAttendance = await db
      .select()
      .from(attendance)
      .where(
        and(
          inArray(attendance.eId, smmIds),
          gte(attendance.date, dates[0]),
          lte(attendance.date, dates[dates.length - 1])
        )
      );

    const existingAttendanceMap = new Map<string, typeof attendance.$inferSelect>();
    for (const att of existingAttendance) {
      const dateKey = typeof att.date === "string" ? att.date : new Date(att.date).toISOString().split("T")[0];
      existingAttendanceMap.set(`${att.eId}|${dateKey}`, att);
    }

    const report: any[] = [];
    const upsertRows: { eId: string; date: string; status: "present" | "absent"; reason: string; id?: string }[] = [];

    for (const emp of smmEmployees) {
      const assignedChannels = channelMap.get(emp.id) || 0;
      const targetLinksPerDay = assignedChannels * smmChannelLimit;
      const minRequiredLinks = Math.ceil(targetLinksPerDay * (minThresholdPercentage / 100));

      for (const dateStr of dates) {
        const actualUploadedLinks = linkCountMap.get(`${emp.id}|${dateStr}`) || 0;
        const completionPercentage = targetLinksPerDay > 0
          ? Number(((actualUploadedLinks / targetLinksPerDay) * 100).toFixed(1))
          : 0;

        let status: "present" | "absent" = "absent";
        let reason = "";

        if (assignedChannels === 0) {
          status = "absent";
          reason = "No active channels assigned";
        } else if (actualUploadedLinks >= minRequiredLinks) {
          status = "present";
          reason = `Uploaded ${actualUploadedLinks}/${targetLinksPerDay} links (${completionPercentage}% of target)`;
        } else {
          status = "absent";
          reason = `Insufficient uploads: ${actualUploadedLinks}/${targetLinksPerDay} links (${completionPercentage}% - below ${minThresholdPercentage}% threshold)`;
        }

        const existingRecord = existingAttendanceMap.get(`${emp.id}|${dateStr}`);

        const itemReport: Record<string, any> = {
          eId: emp.id,
          employeeName: [emp.firstName, emp.lastName].filter(Boolean).join(" "),
          employeeEmail: emp.email,
          date: dateStr,
          assignedChannels,
          smmChannelLimit,
          targetLinksPerDay,
          minRequiredLinks,
          actualUploadedLinks,
          completionPercentage,
          status: existingRecord?.edited ? existingRecord.status : status,
          reason: existingRecord?.edited ? `[Manual Override] ${existingRecord.reason || ""}` : reason,
          edited: existingRecord?.edited ?? false,
          attendanceId: existingRecord?.id ?? null,
        };

        report.push(itemReport);

        if (saveToDb && (!existingRecord || !existingRecord.edited)) {
          upsertRows.push({
            id: existingRecord?.id,
            eId: emp.id,
            date: dateStr,
            status,
            reason,
          });
        }
      }
    }

    if (saveToDb && upsertRows.length > 0) {
      for (const row of upsertRows) {
        if (row.id) {
          await db
            .update(attendance)
            .set({
              status: row.status,
              reason: row.reason,
              updatedAt: new Date(),
            })
            .where(eq(attendance.id, row.id));
        } else {
          const inserted = await db
            .insert(attendance)
            .values({
              eId: row.eId,
              date: row.date,
              status: row.status,
              reason: row.reason,
              edited: false,
            })
            .returning();

          const matchingReportItem = report.find(
            (r) => r.eId === row.eId && r.date === row.date
          );
          if (matchingReportItem && inserted[0]) {
            matchingReportItem.attendanceId = inserted[0].id;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        totalSmmEmployees: smmEmployees.length,
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        totalDays: dates.length,
        smmChannelLimit,
        minThresholdPercentage,
        savedToDb: saveToDb,
      },
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to sync attendance",
    });
  }
}

async function getAllAttendance(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "20"), 10) || 20));
    const offset = (page - 1) * limit;

    const eId = req.query.eId || req.query.employeeId ? String(req.query.eId || req.query.employeeId) : undefined;
    const dateParam = req.query.date ? String(req.query.date) : undefined;
    const startDateParam = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDateParam = req.query.endDate ? String(req.query.endDate) : undefined;
    const statusParam = req.query.status ? String(req.query.status) as "present" | "absent" : undefined;
    const editedParam = req.query.edited;

    const conditions: any[] = [];
    if (eId) conditions.push(eq(attendance.eId, eId));
    if (dateParam) conditions.push(eq(attendance.date, dateParam));
    if (startDateParam) conditions.push(gte(attendance.date, startDateParam));
    if (endDateParam) conditions.push(lte(attendance.date, endDateParam));
    if (statusParam) conditions.push(eq(attendance.status, statusParam));
    if (editedParam !== undefined) conditions.push(eq(attendance.edited, String(editedParam).toLowerCase() === "true"));

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const totalCountResult = await (
      whereCondition
        ? db.select({ total: count() }).from(attendance).where(whereCondition)
        : db.select({ total: count() }).from(attendance)
    );
    const total = Number(totalCountResult[0]?.total || 0);

    const selectedCols = getSelectedColumns(attendance, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(attendance)
      : db.select().from(attendance);

    const data = await (
      whereCondition
        ? query.where(whereCondition).orderBy(desc(attendance.date), desc(attendance.createdAt)).limit(limit).offset(offset)
        : query.orderBy(desc(attendance.date), desc(attendance.createdAt)).limit(limit).offset(offset)
    );

    const eIds = Array.from(new Set(data.map((a: any) => a.eId).filter(Boolean)));
    let empList: (typeof employees.$inferSelect)[] = [];
    if (eIds.length > 0) {
      empList = await db.select().from(employees).where(inArray(employees.id, eIds));
    }
    const empMap = new Map<string, typeof employees.$inferSelect>();
    for (const e of empList) {
      empMap.set(e.id, e);
    }

    const populatedData = data.map((item: any) => {
      const emp = empMap.get(item.eId);
      return {
        ...item,
        employee: emp
          ? {
              id: emp.id,
              firstName: emp.firstName,
              lastName: emp.lastName,
              email: emp.email,
              role: emp.role,
            }
          : null,
      };
    });

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
      message: error?.message || "Failed to fetch attendance",
    });
  }
}

async function getAttendanceById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Attendance ID is required" });
    }

    const selectedCols = getSelectedColumns(attendance, req.query.fields);

    const query = selectedCols
      ? db.select(selectedCols).from(attendance)
      : db.select().from(attendance);

    const results = await query.where(eq(attendance.id, id)).limit(1);

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    const attRecord: any = results[0];
    let employeeData = null;
    if (attRecord.eId) {
      const empRes = await db.select().from(employees).where(eq(employees.id, attRecord.eId)).limit(1);
      if (empRes && empRes.length > 0) {
        employeeData = {
          id: empRes[0].id,
          firstName: empRes[0].firstName,
          lastName: empRes[0].lastName,
          email: empRes[0].email,
          role: empRes[0].role,
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...attRecord,
        employee: employeeData,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch attendance record",
    });
  }
}

async function createAttendance(req: Request, res: Response) {
  try {
    const { eId, employeeId, date, status, reason } = req.body || {};
    const targetEmployeeId = String(eId || employeeId || "");

    if (!targetEmployeeId || targetEmployeeId === "undefined") {
      return res.status(400).json({ success: false, message: "eId (employee ID) is required" });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required" });
    }

    if (!status || (status !== "present" && status !== "absent")) {
      return res.status(400).json({ success: false, message: "Status must be 'present' or 'absent'" });
    }

    const emp = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, targetEmployeeId), eq(employees.isDeleted, false)))
      .limit(1);

    if (!emp || emp.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const created = await db
      .insert(attendance)
      .values({
        eId: targetEmployeeId,
        date: String(date),
        status: status as "present" | "absent",
        reason: reason ? String(reason).trim() : null,
        edited: true,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: created[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to create attendance record",
    });
  }
}

async function updateAttendance(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Attendance ID is required" });
    }

    const { status, reason, date, eId, employeeId } = req.body || {};

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
      edited: true,
    };

    if (status !== undefined) {
      if (status !== "present" && status !== "absent") {
        return res.status(400).json({ success: false, message: "Status must be 'present' or 'absent'" });
      }
      updateData.status = status;
    }
    if (reason !== undefined) updateData.reason = reason ? String(reason).trim() : null;
    if (date !== undefined) updateData.date = String(date);
    if (eId !== undefined || employeeId !== undefined) {
      const newEmployeeId = String(eId || employeeId);
      const emp = await db.select().from(employees).where(eq(employees.id, newEmployeeId)).limit(1);
      if (!emp || emp.length === 0) {
        return res.status(404).json({ success: false, message: "Employee not found" });
      }
      updateData.eId = newEmployeeId;
    }

    const updated = await db
      .update(attendance)
      .set(updateData)
      .where(eq(attendance.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    res.status(200).json({
      success: true,
      data: updated[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to update attendance record",
    });
  }
}

async function deleteAttendance(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    if (!id || id === "undefined") {
      return res.status(400).json({ success: false, message: "Attendance ID is required" });
    }

    const deleted = await db
      .delete(attendance)
      .where(eq(attendance.id, id))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully",
      data: deleted[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete attendance record",
    });
  }
}

router.get("/sync", syncAttendance);
router.post("/sync", syncAttendance);

router.get("/all", getAllAttendance);
router.get("/:id", getAttendanceById);
router.get("/", getAllAttendance);
router.post("/", createAttendance);
router.put("/:id", updateAttendance);
router.delete("/:id", deleteAttendance);

export default router;
