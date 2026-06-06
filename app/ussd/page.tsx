"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { escrowAction, loadDb } from "@/lib/demo-db";
import { FixMateDB } from "@/lib/types";

export default function UssdPage() {
  const [db, setDb] = useState<FixMateDB | null>(null);
  const [screen, setScreen] = useState("*955*349#\n1. Request artisan\n2. Check job status\n3. Fund escrow\n4. Release payment\n5. Report dispute");
  const [input, setInput] = useState("");

  useEffect(() => setDb(loadDb()), []);
  const latestBooking = db?.bookings[0];
  const latestJob = latestBooking ? db?.job_requests.find((job) => job.id === latestBooking.jobId) : db?.job_requests[0];

  const send = () => {
    const value = input.trim();
    setInput("");
    if (value === "1") {
      setScreen("FixMate: Artisan request started.\nVisit /report to add photo and Gemini diagnosis.\n0. Back");
      return;
    }
    if (value === "2") {
      setScreen(`FixMate job status:\n${latestJob ? latestJob.status.replaceAll("_", " ") : "No job found"}\n0. Back`);
      return;
    }
    if (value === "3" && latestBooking) {
      setDb(escrowAction(latestBooking.id, "fund_escrow"));
      setScreen(`Escrow funded.\nRef: ${latestBooking.opayReference}\n0. Back`);
      return;
    }
    if (value === "4" && latestBooking) {
      setDb(escrowAction(latestBooking.id, "user_release"));
      setScreen("Payment release submitted.\nArtisan payout ledger updated.\n0. Back");
      return;
    }
    if (value === "5" && latestBooking) {
      setDb(escrowAction(latestBooking.id, "open_dispute", "USSD dispute report."));
      setScreen("Dispute reported.\nAdmin will review escrow.\n0. Back");
      return;
    }
    setScreen("*955*349#\n1. Request artisan\n2. Check job status\n3. Fund escrow\n4. Release payment\n5. Report dispute");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-8 font-sans">
      <div className="w-full max-w-sm bg-gray-950 text-green-300 rounded-[2rem] p-4 shadow-xl border-8 border-gray-800">
        <div className="bg-black rounded-none min-h-[520px] p-5 flex flex-col">
          <div className="text-center text-xs text-gray-400 mb-4">FixMate USSD Simulator</div>
          <pre className="flex-1 whitespace-pre-wrap font-mono text-lg leading-8">{screen}</pre>
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 bg-gray-900 border border-gray-700 rounded-none px-3 py-3 text-white outline-none" placeholder="Reply" />
            <button onClick={send} className="px-4 bg-green-700 text-white rounded-none font-bold">Send</button>
          </div>
        </div>
      </div>
      <Link href="/" className="mt-6 text-sm text-gray-600 hover:text-gray-900">Back home</Link>
    </div>
  );
}
