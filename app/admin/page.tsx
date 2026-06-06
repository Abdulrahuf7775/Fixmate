"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { escrowAction, loadDb, updateArtisan } from "@/lib/demo-db";
import { FixMateDB } from "@/lib/types";

const naira = (value: number) => `N${value.toLocaleString()}`;

export default function AdminPage() {
  const [db, setDb] = useState<FixMateDB | null>(null);
  const refresh = () => setDb(loadDb());

  useEffect(() => {
    refresh();
    window.addEventListener("fixmate-db-updated", refresh);
    return () => window.removeEventListener("fixmate-db-updated", refresh);
  }, []);

  if (!db) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <header className="bg-white px-4 sm:px-6 py-4 flex items-center justify-between border-b shadow-sm mb-4">
        <h1 className="text-xl font-bold text-gray-900">FixMate Admin Demo</h1>
        <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">Home</Link>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="bg-green-50 border border-green-100 p-4 rounded-none text-sm text-green-900">
          Demo access only. This panel controls the simulated OPay escrow ledger and artisan verification workflow.
        </div>

        <Section title="Artisan Applications">
          {db.artisans.map((artisan) => (
            <div key={artisan.id} className="p-4 border border-gray-100 rounded-none bg-gray-50 flex flex-col sm:flex-row justify-between gap-3">
              <div>
                <h2 className="font-bold text-gray-900">{artisan.fullName}</h2>
                <p className="text-sm text-gray-500">{artisan.category} | {artisan.location} | {artisan.applicationStatus}</p>
                <p className="text-xs text-gray-500">Trust score: {artisan.trustScore}%</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setDb(updateArtisan(artisan.id, { applicationStatus: "approved", isVerified: true }))} className="px-3 py-2 bg-green-700 text-white text-sm font-bold rounded-none">Approve</button>
                <button onClick={() => setDb(updateArtisan(artisan.id, { applicationStatus: "rejected", isVerified: false }))} className="px-3 py-2 bg-red-600 text-white text-sm font-bold rounded-none">Reject</button>
                <button onClick={() => setDb(updateArtisan(artisan.id, { trustScore: Math.min(100, artisan.trustScore + 5) }))} className="px-3 py-2 bg-white border text-sm font-bold rounded-none">+ Trust</button>
                <button onClick={() => setDb(updateArtisan(artisan.id, { trustScore: Math.max(0, artisan.trustScore - 5) }))} className="px-3 py-2 bg-white border text-sm font-bold rounded-none">- Trust</button>
              </div>
            </div>
          ))}
        </Section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Active Jobs">
            {db.job_requests.map((job) => {
              const diagnosis = db.diagnoses.find((item) => item.id === job.diagnosisId);
              const artisan = db.artisans.find((item) => item.id === job.selectedArtisanId);
              return (
                <div key={job.id} className="p-4 border border-gray-100 rounded-none bg-gray-50">
                  <h2 className="font-bold text-gray-900">{diagnosis?.issue_title ?? job.description}</h2>
                  <p className="text-sm text-gray-500">{job.status.replaceAll("_", " ")} | {artisan?.fullName ?? "No artisan"}</p>
                </div>
              );
            })}
          </Section>

          <Section title="Funded Escrows">
            {db.bookings.map((booking) => {
              const artisan = db.artisans.find((item) => item.id === booking.artisanId);
              return (
                <div key={booking.id} className="p-4 border border-gray-100 rounded-none bg-gray-50">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h2 className="font-bold text-gray-900">{booking.opayReference}</h2>
                      <p className="text-sm text-gray-500">{artisan?.fullName} | {booking.escrowStatus}</p>
                    </div>
                    <p className="font-bold">{naira(booking.quoteAmount)}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setDb(escrowAction(booking.id, "admin_release", "Admin released disputed escrow."))} className="flex-1 py-2 bg-gray-900 text-white rounded-none text-sm font-bold">Release</button>
                    <button onClick={() => setDb(escrowAction(booking.id, "admin_refund", "Admin refunded user after review."))} className="flex-1 py-2 bg-white border border-red-200 text-red-600 rounded-none text-sm font-bold">Refund</button>
                  </div>
                </div>
              );
            })}
          </Section>
        </div>

        <Section title="Disputes">
          {db.disputes.length === 0 && <Empty text="No disputes yet." />}
          {db.disputes.map((dispute) => (
            <div key={dispute.id} className="p-4 border border-red-100 rounded-none bg-red-50">
              <h2 className="font-bold text-red-900">{dispute.reason}</h2>
              <p className="text-sm text-red-700">{dispute.status}</p>
            </div>
          ))}
        </Section>

        <Section title="Ledger">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="border-b"><th className="py-2">Reference</th><th>Action</th><th>Amount</th><th>Platform fee</th><th>Actor</th></tr></thead>
              <tbody>
                {db.escrow_transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100">
                    <td className="py-2 font-mono text-xs">{tx.reference}</td>
                    <td>{tx.action}</td>
                    <td>{naira(tx.amount)}</td>
                    <td>{naira(tx.platformFee)}</td>
                    <td>{tx.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-none shadow-sm border border-gray-200 p-5 sm:p-6 space-y-3">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="p-6 text-center text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-none">{text}</div>;
}
