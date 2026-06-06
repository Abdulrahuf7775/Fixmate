"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import JobChat from "@/components/JobChat";
import { DEMO_USER_ID, escrowAction, loadDb, saveReview } from "@/lib/demo-db";
import { Booking, DiagnosisRecord, FixMateDB, JobRequest } from "@/lib/types";

const naira = (value: number) => `N${value.toLocaleString()}`;

export default function DashboardPage() {
  const [db, setDb] = useState<FixMateDB | null>(null);
  const [reviewText, setReviewText] = useState("");

  const refresh = () => setDb(loadDb());
  useEffect(() => {
    refresh();
    window.addEventListener("fixmate-db-updated", refresh);
    return () => window.removeEventListener("fixmate-db-updated", refresh);
  }, []);

  if (!db) return null;
  const user = db.users.find((item) => item.id === DEMO_USER_ID) ?? db.users[0];
  const jobs = db.job_requests.filter((job) => job.userId === user.id);
  const active = jobs.find((job) => !["released", "refunded", "declined"].includes(job.status)) ?? jobs[0];
  const booking = active?.bookingId ? db.bookings.find((item) => item.id === active.bookingId) : undefined;
  const diagnosis = active ? db.diagnoses.find((item) => item.id === active.diagnosisId) : undefined;
  const artisan = active?.selectedArtisanId ? db.artisans.find((item) => item.id === active.selectedArtisanId) : undefined;

  const run = (action: "user_release" | "open_dispute") => {
    if (!booking) return;
    setDb(escrowAction(booking.id, action, action === "open_dispute" ? "Customer opened a dispute from dashboard." : ""));
  };

  const submitReview = () => {
    if (!active || !reviewText.trim()) return;
    setDb(saveReview(active.id, 5, reviewText.trim()));
    setReviewText("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-10">
      <header className="bg-white px-4 sm:px-6 py-4 flex items-center justify-between border-b shadow-sm mb-4">
        <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <span className="w-8 h-8 bg-green-600 rounded-none flex items-center justify-center font-bold text-white text-xl">F</span>
          FixMate Dashboard
        </span>
        <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">Logout</Link>
      </header>

      <main className="flex-1 flex flex-col items-center py-6 sm:py-8 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="w-full bg-white rounded-none shadow-sm border border-gray-200 p-5 sm:p-6 mb-6 flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
          <div>
            <p className="text-gray-500 text-sm font-medium">Hello, {user.name}</p>
            <h1 className="text-2xl font-bold text-gray-900">Your repair jobs</h1>
          </div>
          <Link href="/report" className="px-5 py-2.5 bg-green-700 text-white text-sm font-bold rounded-none shadow hover:bg-green-800 text-center">New Job Request</Link>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white rounded-none shadow-sm border border-gray-200 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Active Job</h2>
            {!active || !diagnosis ? (
              <Empty text="No jobs yet. Create a report to see live job status here." />
            ) : (
              <div className="border border-gray-100 rounded-none p-4 bg-gray-50">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{diagnosis.issue_title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Artisan: {artisan?.fullName ?? "Not selected yet"}</p>
                    <p className="text-xs text-gray-500 mt-1">Status: {active.status.replaceAll("_", " ")}</p>
                  </div>
                  {booking && (
                    <div className="text-right">
                      <span className="font-bold text-gray-900 text-lg">{naira(booking.quoteAmount)}</span>
                      <p className="text-xs text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded-none mt-1">{booking.escrowStatus}</p>
                    </div>
                  )}
                </div>
                {booking && (
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <button onClick={() => run("user_release")} disabled={!["completed", "accepted", "funded"].includes(booking.escrowStatus)} className="flex-1 py-2 bg-gray-900 text-white rounded-none text-sm font-bold disabled:opacity-50">Release Funds</button>
                    <button onClick={() => run("open_dispute")} disabled={booking.escrowStatus === "released"} className="flex-1 py-2 bg-white border border-red-200 text-red-600 rounded-none text-sm font-bold disabled:opacity-50">Open Dispute</button>
                    <Link href={`/booking?bookingId=${booking.id}`} className="flex-1 py-2 bg-white border border-gray-200 text-gray-800 rounded-none text-sm font-bold text-center">Escrow Details</Link>
                  </div>
                )}
                <JobChat jobId={active.id} currentUserType="user" />
                {active.status === "released" && (
                  <div className="mt-4 flex gap-2">
                    <input value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Leave a short review" className="flex-1 border border-gray-300 rounded-none px-3 py-2 text-sm" />
                    <button onClick={submitReview} className="px-4 py-2 bg-green-700 text-white rounded-none text-sm font-bold">Review</button>
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Demo Wallet</h2>
              <div className="bg-gray-900 text-white p-5 rounded-none shadow-inner mb-4">
                <p className="text-gray-400 text-xs font-medium uppercase mb-1">Available Balance</p>
                <h3 className="text-3xl font-bold font-mono tracking-tight">{naira(user.user_wallet_balance)}</h3>
                <p className="text-xs mt-3 text-green-400">Escrow held: {naira(user.escrow_balance)}</p>
              </div>
              <p className="text-xs text-gray-500">This is a simulated OPay wallet for demo only.</p>
            </div>
            <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Jobs</h2>
              <div className="space-y-3">
                {jobs.map((job) => {
                  const itemDiagnosis = db.diagnoses.find((item) => item.id === job.diagnosisId);
                  const itemBooking = job.bookingId ? db.bookings.find((item) => item.id === job.bookingId) : undefined;
                  return <JobRow key={job.id} job={job} diagnosis={itemDiagnosis} booking={itemBooking} />;
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function JobRow({ job, diagnosis, booking }: { job: JobRequest; diagnosis?: DiagnosisRecord; booking?: Booking }) {
  return (
    <div className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-semibold text-gray-900 text-sm">{diagnosis?.issue_title ?? job.description}</p>
        <p className="text-xs text-gray-500 font-medium">{job.status.replaceAll("_", " ")}</p>
      </div>
      <p className="font-bold text-gray-900 text-sm">{booking ? naira(booking.quoteAmount) : "No booking"}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-center p-8 bg-gray-100 rounded-none text-gray-500 text-sm border border-gray-200">{text}</div>;
}
