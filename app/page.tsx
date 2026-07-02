'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, ChevronDown, ChevronsUpDown, Loader2, ArrowRight } from 'lucide-react';

interface PlanItem {
  id: string;
  name: string;
  dataGb: number;
  durationDays: number;
  priceUsd: number;
}

interface CountryItem {
  name: string;
  code: string;
  flag: string;
  plans: PlanItem[];
}

const SUPPORTED_COUNTRIES: CountryItem[] = [
  {
    name: 'United States',
    code: 'US',
    flag: '🇺🇸',
    plans: [
      { id: 'maya_us_1gb_7d', name: 'US Lite', dataGb: 1, durationDays: 7, priceUsd: 4.90 },
      { id: 'maya_us_5gb_30d', name: 'US Smart', dataGb: 5, durationDays: 30, priceUsd: 12.50 },
      { id: 'maya_us_10gb_30d', name: 'US Premium', dataGb: 10, durationDays: 30, priceUsd: 22.00 },
    ],
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    flag: '🇬🇧',
    plans: [
      { id: 'maya_gb_1gb_7d', name: 'UK Lite', dataGb: 1, durationDays: 7, priceUsd: 5.50 },
      { id: 'maya_gb_5gb_30d', name: 'UK Smart', dataGb: 5, durationDays: 30, priceUsd: 13.90 },
      { id: 'maya_gb_10gb_30d', name: 'UK Premium', dataGb: 10, durationDays: 30, priceUsd: 24.50 },
    ],
  },
  {
    name: 'Turkey',
    code: 'TR',
    flag: '🇹🇷',
    plans: [
      { id: 'maya_tr_1gb_7d', name: 'Turkey Lite', dataGb: 1, durationDays: 7, priceUsd: 3.90 },
      { id: 'maya_tr_5gb_30d', name: 'Turkey Smart', dataGb: 5, durationDays: 30, priceUsd: 9.90 },
      { id: 'maya_tr_10gb_30d', name: 'Turkey Premium', dataGb: 10, durationDays: 30, priceUsd: 17.50 },
    ],
  },
  {
    name: 'France',
    code: 'FR',
    flag: '🇫🇷',
    plans: [
      { id: 'maya_fr_1gb_7d', name: 'France Lite', dataGb: 1, durationDays: 7, priceUsd: 4.40 },
      { id: 'maya_fr_5gb_30d', name: 'France Smart', dataGb: 5, durationDays: 30, priceUsd: 11.50 },
      { id: 'maya_fr_10gb_30d', name: 'France Premium', dataGb: 10, durationDays: 30, priceUsd: 20.00 },
    ],
  },
  {
    name: 'Japan',
    code: 'JP',
    flag: '🇯🇵',
    plans: [
      { id: 'maya_jp_1gb_7d', name: 'Japan Lite', dataGb: 1, durationDays: 7, priceUsd: 5.90 },
      { id: 'maya_jp_5gb_30d', name: 'Japan Smart', dataGb: 5, durationDays: 30, priceUsd: 14.50 },
      { id: 'maya_jp_10gb_30d', name: 'Japan Premium', dataGb: 10, durationDays: 30, priceUsd: 26.00 },
    ],
  },
  {
    name: 'Germany',
    code: 'DE',
    flag: '🇩🇪',
    plans: [
      { id: 'maya_de_1gb_7d', name: 'Germany Lite', dataGb: 1, durationDays: 7, priceUsd: 4.50 },
      { id: 'maya_de_5gb_30d', name: 'Germany Smart', dataGb: 5, durationDays: 30, priceUsd: 11.90 },
      { id: 'maya_de_10gb_30d', name: 'Germany Premium', dataGb: 10, durationDays: 30, priceUsd: 21.00 },
    ],
  },
  {
    name: 'Spain',
    code: 'ES',
    flag: '🇪🇸',
    plans: [
      { id: 'maya_es_1gb_7d', name: 'Spain Lite', dataGb: 1, durationDays: 7, priceUsd: 4.30 },
      { id: 'maya_es_5gb_30d', name: 'Spain Smart', dataGb: 5, durationDays: 30, priceUsd: 11.00 },
      { id: 'maya_es_10gb_30d', name: 'Spain Premium', dataGb: 10, durationDays: 30, priceUsd: 19.90 },
    ],
  },
  {
    name: 'Italy',
    code: 'IT',
    flag: '🇮🇹',
    plans: [
      { id: 'maya_it_1gb_7d', name: 'Italy Lite', dataGb: 1, durationDays: 7, priceUsd: 4.20 },
      { id: 'maya_it_5gb_30d', name: 'Italy Smart', dataGb: 5, durationDays: 30, priceUsd: 10.90 },
      { id: 'maya_it_10gb_30d', name: 'Italy Premium', dataGb: 10, durationDays: 30, priceUsd: 19.50 },
    ],
  },
];

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState<CountryItem | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpenCountryDropdown, setIsOpenCountryDropdown] = useState(false);
  const [isOpenPlanDropdown, setIsOpenPlanDropdown] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const planDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsOpenCountryDropdown(false);
      }
      if (planDropdownRef.current && !planDropdownRef.current.contains(event.target as Node)) {
        setIsOpenPlanDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = SUPPORTED_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePurchase = async () => {
    if (!selectedCountry || !selectedPlan) return;
    setCheckoutLoading(true);

    try {
      const response = await fetch('http://localhost:3000/payment/guest-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          countryCode: selectedCountry.code,
          amount: selectedPlan.priceUsd,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.url) {
          window.location.href = data.data.url; // Redirect to Stripe Checkout
          return;
        }
      }
    } catch (_) {
      // Offline/simulation fallback
    }

    // Local simulation fallback
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const mockSessionId = `cs_test_${Math.random().toString(36).substring(2, 12)}`;
    window.location.href = `/checkout/success?session_id=${mockSessionId}&plan_id=${selectedPlan.id}&country=${selectedCountry.code}&amount=${selectedPlan.priceUsd}`;
  };

  return (
    <div className="flex flex-col min-h-screen relative p-6 md:p-8 select-none justify-between">
      {/* 1. Header (Top Left Aligned) */}
      <header className="w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.png"
              alt="UnitedUnion eSIM logo"
              className="w-11 h-11 rounded-xl object-contain shadow-sm"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl tracking-tight text-[#1e63ff]">
                UnitedUnion
              </span>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none mt-0.5">
                Stay Always Connected
              </span>
            </div>
          </div>
        </div>
        {/* Thin full-width light divider line */}
        <div className="w-full h-px bg-slate-200/85 mt-5 mb-6 md:mb-12"></div>
      </header>

      {/* 2. Purchase Card Container (Centered) */}
      <main className="flex-1 flex items-center justify-center py-6 md:py-12">
        <div className="w-full max-w-[480px] bg-white border border-slate-200/90 rounded-[28px] p-6 md:p-8 shadow-[0_12px_40px_rgba(30,99,255,0.03)] relative">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center tracking-tight mb-2">
            Select Your eSIM
          </h1>
          <p className="text-sm text-slate-400 text-center mb-8 px-4 leading-relaxed">
            Choose your destination to view available data plans
          </p>

          <div className="space-y-5">
            {/* Country Selector Dropdown */}
            <div className="relative" ref={countryDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsOpenCountryDropdown(!isOpenCountryDropdown);
                  setIsOpenPlanDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-4.5 py-3.5 bg-white border rounded-2xl text-left text-base text-slate-800 transition-all cursor-pointer focus:outline-none ${
                  isOpenCountryDropdown
                    ? 'border-[#1e63ff] ring-2 ring-blue-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {selectedCountry ? (
                    <>
                      <span className="text-xl leading-none">{selectedCountry.flag}</span>
                      <span className="font-medium text-slate-900">{selectedCountry.name}</span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-medium">Select Country...</span>
                  )}
                </div>
                <ChevronsUpDown size={16} className="text-slate-400" />
              </button>

              {isOpenCountryDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 space-y-2">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1e63ff] focus:border-[#1e63ff] text-sm text-slate-800"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto custom-scrollbar pr-1 flex flex-col">
                    {filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(country);
                          setSelectedPlan(null);
                          setIsOpenCountryDropdown(false);
                          setSearchQuery('');
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors cursor-pointer ${
                          selectedCountry?.code === country.code
                            ? 'bg-[#1e63ff]/10 text-[#1e63ff]'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-xl leading-none">{country.flag}</span>
                        <span>{country.name}</span>
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-xs font-medium">
                        No destinations found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Plan Selector Dropdown */}
            <div className="relative" ref={planDropdownRef}>
              <button
                type="button"
                disabled={!selectedCountry}
                onClick={() => {
                  setIsOpenPlanDropdown(!isOpenPlanDropdown);
                  setIsOpenCountryDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-4.5 py-3.5 bg-white border rounded-2xl text-left text-base transition-all focus:outline-none ${
                  !selectedCountry
                    ? 'bg-slate-50/50 border-slate-200/60 text-slate-300 cursor-not-allowed'
                    : isOpenPlanDropdown
                    ? 'border-[#1e63ff] ring-2 ring-blue-500/10 text-slate-800 cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 text-slate-800 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  {selectedPlan ? (
                    <span className="font-medium text-slate-900">
                      {selectedPlan.name} ({selectedPlan.dataGb} GB / {selectedPlan.durationDays} Days)
                    </span>
                  ) : (
                    <span className={`${selectedCountry ? 'text-slate-400' : 'text-slate-300'} font-medium`}>
                      Select a Plan...
                    </span>
                  )}
                </div>
                <ChevronsUpDown size={16} className={selectedCountry ? 'text-slate-400' : 'text-slate-200'} />
              </button>

              {isOpenPlanDropdown && selectedCountry && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-56 overflow-y-auto custom-scrollbar flex flex-col">
                  {selectedCountry.plans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setIsOpenPlanDropdown(false);
                      }}
                      className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        selectedPlan?.id === plan.id
                          ? 'bg-[#1e63ff]/10 text-[#1e63ff]'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span>{plan.name}</span>
                        <span>${plan.priceUsd.toFixed(2)}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {plan.dataGb} GB • Valid for {plan.durationDays} days
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Plan Details Label */}
            {selectedCountry && selectedPlan && (
              <div className="text-center py-1 text-slate-600 font-semibold text-sm animate-fade-in">
                Selected Plan: {selectedPlan.name} ({selectedPlan.dataGb} GB, {selectedPlan.durationDays} Days) - ${selectedPlan.priceUsd.toFixed(2)}
              </div>
            )}

            {/* Submit Continue Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedCountry || !selectedPlan || checkoutLoading}
                onClick={handlePurchase}
                className={`w-full py-4 px-5 rounded-2xl text-center text-sm font-bold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
                  !selectedCountry || !selectedPlan
                    ? 'bg-slate-400 text-white shadow-none cursor-not-allowed opacity-90'
                    : 'bg-[#1e63ff] hover:bg-[#1551df] text-white shadow-blue-500/10 cursor-pointer active:scale-[0.99]'
                }`}
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : selectedPlan ? (
                  <span>Continue to Pay ${selectedPlan.priceUsd.toFixed(2)}</span>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer (Centered) */}
      <footer className="w-full text-center text-xs text-slate-400/80 py-4 flex flex-col items-center gap-1.5 mt-8 border-t border-slate-200/30">
        <span>&copy; {new Date().getFullYear()} UnitedUnion. All rights reserved.</span>
        <a
          href="/console"
          className="text-slate-400 hover:text-[#1e63ff] transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
        >
          Console Panel
        </a>
      </footer>
    </div>
  );
}
