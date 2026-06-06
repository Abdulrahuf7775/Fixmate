"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import JobChat from "@/components/JobChat";
import { escrowAction, loadDb, saveInventoryItem } from "@/lib/demo-db";
import { FixMateDB } from "@/lib/types";

const naira = (value: number) => `N${value.toLocaleString()}`;

export default function ArtisanDashboardPage() {
  const [db, setDb] = useState<FixMateDB | null>(null);
  const refresh = () => setDb(loadDb());

  useEffect(() => {
    refresh();
    window.addEventListener("fixmate-db-updated", refresh);
    return () => window.removeEventListener("fixmate-db-updated", refresh);
  }, []);

  if (!db) return null;
  const artisan = db.artisans.find((item) => item.applicationStatus === "approved") ?? db.artisans[0];
  const jobs = db.job_requests.filter((job) => job.selectedArtisanId === artisan.id);
  const inventory = db.inventory_items.filter((item) => item.artisanId === artisan.id);

  const run = (bookingId: string, action: "artisan_accept" | "artisan_decline" | "mark_completed") => {
    setDb(escrowAction(bookingId, action));
  };

  const addInventory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setDb(saveInventoryItem({
      artisanId: artisan.id,
      name: String(form.get("name") || ""),
      quantity: Number(form.get("quantity") || 0),
      unit: String(form.get("unit") || "pcs"),
      lowStockAt: Number(form.get("lowStockAt") || 1),
    }));
    event.currentTarget.reset();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-10">
      <header className="bg-white px-4 sm:px-6 py-4 flex items-center justify-between border-b shadow-sm mb-4">
        <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <span className="w-8 h-8 bg-gray-900 rounded-none flex items-center justify-center font-bold text-white text-xl">F</span>
          FixMate Artisan
        </span>
        <div className="flex gap-4 items-center">
          <span className={`text-xs font-bold px-2 py-1 rounded-none ${artisan.isVerified ? "text-green-700 bg-green-100" : "text-orange-700 bg-orange-100"}`}>{artisan.applicationStatus}</span>
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">Logout</Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-6 sm:py-8 px-4 sm:px-6 max-w-6xl mx-auto w-full gap-6">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          <Metric label="Available OPay Balance" value={naira(artisan.artisan_available_balance)} hint="Released after escrow completion" />
          <Metric label="Pending in Escrow" value={naira(artisan.artisan_pending_balance)} hint={`${jobs.length} assigned jobs`} />
          <Metric label="Trust Score" value={`${artisan.trustScore}%`} hint={`${artisan.completedJobs} completed jobs`} green />
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-none shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h1 className="font-bold text-lg text-gray-900">Assigned Jobs</h1>
              <span className="text-sm text-green-700 font-bold bg-green-50 px-2 py-1 rounded-none">{artisan.fullName}</span>
            </div>
            <div className="space-y-5">
              {jobs.length === 0 && <div className="text-center p-8 bg-gray-100 rounded-none text-gray-500 text-sm border border-gray-200">No assigned jobs yet. Select this artisan from a report to create one.</div>}
              {jobs.map((job) => {
                const diagnosis = db.diagnoses.find((item) => item.id === job.diagnosisId);
                const booking = job.bookingId ? db.bookings.find((item) => item.id === job.bookingId) : undefined;
                const user = db.users.find((item) => item.id === job.userId);
                return (
                  <div key={job.id} className="border border-gray-100 rounded-none p-4 bg-gray-50">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div>
                        <h2 className="font-bold text-gray-900">{diagnosis?.issue_title ?? job.description}</h2>
                        <p className="text-xs text-gray-600 mt-1">Customer: {user?.name} | {job.location}</p>
                        <p className="text-xs text-blue-800 mt-2 bg-blue-50 border border-blue-100 p-2">{diagnosis?.summary}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">{booking ? naira(booking.quoteAmount) : "No quote"}</span>
                        <p className="text-xs text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded-none mt-1">{job.status.replaceAll("_", " ")}</p>
                      </div>
                    </div>
                    {booking && (
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button onClick={() => run(booking.id, "artisan_accept")} className="flex-1 py-2 bg-gray-900 text-white rounded-none text-sm font-bold">Accept Job</button>
                        <button onClick={() => run(booking.id, "mark_completed")} className="flex-1 py-2 bg-green-700 text-white rounded-none text-sm font-bold">Mark Completed</button>
                        <button onClick={() => run(booking.id, "artisan_decline")} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-none text-sm font-bold">Decline</button>
                      </div>
                    )}
                    <JobChat jobId={job.id} currentUserType="artisan" />
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Inventory Tracker</h2>
              <div className="space-y-3">
                {inventory.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-none">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                      <p className={`text-xs font-medium ${item.quantity <= item.lowStockAt ? "text-red-500" : "text-green-600"}`}>{item.quantity <= item.lowStockAt ? "Low stock" : "Healthy"}</p>
                    </div>
                    <span className="font-bold text-gray-900">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={addInventory} className="grid grid-cols-2 gap-2 mt-4">
                <input name="name" placeholder="Material" className="col-span-2 border border-gray-300 rounded-none p-2 text-sm" required />
                <input name="quantity" placeholder="Qty" type="number" className="border border-gray-300 rounded-none p-2 text-sm" required />
                <input name="unit" placeholder="Unit" className="border border-gray-300 rounded-none p-2 text-sm" required />
                <input name="lowStockAt" placeholder="Low at" type="number" className="border border-gray-300 rounded-none p-2 text-sm" required />
                <button className="bg-gray-900 text-white rounded-none text-sm font-bold">Add</button>
              </form>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, hint, green = false }: { label: string; value: string; hint: string; green?: boolean }) {
  return (
    <div className="bg-white p-6 rounded-none shadow-sm border border-gray-200">
      <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
      <h2 className={`text-3xl font-bold ${green ? "text-green-700" : "text-gray-900"}`}>{value}</h2>
      <p className="text-xs text-gray-500 mt-2 font-medium">{hint}</p>
    </div>
  );
}
