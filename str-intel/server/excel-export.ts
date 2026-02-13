/**
 * Excel Export Module — Generates professionally formatted .xlsx workbooks
 * with multiple sheets for different data views.
 */
import ExcelJS from "exceljs";
import { getDb } from "./db";
import { listings, priceSnapshots, metrics, competitors, neighborhoods, otaSources, seasonalPatterns } from "../drizzle/schema";
import { eq, and, sql, asc, desc, gte, lte, inArray } from "drizzle-orm";

// Brand colors
const BRAND_PRIMARY = "0D9488"; // Teal
const BRAND_DARK = "1A1A2E";
const BRAND_HEADER = "115E59";
const BRAND_LIGHT = "F0FDFA";
const BRAND_BORDER = "2DD4BF";

interface ExportParams {
  neighborhoodIds?: number[];
  propertyTypes?: string[];
  dateFrom?: string;
  dateTo?: string;
  includeListings?: boolean;
  includeMetrics?: boolean;
  includeCompetitors?: boolean;
  includeSeasonalPatterns?: boolean;
  includePriceSnapshots?: boolean;
}

export async function generateExcelReport(params: ExportParams): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CoBNB KSA — Market Intelligence";
  workbook.created = new Date();
  workbook.modified = new Date();

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Load reference data
  const allNeighborhoods = await db.select().from(neighborhoods).orderBy(asc(neighborhoods.name));
  const allOtas = await db.select().from(otaSources).orderBy(asc(otaSources.name));
  const nbMap = Object.fromEntries(allNeighborhoods.map(n => [n.id, n.name]));
  const otaMap = Object.fromEntries(allOtas.map(o => [o.id, o.name]));

  // ─── Summary Sheet ───
  await addSummarySheet(workbook, db, nbMap, params);

  // ─── Metrics Sheet ───
  if (params.includeMetrics !== false) {
    await addMetricsSheet(workbook, db, nbMap, params);
  }

  // ─── Listings Sheet ───
  if (params.includeListings !== false) {
    await addListingsSheet(workbook, db, nbMap, otaMap, params);
  }

  // ─── Competitors Sheet ───
  if (params.includeCompetitors !== false) {
    await addCompetitorsSheet(workbook, db, otaMap);
  }

  // ─── Price Snapshots Sheet ───
  if (params.includePriceSnapshots !== false) {
    await addPriceSnapshotsSheet(workbook, db, nbMap, params);
  }

  // ─── Seasonal Patterns Sheet ───
  if (params.includeSeasonalPatterns !== false) {
    await addSeasonalSheet(workbook, db);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function styleHeaderRow(sheet: ExcelJS.Worksheet, colCount: number): void {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Calibri" };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: `FF${BRAND_HEADER}` },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRow.height = 28;

  for (let i = 1; i <= colCount; i++) {
    const cell = headerRow.getCell(i);
    cell.border = {
      bottom: { style: "medium", color: { argb: `FF${BRAND_BORDER}` } },
    };
  }
}

function styleDataRows(sheet: ExcelJS.Worksheet, startRow: number, endRow: number, colCount: number): void {
  for (let r = startRow; r <= endRow; r++) {
    const row = sheet.getRow(r);
    row.font = { size: 10, name: "Calibri" };
    row.alignment = { vertical: "middle" };

    if (r % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${BRAND_LIGHT}` },
      };
    }

    for (let c = 1; c <= colCount; c++) {
      row.getCell(c).border = {
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    }
  }
}

async function addSummarySheet(
  workbook: ExcelJS.Workbook,
  db: any,
  nbMap: Record<number, string>,
  params: ExportParams
): Promise<void> {
  const sheet = workbook.addWorksheet("Summary", {
    properties: { tabColor: { argb: `FF${BRAND_PRIMARY}` } },
  });

  // Title
  sheet.mergeCells("A1:F1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "CoBNB KSA — STR Market Intelligence Report";
  titleCell.font = { bold: true, size: 16, color: { argb: `FF${BRAND_HEADER}` }, name: "Calibri" };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 40;

  sheet.mergeCells("A2:F2");
  const subtitleCell = sheet.getCell("A2");
  subtitleCell.value = `Riyadh Short-Term Rental Market | Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
  subtitleCell.font = { size: 11, color: { argb: "FF6B7280" }, name: "Calibri" };
  subtitleCell.alignment = { horizontal: "center" };
  sheet.getRow(2).height = 24;

  // KPI Summary
  sheet.getCell("A4").value = "Key Performance Indicators";
  sheet.getCell("A4").font = { bold: true, size: 13, color: { argb: `FF${BRAND_HEADER}` } };

  const [totalListings] = await db.select({ count: sql`COUNT(*)` }).from(listings).where(eq(listings.isActive, true));
  const [avgRating] = await db.select({ avg: sql`AVG(CAST(rating AS DECIMAL(3,2)))` }).from(listings).where(eq(listings.isActive, true));

  const latestMetrics = await db.select().from(metrics)
    .where(eq(metrics.propertyType, "all"))
    .orderBy(desc(metrics.metricDate))
    .limit(8);

  const avgAdr = latestMetrics.length > 0 ? latestMetrics.reduce((s: number, m: any) => s + Number(m.adr || 0), 0) / latestMetrics.length : 0;
  const avgOcc = latestMetrics.length > 0 ? latestMetrics.reduce((s: number, m: any) => s + Number(m.occupancyRate || 0), 0) / latestMetrics.length : 0;
  const avgRevpar = latestMetrics.length > 0 ? latestMetrics.reduce((s: number, m: any) => s + Number(m.revpar || 0), 0) / latestMetrics.length : 0;

  const kpis = [
    ["Total Active Listings", totalListings?.count || 0],
    ["Average Daily Rate (SAR)", `SAR ${Math.round(avgAdr)}`],
    ["Average Occupancy Rate", `${Number(avgOcc).toFixed(1)}%`],
    ["Revenue Per Available Room", `SAR ${Math.round(avgRevpar)}`],
    ["Average Guest Rating", Number(avgRating?.avg || 0).toFixed(2)],
    ["Neighborhoods Tracked", Object.keys(nbMap).length],
  ];

  let row = 5;
  for (const [label, value] of kpis) {
    sheet.getCell(`A${row}`).value = label as string;
    sheet.getCell(`A${row}`).font = { size: 11, name: "Calibri" };
    sheet.getCell(`B${row}`).value = value;
    sheet.getCell(`B${row}`).font = { bold: true, size: 11, name: "Calibri", color: { argb: `FF${BRAND_PRIMARY}` } };
    row++;
  }

  // Neighborhood overview table
  row += 2;
  sheet.getCell(`A${row}`).value = "Neighborhood Overview";
  sheet.getCell(`A${row}`).font = { bold: true, size: 13, color: { argb: `FF${BRAND_HEADER}` } };
  row++;

  const nbHeaders = ["Neighborhood", "Listings", "ADR (SAR)", "Occupancy %", "RevPAR (SAR)", "Avg Rating"];
  nbHeaders.forEach((h, i) => {
    sheet.getCell(row, i + 1).value = h;
  });
  const nbHeaderRow = sheet.getRow(row);
  nbHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  nbHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${BRAND_HEADER}` } };
  nbHeaderRow.height = 24;
  row++;

  for (const m of latestMetrics) {
    sheet.getCell(row, 1).value = nbMap[m.neighborhoodId] || `NB ${m.neighborhoodId}`;
    sheet.getCell(row, 2).value = m.totalListings || 0;
    sheet.getCell(row, 3).value = Number(m.adr || 0);
    sheet.getCell(row, 4).value = Number(m.occupancyRate || 0);
    sheet.getCell(row, 5).value = Number(m.revpar || 0);
    sheet.getCell(row, 6).value = Number(m.avgRating || 0);
    row++;
  }

  // Column widths
  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 16;
  sheet.getColumn(4).width = 16;
  sheet.getColumn(5).width = 18;
  sheet.getColumn(6).width = 14;
}

async function addMetricsSheet(
  workbook: ExcelJS.Workbook,
  db: any,
  nbMap: Record<number, string>,
  params: ExportParams
): Promise<void> {
  const sheet = workbook.addWorksheet("Metrics", {
    properties: { tabColor: { argb: "FF3B82F6" } },
  });

  const columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Neighborhood", key: "neighborhood", width: 22 },
    { header: "Property Type", key: "propertyType", width: 14 },
    { header: "ADR (SAR)", key: "adr", width: 12 },
    { header: "ADR 30d", key: "adr30", width: 12 },
    { header: "ADR 60d", key: "adr60", width: 12 },
    { header: "ADR 90d", key: "adr90", width: 12 },
    { header: "Occupancy %", key: "occupancy", width: 14 },
    { header: "RevPAR (SAR)", key: "revpar", width: 14 },
    { header: "Total Listings", key: "totalListings", width: 14 },
    { header: "New Listings", key: "newListings", width: 14 },
    { header: "Avg Rating", key: "avgRating", width: 12 },
    { header: "Median Price", key: "medianPrice", width: 14 },
    { header: "Price P25", key: "priceP25", width: 12 },
    { header: "Price P75", key: "priceP75", width: 12 },
  ];

  sheet.columns = columns;
  styleHeaderRow(sheet, columns.length);

  const conditions = [];
  if (params.neighborhoodIds?.length) {
    conditions.push(inArray(metrics.neighborhoodId, params.neighborhoodIds));
  }
  if (params.propertyTypes?.length) {
    conditions.push(inArray(metrics.propertyType, params.propertyTypes as any));
  }
  if (params.dateFrom) {
    conditions.push(gte(metrics.metricDate, new Date(params.dateFrom)));
  }
  if (params.dateTo) {
    conditions.push(lte(metrics.metricDate, new Date(params.dateTo)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const data = await db.select().from(metrics).where(where).orderBy(asc(metrics.metricDate));

  for (const m of data) {
    sheet.addRow({
      date: m.metricDate ? new Date(m.metricDate).toLocaleDateString() : "",
      neighborhood: nbMap[m.neighborhoodId] || `NB ${m.neighborhoodId}`,
      propertyType: m.propertyType,
      adr: Number(m.adr || 0),
      adr30: Number(m.adr30 || 0),
      adr60: Number(m.adr60 || 0),
      adr90: Number(m.adr90 || 0),
      occupancy: Number(m.occupancyRate || 0),
      revpar: Number(m.revpar || 0),
      totalListings: m.totalListings || 0,
      newListings: m.newListings || 0,
      avgRating: Number(m.avgRating || 0),
      medianPrice: Number(m.medianPrice || 0),
      priceP25: Number(m.priceP25 || 0),
      priceP75: Number(m.priceP75 || 0),
    });
  }

  styleDataRows(sheet, 2, sheet.rowCount, columns.length);
  sheet.autoFilter = { from: "A1", to: `O${sheet.rowCount}` };
}

async function addListingsSheet(
  workbook: ExcelJS.Workbook,
  db: any,
  nbMap: Record<number, string>,
  otaMap: Record<number, string>,
  params: ExportParams
): Promise<void> {
  const sheet = workbook.addWorksheet("Listings", {
    properties: { tabColor: { argb: "FF10B981" } },
  });

  const columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Title", key: "title", width: 35 },
    { header: "OTA", key: "ota", width: 14 },
    { header: "Neighborhood", key: "neighborhood", width: 20 },
    { header: "Type", key: "propertyType", width: 10 },
    { header: "Bedrooms", key: "bedrooms", width: 10 },
    { header: "Host", key: "hostName", width: 20 },
    { header: "Host Type", key: "hostType", width: 16 },
    { header: "Rating", key: "rating", width: 10 },
    { header: "Reviews", key: "reviewCount", width: 10 },
    { header: "Photos", key: "photoCount", width: 10 },
    { header: "Superhost", key: "isSuperhost", width: 12 },
    { header: "Instant Book", key: "instantBook", width: 12 },
    { header: "First Seen", key: "firstSeen", width: 14 },
    { header: "Last Seen", key: "lastSeen", width: 14 },
    { header: "URL", key: "url", width: 40 },
  ];

  sheet.columns = columns;
  styleHeaderRow(sheet, columns.length);

  const conditions = [eq(listings.isActive, true)];
  if (params.neighborhoodIds?.length) {
    conditions.push(inArray(listings.neighborhoodId, params.neighborhoodIds));
  }
  if (params.propertyTypes?.length) {
    conditions.push(inArray(listings.propertyType, params.propertyTypes as any));
  }

  const data = await db.select().from(listings).where(and(...conditions)).orderBy(desc(listings.lastSeen));

  for (const l of data) {
    sheet.addRow({
      id: l.id,
      title: l.title,
      ota: otaMap[l.otaSourceId] || `OTA ${l.otaSourceId}`,
      neighborhood: nbMap[l.neighborhoodId || 0] || "Unknown",
      propertyType: l.propertyType,
      bedrooms: l.bedrooms,
      hostName: l.hostName,
      hostType: l.hostType,
      rating: Number(l.rating || 0),
      reviewCount: l.reviewCount,
      photoCount: l.photoCount,
      isSuperhost: l.isSuperhost ? "Yes" : "No",
      instantBook: l.instantBook ? "Yes" : "No",
      firstSeen: l.firstSeen ? new Date(l.firstSeen).toLocaleDateString() : "",
      lastSeen: l.lastSeen ? new Date(l.lastSeen).toLocaleDateString() : "",
      url: l.url,
    });
  }

  styleDataRows(sheet, 2, sheet.rowCount, columns.length);
  sheet.autoFilter = { from: "A1", to: `P${sheet.rowCount}` };
}

async function addCompetitorsSheet(
  workbook: ExcelJS.Workbook,
  db: any,
  otaMap: Record<number, string>
): Promise<void> {
  const sheet = workbook.addWorksheet("Competitors", {
    properties: { tabColor: { argb: "FFF59E0B" } },
  });

  const columns = [
    { header: "Host Name", key: "hostName", width: 25 },
    { header: "Host ID", key: "hostId", width: 18 },
    { header: "OTA", key: "ota", width: 14 },
    { header: "Portfolio Size", key: "portfolioSize", width: 14 },
    { header: "Avg Rating", key: "avgRating", width: 12 },
    { header: "Avg Nightly Rate (SAR)", key: "avgNightlyRate", width: 22 },
    { header: "Total Reviews", key: "totalReviews", width: 14 },
    { header: "Superhost", key: "isSuperhost", width: 12 },
    { header: "First Detected", key: "firstDetected", width: 14 },
    { header: "Last Updated", key: "lastUpdated", width: 14 },
  ];

  sheet.columns = columns;
  styleHeaderRow(sheet, columns.length);

  const data = await db.select().from(competitors).orderBy(desc(competitors.portfolioSize));

  for (const c of data) {
    sheet.addRow({
      hostName: c.hostName,
      hostId: c.hostId,
      ota: otaMap[c.otaSourceId || 0] || "Multiple",
      portfolioSize: c.portfolioSize,
      avgRating: Number(c.avgRating || 0),
      avgNightlyRate: Number(c.avgNightlyRate || 0),
      totalReviews: c.totalReviews,
      isSuperhost: c.isSuperhost ? "Yes" : "No",
      firstDetected: c.firstDetected ? new Date(c.firstDetected).toLocaleDateString() : "",
      lastUpdated: c.lastUpdated ? new Date(c.lastUpdated).toLocaleDateString() : "",
    });
  }

  styleDataRows(sheet, 2, sheet.rowCount, columns.length);
}

async function addPriceSnapshotsSheet(
  workbook: ExcelJS.Workbook,
  db: any,
  nbMap: Record<number, string>,
  params: ExportParams
): Promise<void> {
  const sheet = workbook.addWorksheet("Price History", {
    properties: { tabColor: { argb: "FF8B5CF6" } },
  });

  const columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Listing ID", key: "listingId", width: 12 },
    { header: "Nightly Rate (SAR)", key: "nightlyRate", width: 18 },
    { header: "Weekly Rate (SAR)", key: "weeklyRate", width: 18 },
    { header: "Monthly Rate (SAR)", key: "monthlyRate", width: 18 },
    { header: "Cleaning Fee (SAR)", key: "cleaningFee", width: 18 },
    { header: "Available Days", key: "availableDays", width: 14 },
    { header: "Blocked Days", key: "blockedDays", width: 14 },
    { header: "Booked Days", key: "bookedDays", width: 14 },
  ];

  sheet.columns = columns;
  styleHeaderRow(sheet, columns.length);

  const conditions = [];
  if (params.dateFrom) {
    conditions.push(gte(priceSnapshots.snapshotDate, new Date(params.dateFrom)));
  }
  if (params.dateTo) {
    conditions.push(lte(priceSnapshots.snapshotDate, new Date(params.dateTo)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const data = await db.select().from(priceSnapshots)
    .where(where)
    .orderBy(desc(priceSnapshots.snapshotDate))
    .limit(5000); // Limit to prevent huge files

  for (const p of data) {
    sheet.addRow({
      date: p.snapshotDate ? new Date(p.snapshotDate).toLocaleDateString() : "",
      listingId: p.listingId,
      nightlyRate: Number(p.nightlyRate || 0),
      weeklyRate: Number(p.weeklyRate || 0),
      monthlyRate: Number(p.monthlyRate || 0),
      cleaningFee: Number(p.cleaningFee || 0),
      availableDays: p.availableDays,
      blockedDays: p.blockedDays,
      bookedDays: p.bookedDays,
    });
  }

  styleDataRows(sheet, 2, sheet.rowCount, columns.length);
}

async function addSeasonalSheet(workbook: ExcelJS.Workbook, db: any): Promise<void> {
  const sheet = workbook.addWorksheet("Seasonal Patterns", {
    properties: { tabColor: { argb: "FFEF4444" } },
  });

  const columns = [
    { header: "Event/Season", key: "name", width: 28 },
    { header: "Type", key: "seasonType", width: 12 },
    { header: "Start Date", key: "startDate", width: 14 },
    { header: "End Date", key: "endDate", width: 14 },
    { header: "Price Multiplier", key: "multiplier", width: 16 },
    { header: "Description", key: "description", width: 40 },
    { header: "Year", key: "year", width: 8 },
  ];

  sheet.columns = columns;
  styleHeaderRow(sheet, columns.length);

  const data = await db.select().from(seasonalPatterns).orderBy(asc(seasonalPatterns.startDate));

  for (const s of data) {
    sheet.addRow({
      name: s.name,
      seasonType: s.seasonType,
      startDate: s.startDate,
      endDate: s.endDate,
      multiplier: Number(s.avgPriceMultiplier || 1),
      description: s.description,
      year: s.year,
    });
  }

  styleDataRows(sheet, 2, sheet.rowCount, columns.length);
}
