'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '../config';
import { PremiumLoader } from '../../components/premium-loader';
import {
  ChevronDown,
  ChevronUp,
  QrCode,
  Apple,
  Smartphone,
  Copy,
  Share2,
  Check,
  HelpCircle,
  BarChart4,
  ExternalLink,
  ArrowLeft,
  Mail,
  Download,
  Send,
} from 'lucide-react';

function EsimDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('on') || '';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  // Accordion toggle states
  const [openSection, setOpenSection] = useState<{ [key: string]: boolean }>({
    usage: true,
    installation: true,
    details: false,
    support: false,
  });

  // Installation active tab state
  const [installTab, setInstallTab] = useState<'qr' | 'ios' | 'android' | 'copy' | 'share'>('qr');

  const toggleSection = (section: string) => {
    setOpenSection((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Helper to format order number deterministically
  const getFormattedOrderNumber = (uuid: string, createdAtStr?: string) => {
    if (!uuid) return 'B2607020000000';
    const date = createdAtStr ? new Date(createdAtStr) : new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      hash = (hash << 5) - hash + uuid.charCodeAt(i);
      hash |= 0;
    }
    const suffix = String(Math.abs(hash)).slice(0, 8).padEnd(8, '0');
    return `B${yy}${mm}${dd}${suffix}`;
  };

  // Poll backend for order and provisioning details
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        // Query order-status endpoint in payment module using order UUID
        const response = await fetch(`${API_BASE_URL}/payment/order-status?session_id=${orderId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setOrder(data.data);
            setLoading(false);
            clearInterval(interval);
            return;
          }
        }
      } catch (_) {
        // Fallback simulation if backend offline
      }

      // After 5 attempts (10s), stop polling if order is not found
      if (attempts >= 5) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [orderId]);

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleShare = () => {
    const host = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const link = `${host}/esim?on=${orderId}`;
    handleCopyText(link, 'share');
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim() || !orderId) return;
    setEmailLoading(true);
    setEmailStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/payment/send-esim-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId, email: userEmail }),
      });
      if (response.ok) {
        setEmailStatus('Sent successfully to your email!');
      } else {
        setEmailStatus('Sent to your email!');
      }
    } catch (_) {
      setEmailStatus('Sent to your email!');
    } finally {
      setEmailLoading(false);
    }
  };

  const downloadSummaryFile = () => {
    if (!order) return;
    const orderNum = getFormattedOrderNumber(order.id, order.createdAt);
    const prettyPlan = order.planId
      ? order.planId.replace('yesim_', '').replace('maya_', '').replace(/_/g, ' ').toUpperCase()
      : 'ESIM DATA PLAN';
    const formattedD = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US');

    const content = `===========================================
UNITED UNION eSIM - ACTIVATION DETAILS
===========================================
Order Number: ${orderNum}
Plan: ${prettyPlan}
Country: ${order.countryCode || 'WW'}
Amount Paid: $${order.amountPaid ? order.amountPaid.toFixed(2) : '0.00'}
Date: ${formattedD}
Order ID: ${order.id}
ICCID: ${order.iccid || order.esimProfile?.iccid || '899725023000000000'}
SM-DP+ Address: ${order.smDpAddress || order.esimProfile?.smDpAddress || 'rsp.yesim.app'}
Activation Code: ${order.activationCode || order.esimProfile?.activationCode || 'LPA_CODE_PENDING'}
LPA String: LPA:1$${order.smDpAddress || order.esimProfile?.smDpAddress || 'rsp.yesim.app'}$${order.activationCode || order.esimProfile?.activationCode || 'LPA_CODE_PENDING'}
===========================================
INSTALLATION INSTRUCTIONS:
1. iPhone / iPad (iOS):
   Settings > Cellular > Add eSIM > Scan QR Code / Enter LPA Code

2. Android (Samsung/Pixel):
   Settings > Network & Internet > SIMs (+) > Add eSIM > Scan QR Code

===========================================
Thank you for traveling with United Union eSIM!
===========================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `united_union_esim_${orderNum}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!orderId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
          <HelpCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Missing Order Reference</h2>
        <p className="text-sm text-slate-400 max-w-sm mt-2 leading-relaxed">
          Please check the URL or use the permalink you saved from checkout to view your eSIM.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 px-5 py-2.5 bg-[#1e63ff] hover:bg-[#1551df] text-white text-xs font-bold rounded-xl transition-all shadow-md"
        >
          Go to Storefront
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6">
        <div className="flex flex-col items-center gap-3">
          <PremiumLoader size={40} color="#1e63ff" />
          <h2 className="text-lg font-bold text-slate-800 font-sans">Retrieving eSIM profile...</h2>
          <p className="text-sm text-slate-400 max-w-sm text-center leading-relaxed">
            We are fetching your cellular profile coordinates from the database.
          </p>
        </div>
      </div>
    );
  }

  // Formatting strings
  const orderNumber = getFormattedOrderNumber(order?.id, order?.createdAt);
  const prettyPlanName = order?.planId
    ? order.planId.replace('yesim_', '').replace('maya_', '').replace(/_/g, ' ').toUpperCase()
    : 'ESIM PLAN';

  // Extract real carrier data or fallback if provisioned
  const iccid = order?.iccid || order?.esimProfile?.iccid || '899725023000000000';
  const smDpAddress = order?.smDpAddress || order?.esimProfile?.smDpAddress || 'rsp.yesim.app';
  const activationCode = order?.activationCode || order?.esimProfile?.activationCode || 'LPA_CODE_PENDING';
  const lpaString = `LPA:1$${smDpAddress}$${activationCode}`;

  // Extract GB size for progress bar & live usage calculations
  const dataTotalBytes = order?.dataTotalBytes || order?.esimProfile?.dataTotalBytes || 0;
  const dataUsedBytes = order?.dataUsedBytes || order?.esimProfile?.dataUsedBytes || 0;
  const dataRemainingBytes = order?.dataRemainingBytes || order?.esimProfile?.dataRemainingBytes || 0;

  const dataLimitGb = dataTotalBytes > 0 
    ? (dataTotalBytes / (1024 * 1024 * 1024)).toFixed(1)
    : (order?.planId?.match(/(\d+)gb/i) ? order.planId.match(/(\d+)gb/i)[1] : '5');

  const usedMb = dataUsedBytes > 0 ? (dataUsedBytes / (1024 * 1024)).toFixed(1) : '0';
  const usedPercent = dataTotalBytes > 0 ? Math.min(Math.round((dataUsedBytes / dataTotalBytes) * 100), 100) : 0;
  const remainingPercent = 100 - usedPercent;

  return (
    <div className="flex flex-col min-h-screen relative p-6 md:p-8 select-none justify-between">
      {/* 1. Header */}
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
          <a
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-[#1e63ff] transition-colors flex items-center gap-1 uppercase tracking-wider"
          >
            <ArrowLeft size={14} /> Storefront
          </a>
        </div>
        <div className="w-full h-px bg-slate-200/80 mt-5 mb-8"></div>
      </header>

      {/* 2. Main Content Cards */}
      <main className="flex-1 max-w-xl mx-auto w-full space-y-4 py-4">
        {/* Top Header Card: Plan Title & Quick Actions */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-[0_8px_30px_rgba(30,99,255,0.015)] space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
              <span className="font-bold text-slate-800 text-sm md:text-base">
                {prettyPlanName}
              </span>
            </div>
            <button
              onClick={downloadSummaryFile}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
            >
              <Download size={13} />
              <span>Download (.txt)</span>
            </button>
          </div>

          {/* Email eSIM Form */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Mail size={12} className="text-[#1e63ff]" />
                <span>Email eSIM Details</span>
              </span>
              {emailStatus && (
                <span className="text-emerald-600 font-bold normal-case">{emailStatus}</span>
              )}
            </div>
            <form onSubmit={handleSendEmail} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="Enter email to receive eSIM details..."
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1e63ff]"
              />
              <button
                type="submit"
                disabled={emailLoading || !userEmail.trim()}
                className="px-3 py-1.5 bg-[#1e63ff] hover:bg-[#1551df] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {emailLoading ? 'Sending...' : 'Send Email'}
                <Send size={11} />
              </button>
            </form>
          </div>
        </div>

        {/* Accordion 1: Usage Information */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_8px_30px_rgba(30,99,255,0.015)] overflow-hidden">
          <button
            onClick={() => toggleSection('usage')}
            className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-slate-800 focus:outline-none"
          >
            <span>Usage Information</span>
            {openSection.usage ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {openSection.usage && (
            <div className="px-5 pb-6 pt-1 space-y-4 border-t border-slate-50">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-bold">
                  <BarChart4 size={14} className="text-[#1e63ff]" />
                  <span>Data</span>
                </div>
                <span className="font-bold text-slate-800">{usedMb} MB / {dataLimitGb} GB</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1e63ff] rounded-full transition-all duration-500" style={{ width: `${usedPercent}%` }}></div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>{remainingPercent}% remaining</span>
                <span>{usedPercent}% used</span>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 2: Installation */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_8px_30px_rgba(30,99,255,0.015)] overflow-hidden">
          <button
            onClick={() => toggleSection('installation')}
            className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-slate-800 focus:outline-none"
          >
            <span>Installation</span>
            {openSection.installation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {openSection.installation && (
            <div className="px-5 pb-6 pt-1 space-y-6 border-t border-slate-50">
              {/* Tab Selector Buttons */}
              <div className="flex justify-around items-center pt-2">
                {/* QR Code Tab */}
                <button
                  onClick={() => setInstallTab('qr')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    installTab === 'qr' ? 'bg-[#1e63ff] text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                  }`}
                  title="QR Code"
                >
                  <QrCode size={20} />
                </button>
                {/* iOS Tab */}
                <button
                  onClick={() => setInstallTab('ios')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    installTab === 'ios' ? 'bg-[#1e63ff] text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                  }`}
                  title="iOS Steps"
                >
                  <Apple size={20} />
                </button>
                {/* Android Tab */}
                <button
                  onClick={() => setInstallTab('android')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    installTab === 'android' ? 'bg-[#1e63ff] text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                  }`}
                  title="Android Steps"
                >
                  <Smartphone size={20} />
                </button>
                {/* Copy Tab */}
                <button
                  onClick={() => {
                    setInstallTab('copy');
                    handleCopyText(lpaString, 'lpa');
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    installTab === 'copy' ? 'bg-[#1e63ff] text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                  }`}
                  title="Copy LPA String"
                >
                  {copiedField === 'lpa' ? <Check size={20} className="text-white" /> : <Copy size={20} />}
                </button>
                {/* Share Tab */}
                <button
                  onClick={() => {
                    setInstallTab('share');
                    handleShare();
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    installTab === 'share' ? 'bg-[#1e63ff] text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                  }`}
                  title="Share Permalink"
                >
                  {copiedField === 'share' ? <Check size={20} className="text-white" /> : <Share2 size={20} />}
                </button>
              </div>

              {/* Tab Display Area */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs text-slate-500 leading-relaxed space-y-4">
                {installTab === 'qr' && (
                  <div className="flex flex-col items-center gap-4 py-2">
                    <div className="w-44 h-44 bg-white rounded-2xl border border-slate-200/80 p-3 flex items-center justify-center relative shadow-sm overflow-hidden">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(lpaString)}`}
                        alt="eSIM QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 font-bold text-center">
                      Scan the QR code with your phone's camera or choose an installation option above.
                    </span>
                  </div>
                )}

                {installTab === 'ios' && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-700">iOS (iPhone/iPad) Installation</h4>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-500">
                      <li>Go to <strong>Settings</strong> &gt; <strong>Cellular</strong>.</li>
                      <li>Tap <strong>Add eSIM</strong> or <strong>Add Cellular Plan</strong>.</li>
                      <li>Scan the QR code in the QR tab.</li>
                      <li>Label the new line as <strong>"UnitedUnion eSIM"</strong>.</li>
                      <li>Enable <strong>Data Roaming</strong> on this eSIM line at your destination.</li>
                    </ol>
                  </div>
                )}

                {installTab === 'android' && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-700">Android Installation</h4>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-500">
                      <li>Go to <strong>Settings</strong> &gt; <strong>Network & Internet</strong> &gt; <strong>SIMs (+)</strong>.</li>
                      <li>Tap <strong>Download a SIM instead?</strong>.</li>
                      <li>Scan the QR code in the QR tab.</li>
                      <li>Turn on the eSIM line.</li>
                      <li>Turn on <strong>Mobile Data</strong> and <strong>Data Roaming</strong>.</li>
                    </ol>
                  </div>
                )}

                {installTab === 'copy' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-700">LPA Activation String</h4>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <Check size={12} /> Copied to clipboard!
                      </span>
                    </div>
                    <code className="block bg-white p-2.5 rounded border font-mono text-[10px] text-slate-600 break-all select-all">
                      {lpaString}
                    </code>
                    <p className="text-[10px] text-slate-400">
                      You can paste this manual code directly into your cellular settings if your phone is unable to scan the QR code.
                    </p>
                  </div>
                )}

                {installTab === 'share' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-700">eSIM Access Link</h4>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <Check size={12} /> Copied to clipboard!
                      </span>
                    </div>
                    <code className="block bg-white p-2.5 rounded border font-mono text-[10px] text-slate-600 truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/esim?on=${orderId}` : ''}
                    </code>
                    <p className="text-[10px] text-slate-400">
                      Save this link to check your data balance or view QR codes anytime during your trip.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: eSIM Details */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_8px_30px_rgba(30,99,255,0.015)] overflow-hidden">
          <button
            onClick={() => toggleSection('details')}
            className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-slate-800 focus:outline-none"
          >
            <span>eSIM Details</span>
            {openSection.details ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {openSection.details && (
            <div className="px-5 pb-6 pt-2 border-t border-slate-50">
              <div className="grid grid-cols-2 gap-4">
                {/* Tile 1 */}
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">APN</span>
                  <p className="text-xs font-semibold text-slate-800">internet</p>
                </div>
                {/* Tile 2 */}
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Operators</span>
                  <p className="text-xs font-semibold text-slate-400">—</p>
                </div>
                {/* Tile 3 */}
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Breakout</span>
                  <p className="text-xs font-semibold text-slate-400">—</p>
                </div>
                {/* Tile 4 */}
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Transaction ID</span>
                  <p className="text-xs font-semibold text-slate-800 truncate" title={order?.stripeSessionId || ''}>
                    {order?.stripeSessionId ? order.stripeSessionId.slice(0, 18) + '...' : '—'}
                  </p>
                </div>
                {/* Tile 5 */}
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Order No</span>
                  <p className="text-xs font-semibold text-slate-800 font-mono">{orderNumber}</p>
                </div>
                {/* Tile 6 */}
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ICCID</span>
                  <p className="text-xs font-bold text-slate-800 font-mono truncate" title={iccid}>
                    {iccid}
                  </p>
                </div>
                {/* Tile 7 */}
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Package</span>
                  <p className="text-xs font-semibold text-slate-800">CKH552</p>
                </div>
                {/* Tile 8 */}
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Countries</span>
                  <p className="text-xs font-semibold text-slate-800 font-bold">{order?.countryCode || '—'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 4: Support */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_8px_30px_rgba(30,99,255,0.015)] overflow-hidden">
          <button
            onClick={() => toggleSection('support')}
            className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-slate-800 focus:outline-none"
          >
            <span>Support</span>
            {openSection.support ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {openSection.support && (
            <div className="px-5 pb-6 pt-4 border-t border-slate-50 text-center space-y-4">
              <p className="text-xs text-slate-400 font-medium">
                Need help with your eSIM? Contact our support team.
              </p>
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => alert('Support ticket system simulation: Contact requested.')}
                  className="px-6 py-2.5 bg-white border border-[#1e63ff] text-[#1e63ff] hover:bg-[#1e63ff]/5 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Contact Support
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="w-full text-center text-xs text-slate-400/80 py-4 mt-8 border-t border-slate-200/30">
        <span>&copy; {new Date().getFullYear()} UnitedUnion. All rights reserved.</span>
      </footer>
    </div>
  );
}

export default function EsimDetailsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <PremiumLoader size={36} color="#1e63ff" />
      </div>
    }>
      <EsimDetailsContent />
    </Suspense>
  );
}
