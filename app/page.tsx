'use client';

import React, { useState } from 'react';
import { Search, Globe, Shield, RefreshCw, Smartphone, Check, ArrowRight, User } from 'lucide-react';

interface CountryItem {
  name: string;
  code: string;
  flag: string;
  plans: {
    id: string;
    name: string;
    dataGb: number;
    durationDays: number;
    priceUsd: number;
  }[];
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
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryItem | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Filter countries by search query
  const filteredCountries = SUPPORTED_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePurchase = async (planId: string, amount: number, countryCode: string) => {
    setCheckoutLoading(planId);

    // Try redirecting to backend checkout, or simulate checkout on failure
    try {
      const response = await fetch('http://localhost:3000/payment/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          countryCode,
          amount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.url) {
          window.location.href = data.data.url; // Redirect to Stripe
          return;
        }
      }
    } catch (_) {
      // API Offline/Fallback simulation mode
    }

    // Local simulation fallback
    await new Promise((resolve) => setTimeout(resolve, 800));
    const mockSessionId = `cs_test_${Math.random().toString(36).substring(2, 12)}`;
    window.location.href = `/checkout/success?session_id=${mockSessionId}&plan_id=${planId}&country=${countryCode}&amount=${amount}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. Header Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/20">
              U
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              UnitedUnion <span className="text-blue-600">eSIM</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#destinations" className="hover:text-blue-600 transition-colors">Destinations</a>
            <a href="#compatibility" className="hover:text-blue-600 transition-colors">Device Compatibility</a>
            <a href="#help" className="hover:text-blue-600 transition-colors">Help Center</a>
          </nav>
          <a
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow-md shadow-slate-950/10"
          >
            <User size={16} />
            Admin Panel
          </a>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="px-6 py-20 bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wide uppercase inline-block mb-4">
            ✈️ Next-Gen Travel Data
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6">
            Global eSIM Connectivity.<br />
            <span className="text-blue-600 bg-clip-text">Instant Setup.</span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-slate-500 leading-relaxed mb-10">
            Stay connected in over 190+ countries with prepaid local data plans. No physical SIM card swaps, no roaming fees.
          </p>

          {/* Search Box */}
          <div className="max-w-md mx-auto relative mb-16" id="destinations">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search your destination country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4.5 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 shadow-xl shadow-slate-100 placeholder-slate-400 text-base transition-all"
            />
          </div>
        </div>
      </section>

      {/* 3. Catalog Listing & Plans Selector */}
      <section className="px-6 pb-24 max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-12 gap-8">
          {/* Countries Selector */}
          <div className="md:col-span-5">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">Supported Destinations</h2>
            <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-2">
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setSelectedCountry(c)}
                  className={`flex items-center justify-between p-4 rounded-2xl text-left border transition-all ${
                    selectedCountry?.code === c.code
                      ? 'bg-blue-600 border-transparent text-white shadow-lg shadow-blue-500/20'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.flag}</span>
                    <div>
                      <p className="font-bold text-base">{c.name}</p>
                      <p className={`text-xs ${selectedCountry?.code === c.code ? 'text-white/80' : 'text-slate-400'}`}>
                        {c.plans.length} plans available
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={18} className={selectedCountry?.code === c.code ? 'text-white' : 'text-slate-400'} />
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-2xl">
                  <Globe className="mx-auto text-slate-300 mb-3" size={36} />
                  <p className="text-slate-400 font-semibold text-sm">No countries match your search</p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Country Plans */}
          <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
            {selectedCountry ? (
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <span className="text-3xl">{selectedCountry.flag}</span>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{selectedCountry.name} eSIM Plans</h3>
                    <p className="text-sm text-slate-400">Select a data plan that fits your itinerary</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {selectedCountry.plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all bg-slate-50/50"
                    >
                      <div className="mb-4 sm:mb-0">
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-bold text-xs">
                          {plan.dataGb} GB Plan
                        </span>
                        <h4 className="font-extrabold text-lg text-slate-800 mt-2">{plan.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Valid for {plan.durationDays} days • Nationwide coverage
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-start gap-4">
                        <span className="text-2xl font-black text-slate-900">\${plan.priceUsd.toFixed(2)}</span>
                        <button
                          onClick={() => handlePurchase(plan.id, plan.priceUsd, selectedCountry.code)}
                          disabled={checkoutLoading !== null}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-50"
                        >
                          {checkoutLoading === plan.id ? 'Loading...' : 'Buy Now'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                  <Globe size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Select a Destination</h3>
                <p className="max-w-xs text-slate-400 text-sm mt-1">
                  Choose a country from the supported list on the left to configure your local data plan.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section className="bg-white border-y border-slate-200/80 px-6 py-20" id="compatibility">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-16">Why Travel with UnitedUnion eSIM?</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Smartphone size={24} />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">100% Digital Setup</h3>
              <p className="text-sm text-slate-400">
                Forget queueing at airport booths. Buy, scan the QR code, and get online immediately.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Shield size={24} />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">Keep Your Original Number</h3>
              <p className="text-sm text-slate-400">
                Your physical SIM card stays active in your phone so you never miss WhatsApp messages or calls.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <RefreshCw size={24} />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">Flexible Top-Ups</h3>
              <p className="text-sm text-slate-400">
                Running low on data? Re-charge your eSIM package instantly directly through our app or portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="bg-slate-900 text-slate-400 px-6 py-12 text-sm border-t border-slate-800" id="help">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg">
              U
            </div>
            <span className="font-bold text-white text-base">UnitedUnion eSIM</span>
          </div>
          <p>© 2026 UnitedUnion Inc. All rights reserved. Powered by Maya Mobile.</p>
        </div>
      </footer>
    </div>
  );
}
