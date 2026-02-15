import { useState, useMemo, useEffect } from "react";
import { Calculator, TrendingUp, Banknote, CalendarDays, Info, ChevronDown, ChevronUp, Send, CheckCircle, X, User, Phone, Mail, FileText, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

interface MortgageCalculatorProps {
  defaultPrice?: number;
  propertyId?: number;
  propertyTitle?: string;
}

export default function MortgageCalculator({ defaultPrice, propertyId, propertyTitle }: MortgageCalculatorProps) {
  const { isAr } = useLanguage();
  const { data: config, isLoading } = trpc.public.getMortgageConfig.useQuery();

  const [price, setPrice] = useState(defaultPrice || 1000000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [rate, setRate] = useState(5.5);
  const [years, setYears] = useState(25);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Financing request form state
  const [showFinancingForm, setShowFinancingForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", notes: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");

  const submitMutation = trpc.public.submitFinancingRequest.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      setRequestNumber(data.requestNumber);
    },
  });

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

  // Amortization summary
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

  const interestRatio = result.totalPayment > 0 ? (result.totalInterest / result.totalPayment) * 100 : 0;

  // Financing CTA config
  const ctaEnabled = config.financingCtaEnabled;
  const ctaTitle = isAr ? config.financingCtaTitleAr : config.financingCtaTitleEn;
  const ctaSubtitle = isAr ? config.financingCtaSubtitleAr : config.financingCtaSubtitleEn;

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = isAr ? "الاسم مطلوب (حرفين على الأقل)" : "Name required (min 2 chars)";
    }
    if (!/^05\d{8}$/.test(formData.phone)) {
      errors.phone = isAr ? "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام" : "Phone must start with 05 and be 10 digits";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = isAr ? "البريد الإلكتروني غير صحيح" : "Invalid email";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitFinancing = () => {
    if (!validateForm()) return;
    submitMutation.mutate({
      propertyId,
      propertyTitle,
      customerName: formData.name.trim(),
      customerPhone: formData.phone,
      customerEmail: formData.email || undefined,
      propertyPrice: Math.round(price),
      downPaymentPct,
      loanAmount: Math.round(result.loanAmount),
      rate: rate.toString(),
      termYears: years,
      monthlyPayment: Math.round(result.monthlyPayment),
      notes: formData.notes || undefined,
    });
  };

  const resetForm = () => {
    setFormData({ name: "", phone: "", email: "", notes: "" });
    setFormErrors({});
    setSubmitted(false);
    setRequestNumber("");
    setShowFinancingForm(false);
    submitMutation.reset();
  };

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
          <input type="range" min={100000} max={20000000} step={50000} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1" dir="ltr"><span>100K</span><span>20M</span></div>
        </div>

        {/* Down Payment */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium text-gray-700">{isAr ? "الدفعة الأولى" : "Down Payment"}</label>
            <span className="text-sm font-bold text-[#0f1b33]">{downPaymentPct}% <span className="text-xs font-normal text-gray-400">({fmt(result.downPaymentAmount)} {isAr ? "ريال" : "SAR"})</span></span>
          </div>
          <input type="range" min={minDown} max={maxDown} step={1} value={downPaymentPct} onChange={(e) => setDownPaymentPct(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1" dir="ltr"><span>{minDown}%</span><span>{maxDown}%</span></div>
        </div>

        {/* Rate & Term Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-gray-700">{isAr ? "نسبة الربح" : "Rate"}</label>
              <span className="text-xs font-bold text-[#0f1b33]">{rate}%</span>
            </div>
            <input type="range" min={minRate} max={maxRate} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#c8a45e]" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5" dir="ltr"><span>{minRate}%</span><span>{maxRate}%</span></div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-gray-700">{isAr ? "المدة" : "Term"}</label>
              <span className="text-xs font-bold text-[#0f1b33]">{years} {isAr ? "سنة" : "yrs"}</span>
            </div>
            <input type="range" min={minTerm} max={maxTerm} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#c8a45e]" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5" dir="ltr"><span>{minTerm}</span><span>{maxTerm}</span></div>
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
          <button onClick={() => setShowBreakdown(!showBreakdown)} className="flex items-center gap-1.5 text-xs text-[#c8a45e] hover:text-[#b0903a] font-medium transition-colors w-full justify-center py-2">
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

      {/* Financing CTA Button */}
      {ctaEnabled && (
        <div className="mb-4">
          <button
            onClick={() => { setShowFinancingForm(true); setSubmitted(false); }}
            className="w-full bg-gradient-to-r from-[#0f1b33] to-[#1a2d4d] text-white rounded-xl py-3.5 px-4 font-bold text-sm hover:from-[#1a2d4d] hover:to-[#253d5f] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#0f1b33]/20"
          >
            <Send className="w-4 h-4" />
            {ctaTitle}
          </button>
          {ctaSubtitle && (
            <p className="text-[10px] text-gray-400 text-center mt-1.5">{ctaSubtitle}</p>
          )}
        </div>
      )}

      {/* Bank Partners */}
      <div className="mb-4">
        <p className="text-[10px] text-gray-400 text-center mb-3">{isAr ? "شركاء التمويل العقاري" : "Mortgage Partners"}</p>
        <div className="flex items-center justify-center gap-6 opacity-50 hover:opacity-80 transition-opacity">
          {/* Al Rajhi Bank */}
          <div className="flex items-center gap-1.5" title="مصرف الراجحي">
            <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
              <path d="M20 4L8 12v16l12 8 12-8V12L20 4z" stroke="#003399" strokeWidth="2" fill="none"/>
              <path d="M20 12l-6 4v8l6 4 6-4v-8l-6-4z" fill="#003399"/>
            </svg>
            <span className="text-[10px] font-bold text-[#003399] hidden sm:inline">الراجحي</span>
          </div>
          {/* SNB */}
          <div className="flex items-center gap-1.5" title="البنك الأهلي السعودي">
            <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
              <path d="M20 6c-8 0-14 6-14 14s6 14 14 14 14-6 14-14S28 6 20 6z" stroke="#006633" strokeWidth="2" fill="none"/>
              <path d="M14 20l4 4 8-8" stroke="#006633" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[10px] font-bold text-[#006633] hidden sm:inline">SNB</span>
          </div>
          {/* Riyad Bank */}
          <div className="flex items-center gap-1.5" title="بنك الرياض">
            <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
              <rect x="6" y="10" width="28" height="20" rx="3" stroke="#008080" strokeWidth="2" fill="none"/>
              <path d="M6 16h28" stroke="#008080" strokeWidth="2"/>
              <circle cx="28" cy="24" r="3" fill="#008080"/>
            </svg>
            <span className="text-[10px] font-bold text-[#008080] hidden sm:inline">بنك الرياض</span>
          </div>
          {/* SAB */}
          <div className="flex items-center gap-1.5" title="البنك السعودي الأول">
            <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
              <path d="M8 30V14l12-8 12 8v16" stroke="#CC0000" strokeWidth="2" fill="none"/>
              <path d="M16 30V22h8v8" stroke="#CC0000" strokeWidth="2" fill="none"/>
            </svg>
            <span className="text-[10px] font-bold text-[#CC0000] hidden sm:inline">SAB</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      {disclaimer && (
        <div className="flex gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700 leading-relaxed">{disclaimer}</p>
        </div>
      )}

      {/* Financing Request Modal */}
      {showFinancingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0f1b33] to-[#1a2d4d] text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{ctaTitle}</h3>
                <p className="text-xs text-white/70 mt-0.5">{isAr ? "سيتم إرسال بيانات التمويل تلقائياً" : "Your financing details will be sent automatically"}</p>
              </div>
              <button onClick={resetForm} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitted ? (
              /* Success State */
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h4 className="text-lg font-bold text-[#0f1b33] mb-2">{isAr ? "تم إرسال طلبك بنجاح" : "Request Submitted Successfully"}</h4>
                <p className="text-sm text-gray-500 mb-4">{isAr ? "سيتواصل معك فريقنا في أقرب وقت" : "Our team will contact you shortly"}</p>
                <div className="bg-[#f8f5f0] rounded-xl p-4 mb-4">
                  <p className="text-xs text-gray-500 mb-1">{isAr ? "رقم الطلب" : "Request Number"}</p>
                  <p className="text-lg font-bold text-[#c8a45e] font-mono" dir="ltr">{requestNumber}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 mb-4 text-start">
                  <p className="text-xs text-emerald-700 font-medium mb-2">{isAr ? "ملخص الطلب:" : "Request Summary:"}</p>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <span className="text-gray-500">{isAr ? "سعر العقار:" : "Price:"}</span>
                    <span className="font-medium" dir="ltr">{fmt(price)} {isAr ? "ر.س" : "SAR"}</span>
                    <span className="text-gray-500">{isAr ? "القسط الشهري:" : "Monthly:"}</span>
                    <span className="font-medium text-emerald-600" dir="ltr">{fmt(result.monthlyPayment)} {isAr ? "ر.س" : "SAR"}</span>
                    <span className="text-gray-500">{isAr ? "المدة:" : "Term:"}</span>
                    <span className="font-medium">{years} {isAr ? "سنة" : "years"}</span>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${formData.phone.replace(/^0/, '966')}?text=${encodeURIComponent(
                    `مرحباً ${formData.name}،\n` +
                    `شكراً لتقديم طلب التمويل رقم: ${requestNumber}\n` +
                    `سعر العقار: ${fmt(price)} ر.س\n` +
                    `مبلغ التمويل: ${fmt(result.loanAmount)} ر.س\n` +
                    `القسط الشهري: ${fmt(result.monthlyPayment)} ر.س\n` +
                    `المدة: ${years} سنة | الربح: ${rate}%\n` +
                    `سيتواصل معك فريقنا قريباً`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] text-white rounded-xl py-3 font-medium text-sm hover:bg-[#1da851] transition-colors flex items-center justify-center gap-2 mb-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {isAr ? "تواصل عبر واتساب" : "Chat on WhatsApp"}
                </a>
                <button onClick={resetForm} className="w-full bg-[#0f1b33] text-white rounded-xl py-3 font-medium text-sm hover:bg-[#1a2d4d] transition-colors">
                  {isAr ? "إغلاق" : "Close"}
                </button>
              </div>
            ) : (
              /* Form State */
              <div className="p-5">
                {/* Auto-filled scenario summary */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-xl p-3 mb-5 border border-emerald-100">
                  <p className="text-[10px] text-emerald-700 font-medium mb-2">{isAr ? "سيناريو التمويل المحسوب:" : "Calculated Financing Scenario:"}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-gray-500">{isAr ? "السعر:" : "Price:"}</span><span className="font-medium" dir="ltr">{fmt(price)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">{isAr ? "الدفعة:" : "Down:"}</span><span className="font-medium">{downPaymentPct}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">{isAr ? "التمويل:" : "Loan:"}</span><span className="font-medium" dir="ltr">{fmt(result.loanAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">{isAr ? "الربح:" : "Rate:"}</span><span className="font-medium">{rate}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">{isAr ? "المدة:" : "Term:"}</span><span className="font-medium">{years} {isAr ? "سنة" : "yrs"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">{isAr ? "القسط:" : "Monthly:"}</span><span className="font-bold text-emerald-600" dir="ltr">{fmt(result.monthlyPayment)}</span></div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {isAr ? "الاسم الكامل" : "Full Name"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => { setFormData(p => ({ ...p, name: e.target.value })); setFormErrors(p => ({ ...p, name: "" })); }}
                      placeholder={isAr ? "أدخل اسمك الكامل" : "Enter your full name"}
                      className={`w-full px-3 py-2.5 text-sm rounded-lg border ${formErrors.name ? "border-red-300 bg-red-50" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors`}
                    />
                    {formErrors.name && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.name}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {isAr ? "رقم الجوال" : "Phone Number"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => { setFormData(p => ({ ...p, phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) })); setFormErrors(p => ({ ...p, phone: "" })); }}
                      placeholder="05XXXXXXXX"
                      dir="ltr"
                      className={`w-full px-3 py-2.5 text-sm rounded-lg border ${formErrors.phone ? "border-red-300 bg-red-50" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors`}
                    />
                    {formErrors.phone && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.phone}</p>}
                  </div>

                  {/* Email (optional) */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {isAr ? "البريد الإلكتروني" : "Email"} <span className="text-gray-400 text-[10px]">({isAr ? "اختياري" : "optional"})</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => { setFormData(p => ({ ...p, email: e.target.value })); setFormErrors(p => ({ ...p, email: "" })); }}
                      placeholder={isAr ? "example@email.com" : "example@email.com"}
                      dir="ltr"
                      className={`w-full px-3 py-2.5 text-sm rounded-lg border ${formErrors.email ? "border-red-300 bg-red-50" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors`}
                    />
                    {formErrors.email && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.email}</p>}
                  </div>

                  {/* Notes (optional) */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      {isAr ? "ملاحظات إضافية" : "Additional Notes"} <span className="text-gray-400 text-[10px]">({isAr ? "اختياري" : "optional"})</span>
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                      placeholder={isAr ? "أي متطلبات أو استفسارات إضافية..." : "Any additional requirements or questions..."}
                      rows={2}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmitFinancing}
                  disabled={submitMutation.isPending}
                  className="w-full mt-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl py-3.5 font-bold text-sm hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
                >
                  {submitMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {isAr ? "إرسال طلب التمويل" : "Submit Financing Request"}
                    </>
                  )}
                </button>

                {submitMutation.error && (
                  <p className="text-xs text-red-500 text-center mt-2">{isAr ? "حدث خطأ، يرجى المحاولة مرة أخرى" : "An error occurred, please try again"}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
