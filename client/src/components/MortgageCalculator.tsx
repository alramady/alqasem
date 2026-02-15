import { useState, useMemo, useEffect } from "react";
import { Calculator, TrendingUp, Banknote, CalendarDays, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

interface MortgageCalculatorProps {
  defaultPrice?: number;
}

export default function MortgageCalculator({ defaultPrice }: MortgageCalculatorProps) {
  const { isAr } = useLanguage();
  const { data: config, isLoading } = trpc.public.getMortgageConfig.useQuery();

  const [price, setPrice] = useState(defaultPrice || 1000000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [rate, setRate] = useState(5.5);
  const [years, setYears] = useState(25);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Sync defaults from backend config
  useEffect(() => {
    if (config && config.enabled && 'defaultRate' in config) {
      setRate(config.defaultRate ?? 5.5);
      setYears(config.defaultTerm ?? 25);
      setDownPaymentPct(config.defaultDownPayment ?? 20);
    }
  }, [config]);

  // Update price when property price changes
  useEffect(() => {
    if (defaultPrice) setPrice(defaultPrice);
  }, [defaultPrice]);

  // Don't render if disabled or loading
  if (isLoading) return null;
  if (!config || !config.enabled) return null;

  const minRate = config.minRate;
  const maxRate = config.maxRate;
  const minTerm = config.minTerm;
  const maxTerm = config.maxTerm;
  const minDown = config.minDownPayment;
  const maxDown = config.maxDownPayment;
  const title = isAr ? config.titleAr : config.titleEn;
  const disclaimer = isAr ? config.disclaimerAr : config.disclaimerEn;

  const result = useMemo(() => {
    const downPaymentAmount = price * (downPaymentPct / 100);
    const loanAmount = price - downPaymentAmount;
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    if (monthlyRate === 0 || loanAmount <= 0) {
      const monthly = loanAmount > 0 ? loanAmount / numPayments : 0;
      return { monthlyPayment: monthly, totalPayment: loanAmount, totalInterest: 0, loanAmount, downPaymentAmount, numPayments };
    }
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const totalPayment = monthlyPayment * numPayments;
    const totalInterest = totalPayment - loanAmount;
    return { monthlyPayment, totalPayment, totalInterest, loanAmount, downPaymentAmount, numPayments };
  }, [price, downPaymentPct, rate, years]);

  // Amortization summary (first year, 5th year, last year)
  const amortizationSummary = useMemo(() => {
    if (result.loanAmount <= 0) return [];
    const monthlyRate = rate / 100 / 12;
    let balance = result.loanAmount;
    const summaryYears = [1, 5, Math.min(10, years), years].filter((v, i, a) => a.indexOf(v) === i && v <= years);
    const rows: { year: number; principalPaid: number; interestPaid: number; remaining: number }[] = [];
    let cumulativePrincipal = 0;
    let cumulativeInterest = 0;

    for (let y = 1; y <= years; y++) {
      let yearPrincipal = 0;
      let yearInterest = 0;
      for (let m = 0; m < 12; m++) {
        if (balance <= 0) break;
        const interestPayment = balance * monthlyRate;
        const principalPayment = result.monthlyPayment - interestPayment;
        yearPrincipal += principalPayment;
        yearInterest += interestPayment;
        balance -= principalPayment;
      }
      cumulativePrincipal += yearPrincipal;
      cumulativeInterest += yearInterest;
      if (summaryYears.includes(y)) {
        rows.push({ year: y, principalPaid: cumulativePrincipal, interestPaid: cumulativeInterest, remaining: Math.max(0, balance) });
      }
    }
    return rows;
  }, [result, rate, years]);

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  // Interest-to-principal ratio for the visual bar
  const interestRatio = result.totalPayment > 0 ? (result.totalInterest / result.totalPayment) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      {/* Header */}
      <h3 className="text-lg font-bold text-[#0f1b33] mb-5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <Calculator className="w-4 h-4 text-emerald-600" />
        </div>
        {title}
      </h3>

      <div className="space-y-5 mb-6">
        {/* Property Price */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium text-gray-700">{isAr ? "سعر العقار" : "Property Price"}</label>
            <span className="text-sm font-bold text-[#0f1b33]" dir="ltr">{fmt(price)} {isAr ? "ريال" : "SAR"}</span>
          </div>
          <input
            type="range"
            min={100000}
            max={20000000}
            step={50000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1" dir="ltr">
            <span>100K</span>
            <span>20M</span>
          </div>
        </div>

        {/* Down Payment */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium text-gray-700">{isAr ? "الدفعة الأولى" : "Down Payment"}</label>
            <span className="text-sm font-bold text-[#0f1b33]">{downPaymentPct}% <span className="text-xs font-normal text-gray-400">({fmt(result.downPaymentAmount)} {isAr ? "ريال" : "SAR"})</span></span>
          </div>
          <input
            type="range"
            min={minDown}
            max={maxDown}
            step={1}
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1" dir="ltr">
            <span>{minDown}%</span>
            <span>{maxDown}%</span>
          </div>
        </div>

        {/* Rate & Term Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Interest Rate */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-gray-700">{isAr ? "نسبة الربح" : "Rate"}</label>
              <span className="text-xs font-bold text-[#0f1b33]">{rate}%</span>
            </div>
            <input
              type="range"
              min={minRate}
              max={maxRate}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#c8a45e]"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5" dir="ltr">
              <span>{minRate}%</span>
              <span>{maxRate}%</span>
            </div>
          </div>

          {/* Loan Term */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-gray-700">{isAr ? "المدة" : "Term"}</label>
              <span className="text-xs font-bold text-[#0f1b33]">{years} {isAr ? "سنة" : "yrs"}</span>
            </div>
            <input
              type="range"
              min={minTerm}
              max={maxTerm}
              step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#c8a45e]"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5" dir="ltr">
              <span>{minTerm}</span>
              <span>{maxTerm}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Payment Highlight */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 mb-4 text-center border border-emerald-200/50">
        <Banknote className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
        <p className="text-xs text-emerald-700 mb-1">{isAr ? "القسط الشهري التقديري" : "Estimated Monthly Payment"}</p>
        <p className="text-2xl font-bold text-emerald-700" dir="ltr">{fmt(result.monthlyPayment)}</p>
        <p className="text-xs text-emerald-600/70">{isAr ? "ريال سعودي / شهرياً" : "SAR / month"}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#f8f5f0] rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">{isAr ? "مبلغ التمويل" : "Loan Amount"}</p>
          <p className="text-sm font-bold text-[#0f1b33]" dir="ltr">{fmt(result.loanAmount)}</p>
        </div>
        <div className="bg-[#f8f5f0] rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">{isAr ? "إجمالي الأرباح" : "Total Interest"}</p>
          <p className="text-sm font-bold text-[#E31E24]" dir="ltr">{fmt(result.totalInterest)}</p>
        </div>
        <div className="bg-[#f8f5f0] rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">{isAr ? "إجمالي السداد" : "Total Payment"}</p>
          <p className="text-sm font-bold text-[#0f1b33]" dir="ltr">{fmt(result.totalPayment)}</p>
        </div>
      </div>

      {/* Cost Breakdown Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>{isAr ? "أصل الدين" : "Principal"}</span>
          <span>{isAr ? "الأرباح" : "Interest"}</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex bg-slate-100">
          <div className="bg-emerald-500 rounded-l-full transition-all duration-500" style={{ width: `${100 - interestRatio}%` }} />
          <div className="bg-[#E31E24]/70 rounded-r-full transition-all duration-500" style={{ width: `${interestRatio}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5" dir="ltr">
          <span>{(100 - interestRatio).toFixed(1)}%</span>
          <span>{interestRatio.toFixed(1)}%</span>
        </div>
      </div>

      {/* Amortization Summary Toggle */}
      {amortizationSummary.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center gap-1.5 text-xs text-[#c8a45e] hover:text-[#b0903a] font-medium transition-colors w-full justify-center py-2"
          >
            {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {isAr ? "جدول السداد التقديري" : "Amortization Summary"}
          </button>
          {showBreakdown && (
            <div className="mt-2 overflow-hidden rounded-lg border border-slate-100">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-slate-50 text-gray-500">
                    <th className="py-2 px-2 text-center font-medium">{isAr ? "السنة" : "Year"}</th>
                    <th className="py-2 px-2 text-center font-medium">{isAr ? "أصل مسدد" : "Principal"}</th>
                    <th className="py-2 px-2 text-center font-medium">{isAr ? "أرباح مسددة" : "Interest"}</th>
                    <th className="py-2 px-2 text-center font-medium">{isAr ? "المتبقي" : "Balance"}</th>
                  </tr>
                </thead>
                <tbody>
                  {amortizationSummary.map((row) => (
                    <tr key={row.year} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="py-1.5 px-2 text-center font-medium text-[#0f1b33]">{row.year}</td>
                      <td className="py-1.5 px-2 text-center text-emerald-600" dir="ltr">{fmt(row.principalPaid)}</td>
                      <td className="py-1.5 px-2 text-center text-[#E31E24]" dir="ltr">{fmt(row.interestPaid)}</td>
                      <td className="py-1.5 px-2 text-center text-gray-600" dir="ltr">{fmt(row.remaining)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      {disclaimer && (
        <div className="flex gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700 leading-relaxed">{disclaimer}</p>
        </div>
      )}
    </div>
  );
}
