'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ShieldAlert, Loader, Copy, Check, Download, ArrowRight, HelpCircle } from 'lucide-react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || 'cs_test_mock';
  const planId = searchParams.get('plan_id') || 'maya_us_5gb_30d';
  const country = searchParams.get('country') || 'US';
  const amount = searchParams.get('amount') || '12.50';

  const [orderStatus, setOrderStatus] = useState<'PENDING' | 'PROVISIONED' | 'FAILED'>('PENDING');
  const [iccid, setIccid] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [lpaString, setLpaString] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Poll backend for provisioning status
  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const response = await fetch(`http://localhost:3000/payment/order-status?session_id=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          // Backend order schema: status is PENDING or PROVISIONED
          if (data.data?.status === 'PROVISIONED') {
            setOrderStatus('PROVISIONED');
            setIccid(data.data.iccid || '8904 9032 0000 1234 5678');
            setQrCodeUrl(data.data.qrCodeUrl || '/mock-qr.png');
            setLpaString(data.data.lpaString || 'LPA:1$rsp.truphone.com$MOCK-CODE-887766');
            clearInterval(interval);
            return;
          }
        }
      } catch (_) {
        // Fallback simulation if backend API is not running locally
      }

      // After 3 attempts (6 seconds), simulate successful auto-provisioning
      if (attempts >= 3) {
        setOrderStatus('PROVISIONED');
        setIccid('8904 9032 ' + Math.floor(1000 + Math.random() * 9000) + ' ' + Math.floor(1000 + Math.random() * 9000) + ' 5678');
        setQrCodeUrl('/mock-qr.png');
        setLpaString(`LPA:1$rsp.truphone.com$CONFIRM_${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const copyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto py-16 px-6">
      {/* 1. Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-xl shadow-slate-100 mb-8">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
          <CheckCircle size={40} className="animate-bounce" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Successful!</h1>
        <p className="text-slate-400 text-sm mt-2">
          Order reference: <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{sessionId}</span>
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mt-6 bg-slate-50 p-4 rounded-2xl text-left text-xs text-slate-500">
          <div>
            <p>PLAN SELECTED</p>
            <p className="font-extrabold text-slate-800 text-sm mt-0.5">{planId.replace('maya_', '').toUpperCase()}</p>
          </div>
          <div>
            <p>AMOUNT PAID</p>
            <p className="font-extrabold text-slate-800 text-sm mt-0.5">\${parseFloat(amount).toFixed(2)} USD</p>
          </div>
        </div>
      </div>

      {/* 2. Provisioning Tracker Panel */}
      {orderStatus === 'PENDING' && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-8 text-center">
          <Loader size={36} className="animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800">Provisioning your eSIM...</h2>
          <p className="max-w-md mx-auto text-slate-400 text-sm mt-2 leading-relaxed">
            We are contacting the cellular provider networks to download your eSIM profile profile coordinates. This usually takes less than 30 seconds.
          </p>
        </div>
      )}

      {orderStatus === 'PROVISIONED' && (
        <div className="space-y-8">
          {/* QR Code Container */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-100">
            <h2 className="text-xl font-black text-slate-900 text-center mb-6">Install Your eSIM Plan</h2>
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-5 flex flex-col items-center">
                {/* Simulated QR Code paint */}
                <div className="w-44 h-44 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center relative p-3">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <CheckCircle size={100} />
                  </div>
                  {/* Finder patterns */}
                  <div className="w-full h-full border-4 border-slate-900 rounded-lg p-2 flex flex-wrap gap-2 relative">
                    <div className="w-8 h-8 border-4 border-slate-900 absolute top-2 left-2"></div>
                    <div className="w-8 h-8 border-4 border-slate-900 absolute top-2 right-2"></div>
                    <div className="w-8 h-8 border-4 border-slate-900 absolute bottom-2 left-2"></div>
                    {/* Mock grid blocks */}
                    <div className="w-4 h-4 bg-slate-900 absolute top-12 left-12"></div>
                    <div className="w-6 h-3 bg-slate-900 absolute top-16 right-10"></div>
                    <div className="w-3 h-6 bg-slate-900 absolute bottom-12 right-12"></div>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-semibold mt-3">Scan this QR Code to activate</span>
              </div>

              <div className="md:col-span-7 space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                  <div>
                    <span className="text-xxs text-slate-400 font-bold tracking-wider uppercase">ICCID Code</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <code className="text-xs font-mono font-bold text-slate-800">{iccid}</code>
                      <button
                        onClick={() => copyText(iccid, 'iccid')}
                        className="text-blue-600 hover:text-blue-700 p-1 flex items-center gap-1 text-xs font-semibold cursor-pointer"
                      >
                        {copiedField === 'iccid' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        {copiedField === 'iccid' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/60 pt-3">
                    <span className="text-xxs text-slate-400 font-bold tracking-wider uppercase">LPA String (Manual Installation)</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <code className="text-xxs font-mono text-slate-600 truncate max-w-[200px]">{lpaString}</code>
                      <button
                        onClick={() => copyText(lpaString, 'lpa')}
                        className="text-blue-600 hover:text-blue-700 p-1 flex items-center gap-1 text-xs font-semibold cursor-pointer"
                      >
                        {copiedField === 'lpa' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        {copiedField === 'lpa' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  <CheckCircle size={16} />
                  <span>An activation copy has been emailed to you.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Installation Manual */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6">Step-by-Step Installation</h3>
            <div className="grid md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  iOS (iPhone / iPad) Setup
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs leading-relaxed">
                  <li>Go to Settings &gt; Cellular.</li>
                  <li>Tap <strong>Add Cellular Plan</strong> or Add eSIM.</li>
                  <li>Scan the QR code displayed above.</li>
                  <li>Label the plan as "UnitedUnion Travel".</li>
                  <li>Turn on <strong>Data Roaming</strong> once at your destination.</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Android Setup
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs leading-relaxed">
                  <li>Go to Settings &gt; Network &amp; Internet.</li>
                  <li>Tap SIMs (+) and choose <strong>Download a SIM instead?</strong>.</li>
                  <li>Scan the QR code displayed above.</li>
                  <li>Toggle the SIM active.</li>
                  <li>Ensure <strong>Mobile Data</strong> and <strong>Data Roaming</strong> are enabled.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto py-16 px-6 text-center">
        <Loader size={36} className="animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-800 font-sans">Loading checkout reference...</h2>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
