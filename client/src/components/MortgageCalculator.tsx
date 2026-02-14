import { useState, useMemo } from "react";
import { Calculator, TrendingUp, Banknote, CalendarDays } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MortgageCalculatorProps {
  defaultPrice?: number;
}

export default function MortgageCalculator({ defaultPrice }: MortgageCalculatorProps) {
  const { t, isAr } = useLanguage();
  const [price, setPrice] = useState(defaultPrice || 1000000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [rate, setRate] = useState(5.5);
  const [years, setYears] = useState(25);

  const result = useMemo(() => {
    const loanAmount = price * (1 - downPaymentPct / 100);
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    if (monthlyRate === 0) {
      const monthly = loanAmount / numPayments;
      return { monthlyPayment: monthly, totalPayment: loanAmount, totalInterest: 0, loanAmount };
    }
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const totalPayment = monthlyPayment * numPayments;
    const totalInterest = totalPayment - loanAmount;
    return { monthlyPayment, totalPayment, totalInterest, loanAmount };
  }, [price, downPaymentPct, rate, years]);

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-[#0f1b33] mb-5 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-[#c8a45e]" />
        {t("mortgage.title")}
      </h3>
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm text-gray-600 mb-1 block">{t("mortgage.propertyPrice")}</label>
          <div className="relative">
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full px-4 py-2.5 bg-[#f8f5f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" dir="ltr" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{t("properties.sar")}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">{t("mortgage.downPayment")}</label>
            <input type="number" value={downPaymentPct} onChange={(e) => setDownPaymentPct(Number(e.target.value))} min={0} max={90} className="w-full px-3 py-2 bg-[#f8f5f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" dir="ltr" />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">{t("mortgage.interestRate")}</label>
            <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} min={0} max={20} step={0.1} className="w-full px-3 py-2 bg-[#f8f5f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" dir="ltr" />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">{t("mortgage.loanTerm")}</label>
            <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} min={1} max={30} className="w-full px-3 py-2 bg-[#f8f5f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30" dir="ltr" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#E31E24]/5 rounded-xl p-3 text-center">
          <Banknote className="w-5 h-5 text-[#E31E24] mx-auto mb-1" />
          <p className="text-xs text-gray-500 mb-0.5">{t("mortgage.monthlyPayment")}</p>
          <p className="text-lg font-bold text-[#E31E24]" dir="ltr">{fmt(result.monthlyPayment)}</p>
          <p className="text-[10px] text-gray-400">{t("properties.sar")}</p>
        </div>
        <div className="bg-[#c8a45e]/5 rounded-xl p-3 text-center">
          <TrendingUp className="w-5 h-5 text-[#c8a45e] mx-auto mb-1" />
          <p className="text-xs text-gray-500 mb-0.5">{t("mortgage.loanAmount")}</p>
          <p className="text-lg font-bold text-[#c8a45e]" dir="ltr">{fmt(result.loanAmount)}</p>
          <p className="text-[10px] text-gray-400">{t("properties.sar")}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <CalendarDays className="w-5 h-5 text-gray-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500 mb-0.5">{t("mortgage.totalPayment")}</p>
          <p className="text-base font-bold text-[#0f1b33]" dir="ltr">{fmt(result.totalPayment)}</p>
          <p className="text-[10px] text-gray-400">{t("properties.sar")}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <TrendingUp className="w-5 h-5 text-gray-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500 mb-0.5">{t("mortgage.totalInterest")}</p>
          <p className="text-base font-bold text-[#0f1b33]" dir="ltr">{fmt(result.totalInterest)}</p>
          <p className="text-[10px] text-gray-400">{t("properties.sar")}</p>
        </div>
      </div>
    </div>
  );
}
