"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle, ChevronLeft, Shield, Wallet } from "lucide-react";
import { escrowAction, loadDb } from "@/lib/demo-db";
import { Artisan, Booking, DiagnosisRecord, FixMateDB, JobRequest } from "@/lib/types";

const naira = (value: number) => `N${value.toLocaleString()}`;

export default function BookingPage() {
  const router = useRouter();
  const [db, setDb] = useState<FixMateDB | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("bookingId");
    const loaded = loadDb();
    setBookingId(id || loaded.bookings[0]?.id || null);
    setDb(loaded);
  }, []);

  const data = useMemo(() => {
    if (!db || !bookingId) return null;
    const booking = db.bookings.find((item) => item.id === bookingId) as Booking | undefined;
    const job = booking ? db.job_requests.find((item) => item.id === booking.jobId) as JobRequest | undefined : undefined;
    const artisan = booking ? db.artisans.find((item) => item.id === booking.artisanId) as Artisan | undefined : undefined;
    const diagnosis = job ? db.diagnoses.find((item) => item.id === job.diagnosisId) as DiagnosisRecord | undefined : undefined;
    const user = booking ? db.users.find((item) => item.id === booking.userId) : undefined;
    return booking && job && artisan && diagnosis && user ? { booking, job, artisan, diagnosis, user } : null;
  }, [db, bookingId]);

  const runAction = (action: "fund_escrow" | "user_release" | "open_dispute") => {
    if (!data) return;
    setIsWorking(true);
    setError("");
    try {
      setDb(escrowAction(data.booking.id, action, action === "open_dispute" ? "User reports the job is not resolved yet." : ""));
      if (action === "user_release") setTimeout(() => router.push("/dashboard"), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsWorking(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Link href="/report" className="text-green-700 font-bold">Create a job request first</Link>
      </div>
    );
  }

  const { booking, artisan, diagnosis, user } = data;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans mb-20 animate-fade-in-up">
      <header className="bg-white px-4 sm:px-6 py-4 flex items-center border-b shadow-sm mb-4">
        <Link href="/report" className="text-gray-500 hover:text-gray-800 mr-4 font-bold flex items-center gap-1">
          <ChevronLeft className="w-5 h-5" /> Back
        </Link>
        <span className="text-xl font-bold text-gray-900 tracking-tight">Simulated OPay Escrow</span>
      </header>

      <main className="flex-1 flex flex-col items-center py-6 sm:py-8 px-4 sm:px-6 max-w-xl mx-auto w-full">
        <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200 w-full mb-6 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <Image unoptimized src={artisan.avatar} alt={artisan.fullName} width={64} height={64} className="rounded-none border border-gray-200" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{artisan.fullName}</h1>
              <p className="text-gray-500 text-sm">{artisan.category} | Trust: {artisan.trustScore}%</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-none p-4 border border-gray-100 mb-2">
            <Row label="Issue" value={diagnosis.issue_title} />
            <Row label="Quote uses numeric Gemini max" value={naira(booking.quoteAmount)} />
            <Row label="User escrow fee (2%)" value={naira(booking.userFee)} />
            <Row label="Artisan completion fee (10%)" value={`${naira(booking.artisanFee)} deducted from payout`} />
            <Row label="Ledger reference" value={booking.opayReference} />
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-green-50 text-green-900 font-bold rounded-none border border-green-100">
            <span>Total user charge</span>
            <span>{naira(booking.totalCharge)}</span>
          </div>
        </div>

        <div className="w-full bg-white p-6 rounded-none shadow-sm border border-gray-200">
          {booking.escrowStatus === "not_funded" && (
            <>
              <div className="relative w-full h-24 flex items-center justify-center mb-6">
                <Wallet className="w-10 h-10 text-gray-800" strokeWidth={1.5} />
                <Shield className="w-6 h-6 text-green-700 absolute bottom-2 ml-10 bg-white rounded-none p-0.5 border border-gray-100" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-3 mb-6 bg-green-50 p-3 rounded-none border border-green-100">
                <Shield className="w-6 h-6 text-green-700" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Simulated OPay escrow ledger</p>
                  <p className="text-xs text-green-700 mt-0.5">No real OPay API is connected. This demo records ledger movements transparently.</p>
                </div>
              </div>
              <Row label="Wallet balance" value={naira(user.user_wallet_balance)} />
              {error && <p className="text-sm text-red-600 my-3">{error}</p>}
              <button onClick={() => runAction("fund_escrow")} disabled={isWorking} className="w-full mt-6 py-4 bg-green-700 text-white font-bold text-lg rounded-none shadow hover:bg-green-800 disabled:opacity-50">
                {isWorking ? "Funding..." : "Fund Escrow & Dispatch"}
              </button>
            </>
          )}

          {booking.escrowStatus !== "not_funded" && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-gray-50 text-green-700 rounded-none flex items-center justify-center mx-auto mb-4 border-2 border-green-600">
                <Shield className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Escrow status: {booking.escrowStatus}</h2>
              <p className="text-gray-600 text-sm mb-6">{naira(booking.quoteAmount)} is tracked in the simulated escrow ledger.</p>
              <div className="border border-gray-200 rounded-none p-4 bg-gray-50 mb-6 text-left flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-700 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Release only after completion</p>
                  <p className="text-xs text-gray-500">The artisan receives {naira(booking.quoteAmount - booking.artisanFee)} after the 10% artisan fee.</p>
                </div>
              </div>
              <button onClick={() => runAction("user_release")} disabled={isWorking || !["completed", "accepted", "funded"].includes(booking.escrowStatus)} className="w-full py-4 bg-gray-900 text-white font-bold text-lg rounded-none shadow hover:bg-gray-800 disabled:opacity-50">
                Release Funds
              </button>
              <button onClick={() => runAction("open_dispute")} disabled={isWorking || booking.escrowStatus === "released"} className="w-full mt-3 py-3 text-red-600 font-semibold text-sm hover:bg-red-50 rounded-none border border-transparent hover:border-red-100 disabled:opacity-50">
                Open Dispute
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 items-center mb-2 last:mb-0">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className="font-semibold text-gray-900 text-sm text-right">{value}</span>
    </div>
  );
}
