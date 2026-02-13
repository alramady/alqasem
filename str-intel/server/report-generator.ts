/**
 * CoBNB Market Intelligence — Property Acquisition Pitch Report Generator
 * 
 * Generates branded PDF-style HTML reports per neighborhood with:
 * - Market overview (ADR, occupancy, RevPAR)
 * - Property type breakdown
 * - Competitor landscape
 * - Seasonal pricing patterns
 * - Investment opportunity analysis
 * 
 * Returns HTML string that can be rendered as PDF on the client side.
 */

import * as db from "./db";

export interface ReportConfig {
  neighborhoodId: number;
  includeCompetitors?: boolean;
  includeSeasonalPatterns?: boolean;
  includePropertyBreakdown?: boolean;
  customNotes?: string;
  generatedBy?: string;
}

export interface ReportData {
  html: string;
  title: string;
  neighborhood: string;
  generatedAt: string;
}

const PT_LABELS: Record<string, string> = {
  studio: "Studio",
  "1br": "1 Bedroom",
  "2br": "2 Bedrooms",
  "3br": "3 Bedrooms",
  "4br_plus": "4+ Bedrooms",
};

function formatCurrency(val: number | string | null | undefined): string {
  const num = Number(val || 0);
  return `SAR ${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPercent(val: number | string | null | undefined): string {
  return `${Number(val || 0).toFixed(1)}%`;
}

function formatRating(val: number | string | null | undefined): string {
  return Number(val || 0).toFixed(2);
}

function getConfidenceBadge(confidence: string | null | undefined): string {
  const c = confidence || "estimated";
  const colors: Record<string, string> = {
    real: "#00BFA6",
    estimated: "#F59E0B",
    default: "#EF4444",
  };
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${colors[c] || colors.estimated};color:#fff;font-size:10px;font-weight:600;text-transform:uppercase;">${c}</span>`;
}

export async function generatePitchReport(config: ReportConfig): Promise<ReportData> {
  const detail = await db.getNeighborhoodDetail(config.neighborhoodId);
  if (!detail) throw new Error("Neighborhood not found");

  const neighborhoods = await db.getNeighborhoods();
  const competitors = config.includeCompetitors !== false ? await db.getCompetitors() : [];
  const seasonal = config.includeSeasonalPatterns !== false ? await db.getSeasonalPatterns() : [];
  const adrTrends = await db.getAdrTrends(config.neighborhoodId);

  const nb = detail.neighborhood;
  const m = detail.latestMetrics;
  const stats = detail.listingStats;
  const ptMetrics = detail.propertyTypeMetrics;
  const topHosts = detail.topHosts;
  const generatedAt = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Calculate market averages for comparison
  const allNeighborhoodMetrics = await Promise.all(
    neighborhoods.map(n => db.getNeighborhoodDetail(n.id))
  );
  const validMetrics = allNeighborhoodMetrics.filter(m => m?.latestMetrics);
  const marketAvgAdr = validMetrics.length > 0
    ? validMetrics.reduce((s, m) => s + Number(m!.latestMetrics!.adr || 0), 0) / validMetrics.length
    : 0;
  const marketAvgOcc = validMetrics.length > 0
    ? validMetrics.reduce((s, m) => s + Number(m!.latestMetrics!.occupancyRate || 0), 0) / validMetrics.length
    : 0;

  const nbAdr = Number(m?.adr || 0);
  const nbOcc = Number(m?.occupancyRate || 0);
  const adrVsMarket = marketAvgAdr > 0 ? ((nbAdr - marketAvgAdr) / marketAvgAdr * 100).toFixed(1) : "N/A";
  const occVsMarket = marketAvgOcc > 0 ? ((nbOcc - marketAvgOcc) / marketAvgOcc * 100).toFixed(1) : "N/A";

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CoBNB Market Intelligence — ${nb.name} Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1a1a2e;
    background: #ffffff;
    line-height: 1.6;
    font-size: 13px;
  }
  
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  
  /* Header */
  .report-header {
    background: linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%);
    color: #ffffff;
    padding: 48px 40px;
    border-radius: 12px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
  }
  .report-header::before {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(0,191,166,0.2) 0%, transparent 70%);
    border-radius: 50%;
  }
  .brand-logo {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }
  .brand-logo span { color: #00BFA6; }
  .brand-subtitle {
    font-size: 12px;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 24px;
  }
  .report-title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 8px;
    position: relative;
  }
  .report-meta {
    font-size: 12px;
    color: rgba(255,255,255,0.7);
  }
  
  /* Section */
  .section {
    margin-bottom: 28px;
    page-break-inside: avoid;
  }
  .section-title {
    font-size: 16px;
    font-weight: 700;
    color: #0a1628;
    border-bottom: 2px solid #00BFA6;
    padding-bottom: 8px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-title .icon {
    width: 24px;
    height: 24px;
    background: #00BFA6;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
  }
  
  /* KPI Grid */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }
  .kpi-card {
    background: #f8fafb;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
  }
  .kpi-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
    margin-bottom: 4px;
    font-weight: 600;
  }
  .kpi-value {
    font-size: 20px;
    font-weight: 700;
    color: #0a1628;
  }
  .kpi-sub {
    font-size: 10px;
    color: #94a3b8;
    margin-top: 2px;
  }
  .kpi-positive { color: #00BFA6; }
  .kpi-negative { color: #EF4444; }
  
  /* Table */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    font-size: 12px;
  }
  th {
    background: #f1f5f9;
    color: #475569;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.5px;
    padding: 10px 12px;
    text-align: left;
    border-bottom: 2px solid #e2e8f0;
  }
  td {
    padding: 10px 12px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
  }
  tr:hover td { background: #f8fafb; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-bold { font-weight: 600; }
  
  /* Comparison bar */
  .comparison-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .bar-track {
    flex: 1;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s;
  }
  
  /* Callout */
  .callout {
    background: linear-gradient(135deg, rgba(0,191,166,0.08), rgba(0,191,166,0.03));
    border-left: 4px solid #00BFA6;
    padding: 16px 20px;
    border-radius: 0 8px 8px 0;
    margin: 16px 0;
  }
  .callout-title {
    font-weight: 700;
    color: #0a1628;
    margin-bottom: 4px;
    font-size: 13px;
  }
  .callout-text {
    color: #475569;
    font-size: 12px;
    line-height: 1.5;
  }
  
  /* Footer */
  .report-footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    color: #94a3b8;
    font-size: 10px;
  }
  .report-footer .brand { color: #00BFA6; font-weight: 600; }
  
  /* Print styles */
  @media print {
    body { font-size: 11px; }
    .page { padding: 20px; }
    .report-header { padding: 32px; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">

<!-- Header -->
<div class="report-header">
  <div class="brand-logo">Co<span>BNB</span> KSA</div>
  <div class="brand-subtitle">Market Intelligence Report</div>
  <div class="report-title">Property Acquisition Analysis: ${nb.name}</div>
  <div class="report-meta">
    ${nb.nameAr ? `<span dir="rtl">${nb.nameAr}</span> · ` : ""}${nb.city}, Saudi Arabia · Generated ${dateStr}
    ${config.generatedBy ? ` · Prepared by ${config.generatedBy}` : ""}
  </div>
</div>

<!-- Executive Summary -->
<div class="section">
  <div class="section-title"><div class="icon">1</div> Executive Summary</div>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">ADR</div>
      <div class="kpi-value">${formatCurrency(m?.adr)}</div>
      <div class="kpi-sub ${Number(adrVsMarket) >= 0 ? 'kpi-positive' : 'kpi-negative'}">${adrVsMarket !== "N/A" ? (Number(adrVsMarket) >= 0 ? "+" : "") + adrVsMarket + "% vs market" : ""}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Occupancy</div>
      <div class="kpi-value">${formatPercent(m?.occupancyRate)}</div>
      <div class="kpi-sub ${Number(occVsMarket) >= 0 ? 'kpi-positive' : 'kpi-negative'}">${occVsMarket !== "N/A" ? (Number(occVsMarket) >= 0 ? "+" : "") + occVsMarket + "% vs market" : ""}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">RevPAR</div>
      <div class="kpi-value">${formatCurrency(m?.revpar)}</div>
      <div class="kpi-sub">${getConfidenceBadge(m?.dataConfidence)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Active Listings</div>
      <div class="kpi-value">${m?.totalListings || Number(stats?.count || 0)}</div>
      <div class="kpi-sub">+${m?.newListings || 0} new this period</div>
    </div>
  </div>
  
  <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr);">
    <div class="kpi-card">
      <div class="kpi-label">30-Day ADR</div>
      <div class="kpi-value">${formatCurrency(m?.adr30)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">60-Day ADR</div>
      <div class="kpi-value">${formatCurrency(m?.adr60)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">90-Day ADR</div>
      <div class="kpi-value">${formatCurrency(m?.adr90)}</div>
    </div>
  </div>
  
  <div class="callout">
    <div class="callout-title">Investment Opportunity Assessment</div>
    <div class="callout-text">
      ${nb.name} shows ${nbAdr > marketAvgAdr ? "above-market" : "below-market"} ADR at ${formatCurrency(m?.adr)} 
      with ${nbOcc > 60 ? "strong" : nbOcc > 40 ? "moderate" : "developing"} occupancy at ${formatPercent(m?.occupancyRate)}.
      ${m?.newListings && Number(m.newListings) > 3 ? `Active supply growth with ${m.newListings} new listings indicates growing market interest.` : "Supply growth is stable, suggesting a mature market segment."}
      The median price point is ${formatCurrency(m?.medianPrice)} with a P25-P75 range of ${formatCurrency(m?.priceP25)} to ${formatCurrency(m?.priceP75)}.
    </div>
  </div>
</div>`;

  // Property Type Breakdown
  if (config.includePropertyBreakdown !== false && ptMetrics && ptMetrics.length > 0) {
    html += `
<div class="section">
  <div class="section-title"><div class="icon">2</div> Property Type Breakdown</div>
  <table>
    <thead>
      <tr>
        <th>Property Type</th>
        <th class="text-right">ADR</th>
        <th class="text-right">Occupancy</th>
        <th class="text-right">RevPAR</th>
        <th class="text-right">Median Price</th>
        <th class="text-center">Confidence</th>
      </tr>
    </thead>
    <tbody>
      ${ptMetrics.map(pt => `
      <tr>
        <td class="font-bold">${PT_LABELS[pt.propertyType || ""] || pt.propertyType}</td>
        <td class="text-right">${formatCurrency(pt.adr)}</td>
        <td class="text-right">${formatPercent(pt.occupancyRate)}</td>
        <td class="text-right">${formatCurrency(pt.revpar)}</td>
        <td class="text-right">${formatCurrency(pt.medianPrice)}</td>
        <td class="text-center">${getConfidenceBadge(pt.dataConfidence)}</td>
      </tr>`).join("")}
    </tbody>
  </table>
  
  <div class="callout">
    <div class="callout-title">Pricing Strategy Insight</div>
    <div class="callout-text">
      ${ptMetrics.length > 0 ? (() => {
        const sorted = [...ptMetrics].sort((a, b) => Number(b.revpar || 0) - Number(a.revpar || 0));
        const best = sorted[0];
        return `The highest RevPAR in ${nb.name} comes from ${PT_LABELS[best.propertyType || ""] || best.propertyType} units at ${formatCurrency(best.revpar)}, suggesting this property type offers the best revenue potential for new acquisitions.`;
      })() : "Insufficient data for property type analysis."}
    </div>
  </div>
</div>`;
  }

  // Top Hosts / Competitor Landscape
  if (config.includeCompetitors !== false && topHosts && topHosts.length > 0) {
    html += `
<div class="section">
  <div class="section-title"><div class="icon">3</div> Competitive Landscape — ${nb.name}</div>
  <table>
    <thead>
      <tr>
        <th>Host / Manager</th>
        <th class="text-center">Type</th>
        <th class="text-right">Listings</th>
        <th class="text-right">Avg Rating</th>
      </tr>
    </thead>
    <tbody>
      ${topHosts.slice(0, 10).map(h => `
      <tr>
        <td class="font-bold">${h.hostName || "Unknown"}</td>
        <td class="text-center">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${h.hostType === "property_manager" ? "#00BFA6" : "#64748b"};color:#fff;font-size:10px;">${h.hostType === "property_manager" ? "PM" : "Individual"}</span>
        </td>
        <td class="text-right">${Number(h.count)}</td>
        <td class="text-right">${formatRating(h.avgRating)} ⭐</td>
      </tr>`).join("")}
    </tbody>
  </table>`;

    // Add city-wide competitor data
    if (competitors.length > 0) {
      html += `
  <p style="margin-top:16px;font-size:12px;color:#475569;font-weight:600;">City-Wide Property Managers (5+ listings)</p>
  <table>
    <thead>
      <tr>
        <th>Company / Host</th>
        <th class="text-right">Portfolio</th>
        <th class="text-right">Avg Rate</th>
        <th class="text-right">Rating</th>
        <th class="text-right">Reviews</th>
      </tr>
    </thead>
    <tbody>
      ${competitors.slice(0, 8).map(c => `
      <tr>
        <td class="font-bold">${c.hostName || "Unknown"}</td>
        <td class="text-right">${c.portfolioSize} units</td>
        <td class="text-right">${formatCurrency(c.avgNightlyRate)}</td>
        <td class="text-right">${formatRating(c.avgRating)}</td>
        <td class="text-right">${c.totalReviews?.toLocaleString()}</td>
      </tr>`).join("")}
    </tbody>
  </table>`;
    }

    html += `
  <div class="callout">
    <div class="callout-title">Competitive Position</div>
    <div class="callout-text">
      ${topHosts.filter(h => h.hostType === "property_manager").length} property managers operate in ${nb.name}, 
      managing a combined ${topHosts.filter(h => h.hostType === "property_manager").reduce((s, h) => s + Number(h.count), 0)} listings.
      ${competitors.length > 0 ? `City-wide, ${competitors.length} major operators manage 5+ listings each.` : ""}
      CoBNB can differentiate through superior guest experience, dynamic pricing, and professional property management.
    </div>
  </div>
</div>`;
  }

  // Seasonal Patterns
  if (config.includeSeasonalPatterns !== false && seasonal.length > 0) {
    html += `
<div class="section">
  <div class="section-title"><div class="icon">4</div> Seasonal Pricing Patterns</div>
  <table>
    <thead>
      <tr>
        <th>Event / Season</th>
        <th class="text-center">Type</th>
        <th class="text-center">Period</th>
        <th class="text-right">Price Multiplier</th>
      </tr>
    </thead>
    <tbody>
      ${seasonal.map(s => `
      <tr>
        <td class="font-bold">${s.name}</td>
        <td class="text-center">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${
            s.seasonType === "peak" ? "#EF4444" : s.seasonType === "high" ? "#F59E0B" : s.seasonType === "event" ? "#8B5CF6" : "#3B82F6"
          };color:#fff;font-size:10px;">${s.seasonType}</span>
        </td>
        <td class="text-center">${s.startDate || "—"} → ${s.endDate || "—"}</td>
        <td class="text-right font-bold">${Number(s.avgPriceMultiplier || 1).toFixed(2)}x</td>
      </tr>`).join("")}
    </tbody>
  </table>
  
  <div class="callout">
    <div class="callout-title">Revenue Optimization</div>
    <div class="callout-text">
      ${seasonal.filter(s => s.seasonType === "peak" || s.seasonType === "event").length} peak/event periods identified.
      ${(() => {
        const peakEvents = seasonal.filter(s => s.seasonType === "peak" || s.seasonType === "event");
        if (peakEvents.length > 0) {
          const maxMult = Math.max(...peakEvents.map(s => Number(s.avgPriceMultiplier || 1)));
          return `Maximum pricing multiplier reaches ${maxMult.toFixed(2)}x during peak events. Dynamic pricing during these periods is critical for revenue maximization.`;
        }
        return "Implement dynamic pricing to capture seasonal demand variations.";
      })()}
    </div>
  </div>
</div>`;
  }

  // ADR Trend Summary
  if (adrTrends.length > 0) {
    const recent = adrTrends.slice(-5);
    const oldest = adrTrends[0];
    const newest = adrTrends[adrTrends.length - 1];
    const adrChange = Number(oldest.adr || 0) > 0
      ? ((Number(newest.adr || 0) - Number(oldest.adr || 0)) / Number(oldest.adr || 0) * 100).toFixed(1)
      : "N/A";

    html += `
<div class="section">
  <div class="section-title"><div class="icon">5</div> ADR Trend Analysis</div>
  <table>
    <thead>
      <tr>
        <th>Period</th>
        <th class="text-right">ADR</th>
        <th class="text-right">Occupancy</th>
        <th class="text-right">RevPAR</th>
        <th class="text-right">Listings</th>
      </tr>
    </thead>
    <tbody>
      ${recent.map(t => `
      <tr>
        <td>${new Date(t.metricDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
        <td class="text-right">${formatCurrency(t.adr)}</td>
        <td class="text-right">${formatPercent(t.occupancyRate)}</td>
        <td class="text-right">${formatCurrency(t.revpar)}</td>
        <td class="text-right">${t.totalListings || 0}</td>
      </tr>`).join("")}
    </tbody>
  </table>
  <p style="font-size:11px;color:#64748b;margin-top:8px;">
    ADR trend over tracked period: <strong style="color:${Number(adrChange) >= 0 ? '#00BFA6' : '#EF4444'}">${adrChange !== "N/A" ? (Number(adrChange) >= 0 ? "+" : "") + adrChange + "%" : "N/A"}</strong>
  </p>
</div>`;
  }

  // Custom Notes
  if (config.customNotes) {
    html += `
<div class="section">
  <div class="section-title"><div class="icon">N</div> Additional Notes</div>
  <div class="callout">
    <div class="callout-text">${config.customNotes.replace(/\n/g, "<br>")}</div>
  </div>
</div>`;
  }

  // Footer
  html += `
<!-- Footer -->
<div class="report-footer">
  <p><span class="brand">CoBNB KSA</span> · Market Intelligence Platform</p>
  <p>Riyadh Short-Term Rental Market Analysis · Confidential</p>
  <p>Generated ${dateStr} · Data accuracy subject to collection methodology</p>
</div>

</div>
</body>
</html>`;

  return {
    html,
    title: `CoBNB Market Intelligence — ${nb.name} Report`,
    neighborhood: nb.name,
    generatedAt,
  };
}
