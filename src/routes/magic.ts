import { Router, type Request, type Response } from "express";
import puppeteer from "puppeteer";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { channels, employees } from "../db/schema.js";

const router = Router();

async function scrapeEmployeeChannelsStream(req: Request, res: Response) {
  const startTime = Date.now();
  let isCancelled = false;

  req.on("close", () => {
    isCancelled = true;
  });

  try {
    const rawEmployeeId = req.params.e_id || req.params.employeeId || req.params.id;
    const employeeId = String(rawEmployeeId || "").trim();

    if (!employeeId || employeeId === "undefined") {
      return res.status(400).json({ success: false, message: "e_id (employee UUID) is required" });
    }

    let platformParam = req.params.platform || req.query.platform;
    if (!platformParam) {
      if (req.originalUrl?.includes("/ig") || req.path?.endsWith("/ig")) {
        platformParam = "ig";
      } else if (req.originalUrl?.includes("/yt") || req.path?.endsWith("/yt")) {
        platformParam = "yt";
      }
    }
    const platform = String(platformParam || "yt").toLowerCase() === "ig" ? "ig" : "yt";
    const limit = Math.max(1, Math.min(50, parseInt(String(req.query.limit || req.body?.limit || "4"), 10) || 4));

    const emp = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        email: employees.email,
        role: employees.role,
      })
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.isDeleted, false)))
      .limit(1);

    if (!emp || emp.length === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const employee = emp[0];

    const employeeChannels = await db
      .select()
      .from(channels)
      .where(
        and(
          eq(channels.eId, employeeId),
          eq(channels.platform, platform as "yt" | "ig"),
          eq(channels.isDeleted, false)
        )
      );

    const isStream = req.query.stream !== "false";

    if (isStream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      if (typeof (res as any).flushHeaders === "function") {
        (res as any).flushHeaders();
      }
    }

    if (employeeChannels.length === 0) {
      const emptyPayload = {
        success: true,
        summary: {
          employeeId: employee.id,
          employeeName: [employee.firstName, employee.lastName].filter(Boolean).join(" "),
          employeeEmail: employee.email,
          platform,
          totalChannels: 0,
          limitPerChannel: limit,
          totalShortsFound: 0,
          timestamp: new Date().toISOString(),
        },
        data: [],
      };

      if (isStream) {
        res.write(`data: ${JSON.stringify({ event: "complete", ...emptyPayload })}\n\n`);
        return res.end();
      }
      return res.status(200).json(emptyPayload);
    }

    const BATCH_SIZE = 5;
    const batches: (typeof channels.$inferSelect)[][] = [];
    for (let i = 0; i < employeeChannels.length; i += BATCH_SIZE) {
      batches.push(employeeChannels.slice(i, i + BATCH_SIZE));
    }

    if (isStream) {
      res.write(
        `data: ${JSON.stringify({
          event: "start",
          summary: {
            employeeId: employee.id,
            employeeName: [employee.firstName, employee.lastName].filter(Boolean).join(" "),
            employeeEmail: employee.email,
            platform,
            totalChannels: employeeChannels.length,
            totalBatches: batches.length,
            batchSize: BATCH_SIZE,
            limitPerChannel: limit,
            timestamp: new Date().toISOString(),
          },
        })}\n\n`
      );
    }

    const allChannelReports: any[] = [];
    let completedCount = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      if (isCancelled) {
        break;
      }

      const batch = batches[batchIndex];
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-features=IsolateOrigins,site-per-process",
          "--blink-settings=imagesEnabled=true",
        ],
      });

      try {
        for (const chan of batch) {
          if (isCancelled) {
            break;
          }

          const page = await browser.newPage();
          try {
            await page.setViewport({ width: 1280, height: 800 });
            await page.setUserAgent(
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            );

            let targetUrl = chan.url.trim();
            try {
              const parsedUrl = new URL(targetUrl);
              if (platform === "yt" && !parsedUrl.pathname.includes("/shorts")) {
                parsedUrl.pathname = `${parsedUrl.pathname.replace(/\/+$/, "")}/shorts`;
                targetUrl = parsedUrl.toString();
              } else if (platform === "ig" && !parsedUrl.pathname.includes("/reels")) {
                parsedUrl.pathname = `${parsedUrl.pathname.replace(/\/+$/, "")}/reels`;
                targetUrl = parsedUrl.toString();
              }
            } catch {
              if (platform === "yt" && !targetUrl.includes("/shorts")) {
                targetUrl = `${targetUrl.replace(/\/+$/, "")}/shorts`;
              } else if (platform === "ig" && !targetUrl.includes("/reels")) {
                targetUrl = `${targetUrl.replace(/\/+$/, "")}/reels`;
              }
            }

            await page.goto(targetUrl, {
              waitUntil: "networkidle2",
              timeout: 25000,
            }).catch(async () => {
              await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
            });

            try {
              const feedbackButton = await page.$(
                "yt-touch-feedback-shape, .ytSpecTouchFeedbackShapeHost, tp-yt-paper-tab[tab-title='Shorts'], a[href*='/shorts']"
              );
              if (feedbackButton) {
                await feedbackButton.click().catch(() => {});
              }
            } catch {
            }

            await page
              .waitForSelector("a[href*='/shorts/'], a[href*='/reel/'], .shortsLockupViewModelHostEndpoint", {
                timeout: 6000,
              })
              .catch(() => {});

            const extractedShorts = await page.evaluate((maxCount) => {
              const anchors = Array.from(
                document.querySelectorAll(
                  "a.shortsLockupViewModelHostEndpoint, a.reel-item-endpoint, a[href*='/shorts/'], a[href*='/reel/'], ytd-rich-item-renderer a[href^='/shorts/']"
                )
              );

              const uniqueKeys = new Set<string>();
              const items: any[] = [];

              for (const a of anchors) {
                const href = a.getAttribute("href") || "";
                const ytMatch = href.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
                const igMatch = href.match(/\/reel\/([a-zA-Z0-9_-]+)/);
                const key = ytMatch ? ytMatch[1] : igMatch ? igMatch[1] : null;

                if (key && !uniqueKeys.has(key)) {
                  uniqueKeys.add(key);
                  const img = a.querySelector("img");
                  const titleEl = a.querySelector("h3, span#video-title, .yt-core-attributed-string, [title]");
                  const title =
                    titleEl?.textContent?.trim() ||
                    a.getAttribute("title") ||
                    a.getAttribute("aria-label") ||
                    "";
                  const thumb = img?.getAttribute("src") || img?.getAttribute("data-src") || null;

                  items.push({
                    shortId: key,
                    url: ytMatch
                      ? `https://www.youtube.com/shorts/${key}`
                      : `https://www.instagram.com/reel/${key}/`,
                    title,
                    thumbnail: thumb,
                  });

                  if (items.length >= maxCount) {
                    break;
                  }
                }
              }

              return items;
            }, limit);

            const reportItem = {
              channelId: chan.id,
              channelName: chan.name || "Untitled Channel",
              channelUrl: chan.url,
              platform: chan.platform,
              shortsCount: extractedShorts.length,
              shorts: extractedShorts,
            };

            allChannelReports.push(reportItem);
            completedCount++;

            if (isStream && !isCancelled) {
              res.write(
                `data: ${JSON.stringify({
                  event: "channel_scraped",
                  progress: {
                    completed: completedCount,
                    total: employeeChannels.length,
                    percentage: Number(((completedCount / employeeChannels.length) * 100).toFixed(1)),
                    batchIndex: batchIndex + 1,
                    totalBatches: batches.length,
                  },
                  channel: reportItem,
                })}\n\n`
              );
            }
          } catch (pageErr: any) {
            const errorReportItem = {
              channelId: chan.id,
              channelName: chan.name || "Untitled Channel",
              channelUrl: chan.url,
              platform: chan.platform,
              shortsCount: 0,
              shorts: [],
              error: pageErr?.message || "Failed to scrape channel",
            };

            allChannelReports.push(errorReportItem);
            completedCount++;

            if (isStream && !isCancelled) {
              res.write(
                `data: ${JSON.stringify({
                  event: "channel_error",
                  progress: {
                    completed: completedCount,
                    total: employeeChannels.length,
                    percentage: Number(((completedCount / employeeChannels.length) * 100).toFixed(1)),
                    batchIndex: batchIndex + 1,
                    totalBatches: batches.length,
                  },
                  channel: errorReportItem,
                })}\n\n`
              );
            }
          } finally {
            await page.close().catch(() => {});
          }
        }
      } finally {
        await browser.close().catch(() => {});
      }
    }

    const totalShortsFound = allChannelReports.reduce((acc, c) => acc + (c.shortsCount || 0), 0);
    const durationSeconds = Number(((Date.now() - startTime) / 1000).toFixed(1));

    const finalSummary = {
      employeeId: employee.id,
      employeeName: [employee.firstName, employee.lastName].filter(Boolean).join(" "),
      employeeEmail: employee.email,
      platform,
      totalChannels: employeeChannels.length,
      totalBatches: batches.length,
      batchSize: BATCH_SIZE,
      limitPerChannel: limit,
      totalShortsFound,
      durationSeconds,
      timestamp: new Date().toISOString(),
    };

    if (isStream) {
      if (!isCancelled) {
        res.write(
          `data: ${JSON.stringify({
            event: "complete",
            summary: finalSummary,
            data: allChannelReports,
          })}\n\n`
        );
        res.end();
      }
    } else {
      res.status(200).json({
        success: true,
        summary: finalSummary,
        data: allChannelReports,
      });
    }
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error?.message || "Failed to execute magic scraping",
      });
    } else {
      res.write(
        `data: ${JSON.stringify({
          event: "error",
          message: error?.message || "Streaming failed unexpectedly",
        })}\n\n`
      );
      res.end();
    }
  }
}

router.get("/:e_id/:platform", scrapeEmployeeChannelsStream);
router.post("/:e_id/:platform", scrapeEmployeeChannelsStream);

router.get("/:e_id", scrapeEmployeeChannelsStream);
router.post("/:e_id", scrapeEmployeeChannelsStream);

export default router;
