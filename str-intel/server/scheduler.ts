/**
 * Scheduler Module — Cron-based automated data refresh for STR intelligence.
 * Supports daily, weekly, bi-weekly, and monthly schedules.
 * Integrates with the scraper orchestrator for automated data collection.
 */
import cron from "node-cron";
import { getOrchestrator } from "./scrapers/orchestrator";

type Frequency = "daily" | "weekly" | "biweekly" | "monthly";

interface SchedulerStatus {
  isRunning: boolean;
  frequency: Frequency | null;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  lastRunResult: {
    totalListings: number;
    totalErrors: number;
    duration: number;
  } | null;
  totalRuns: number;
}

// Cron expressions for each frequency
// All scheduled for 2:00 AM AST (23:00 UTC, since AST = UTC+3)
const CRON_EXPRESSIONS: Record<Frequency, string> = {
  daily: "0 23 * * *",       // Every day at 2:00 AM AST
  weekly: "0 23 * * 1",      // Every Monday at 2:00 AM AST
  biweekly: "0 23 1,15 * *", // 1st and 15th of each month at 2:00 AM AST
  monthly: "0 23 1 * *",     // 1st of each month at 2:00 AM AST
};

export class Scheduler {
  private task: ReturnType<typeof cron.schedule> | null = null;
  private status: SchedulerStatus = {
    isRunning: false,
    frequency: null,
    lastRunAt: null,
    nextRunAt: null,
    lastRunResult: null,
    totalRuns: 0,
  };

  start(frequency: Frequency = "weekly"): void {
    // Stop existing task if any
    this.stop();

    const cronExpression = CRON_EXPRESSIONS[frequency];
    console.log(`[Scheduler] Starting ${frequency} schedule: ${cronExpression}`);

    this.task = cron.schedule(cronExpression, async () => {
      await this.runJob();
    }, {
      timezone: "Asia/Riyadh",
    });

    this.status.isRunning = true;
    this.status.frequency = frequency;
    this.status.nextRunAt = this.calculateNextRun(frequency);

    console.log(`[Scheduler] ✓ Scheduled ${frequency} scrape jobs. Next run: ${this.status.nextRunAt?.toISOString()}`);
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    this.status.isRunning = false;
    this.status.nextRunAt = null;
    console.log("[Scheduler] Stopped");
  }

  async runJob(): Promise<void> {
    console.log("[Scheduler] Starting scheduled scrape job...");
    const startTime = Date.now();

    try {
      const orchestrator = getOrchestrator();
      const result = await orchestrator.runScrapeJob({
        jobType: "full_scan",
      });

      this.status.lastRunAt = new Date();
      this.status.lastRunResult = {
        totalListings: result.totalListings,
        totalErrors: result.totalErrors,
        duration: result.duration,
      };
      this.status.totalRuns++;

      if (this.status.frequency) {
        this.status.nextRunAt = this.calculateNextRun(this.status.frequency);
      }

      console.log(`[Scheduler] ✓ Job completed: ${result.totalListings} listings, ${result.totalErrors} errors, ${result.duration}ms`);
    } catch (error) {
      console.error("[Scheduler] ✗ Job failed:", error);
      this.status.lastRunAt = new Date();
      this.status.lastRunResult = {
        totalListings: 0,
        totalErrors: 1,
        duration: Date.now() - startTime,
      };
    }
  }

  getStatus(): SchedulerStatus {
    return { ...this.status };
  }

  private calculateNextRun(frequency: Frequency): Date {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case "daily":
        next.setDate(next.getDate() + 1);
        next.setHours(2, 0, 0, 0); // 2:00 AM AST
        break;
      case "weekly":
        // Next Monday
        const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
        next.setDate(next.getDate() + daysUntilMonday);
        next.setHours(2, 0, 0, 0);
        break;
      case "biweekly":
        // Next 1st or 15th
        if (next.getDate() < 15) {
          next.setDate(15);
        } else {
          next.setMonth(next.getMonth() + 1);
          next.setDate(1);
        }
        next.setHours(2, 0, 0, 0);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(2, 0, 0, 0);
        break;
    }

    return next;
  }
}

// Singleton
let _scheduler: Scheduler | null = null;

export function getScheduler(): Scheduler {
  if (!_scheduler) {
    _scheduler = new Scheduler();
  }
  return _scheduler;
}
