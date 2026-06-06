"use client";

import {
  Artisan,
  ArtisanCategory,
  Booking,
  DiagnosisRecord,
  Dispute,
  EscrowAction,
  EscrowTransaction,
  FixMateDB,
  InventoryItem,
  JobDiagnosis,
  JobRequest,
  JobStatus,
  Review,
  User,
} from "@/lib/types";

const STORAGE_KEY = "fixmate_mvp_db_v2";
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const money = (value: number) => Math.max(0, Math.round(value));

export const DEMO_USER_ID = "user-demo-1";

export function opayReference(sequence: number) {
  return `OPAY-FIX-2026-${String(sequence).padStart(4, "0")}`;
}

export function seedDb(): FixMateDB {
  const createdAt = now();
  const users: User[] = [
    {
      id: DEMO_USER_ID,
      name: "Chukwudi Eze",
      phone: "08030000001",
      location: "Yaba, Lagos",
      user_wallet_balance: 250000,
      escrow_balance: 0,
      createdAt,
    },
  ];

  const artisans: Artisan[] = [
    ["artisan-1", "Opeyemi Ahmed", "AC Repair", "Ikeja, Lagos", 96, 45, true, "https://i.pravatar.cc/150?img=11"],
    ["artisan-2", "Chinedu Okafor", "Plumber", "Surulere, Lagos", 92, 112, true, "https://i.pravatar.cc/150?img=12"],
    ["artisan-3", "Emeka Johnson", "Generator Repair", "Lekki, Lagos", 94, 210, true, "https://i.pravatar.cc/150?img=14"],
    ["artisan-4", "Ibrahim Musa", "Electrician", "Gbagada, Lagos", 83, 34, false, "https://i.pravatar.cc/150?img=15"],
    ["artisan-5", "Aisha Bello", "Cleaning", "Victoria Island, Lagos", 98, 300, true, "https://i.pravatar.cc/150?img=9"],
    ["artisan-6", "Mercy Adeyemi", "Tailor", "Ikeja, Lagos", 95, 211, true, "https://i.pravatar.cc/150?img=44"],
  ].map(([artisanId, fullName, category, location, trustScore, completedJobs, verified, avatar]) => ({
    id: artisanId as string,
    fullName: fullName as string,
    phone: "08090000000",
    category: category as ArtisanCategory,
    location: location as string,
    yearsExperience: 5,
    verificationId: "NIN placeholder uploaded",
    skills: [category as string, "Diagnostics", "Emergency support"],
    serviceRadiusKm: 12,
    opayPhone: "08090000000",
    trustScore: trustScore as number,
    completedJobs: completedJobs as number,
    isVerified: verified as boolean,
    applicationStatus: verified ? "approved" : "pending",
    artisan_pending_balance: 0,
    artisan_available_balance: 0,
    avatar: avatar as string,
    createdAt,
  }));

  const diagnosis: DiagnosisRecord = {
    id: "diag-demo-1",
    jobId: "job-demo-1",
    userId: DEMO_USER_ID,
    issue_title: "AC dripping water and blowing warm air",
    summary: "Likely blocked drain line or low refrigerant. The artisan should inspect drainage, filters, and compressor performance.",
    artisan_category: "AC Repair",
    urgency: "Medium",
    estimated_min_naira: 18000,
    estimated_max_naira: 32000,
    estimated_labor_naira: 12000,
    estimated_materials_naira: 20000,
    safety_warning: "Switch off the AC if water is touching sockets or extension boxes.",
    first_aid_steps: ["Turn off the AC unit.", "Keep the area dry.", "Do not open the outdoor unit yourself."],
    follow_up_questions: ["When did it start dripping?", "Has the AC been serviced this year?"],
    createdAt,
  };

  const job: JobRequest = {
    id: "job-demo-1",
    userId: DEMO_USER_ID,
    description: "My AC is dripping water and not cooling well.",
    imageProvided: false,
    location: "Yaba, Lagos",
    diagnosisId: diagnosis.id,
    selectedArtisanId: "artisan-1",
    bookingId: "booking-demo-1",
    status: "escrow_funded",
    createdAt,
    updatedAt: createdAt,
  };

  const booking: Booking = {
    id: "booking-demo-1",
    jobId: job.id,
    userId: DEMO_USER_ID,
    artisanId: "artisan-1",
    quoteAmount: 32000,
    userFee: 640,
    artisanFee: 3200,
    totalCharge: 32640,
    escrowStatus: "funded",
    opayReference: opayReference(1),
    createdAt,
    updatedAt: createdAt,
  };

  users[0].user_wallet_balance -= booking.totalCharge;
  users[0].escrow_balance = booking.quoteAmount;

  return {
    users,
    artisans,
    job_requests: [job],
    diagnoses: [diagnosis],
    bookings: [booking],
    escrow_transactions: [
      {
        id: "txn-demo-1",
        reference: booking.opayReference,
        bookingId: booking.id,
        jobId: job.id,
        action: "fund_escrow",
        amount: booking.quoteAmount,
        userFee: booking.userFee,
        artisanFee: 0,
        platformFee: booking.userFee,
        actor: "user",
        note: "Demo user funded simulated OPay escrow.",
        createdAt,
      },
    ],
    messages: [
      { id: "msg-demo-1", jobId: job.id, senderType: "artisan", text: "Good afternoon. I can check the drain line today.", timestamp: createdAt },
    ],
    reviews: [],
    disputes: [],
    inventory_items: [
      { id: "inv-1", artisanId: "artisan-1", name: "R22 AC Gas", quantity: 1, unit: "Cylinder", lowStockAt: 2, createdAt },
      { id: "inv-2", artisanId: "artisan-1", name: "Drain hose", quantity: 8, unit: "Meters", lowStockAt: 3, createdAt },
    ],
    platform_fee_balance: booking.userFee,
  };
}

export function loadDb(): FixMateDB {
  if (typeof window === "undefined") return seedDb();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedDb();
    saveDb(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as FixMateDB;
    return parsed.users?.length && parsed.artisans?.length ? parsed : seedDb();
  } catch {
    return seedDb();
  }
}

export function saveDb(db: FixMateDB) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    window.dispatchEvent(new Event("fixmate-db-updated"));
  }
}

export function resetDemoDb() {
  const db = seedDb();
  saveDb(db);
  return db;
}

export function createJobWithDiagnosis(input: {
  description: string;
  imageProvided: boolean;
  location: string;
  diagnosis: JobDiagnosis;
}) {
  const db = loadDb();
  const jobId = id("job");
  const diagnosisId = id("diag");
  const createdAt = now();
  const diagnosis: DiagnosisRecord = {
    ...input.diagnosis,
    id: diagnosisId,
    jobId,
    userId: DEMO_USER_ID,
    createdAt,
  };
  const job: JobRequest = {
    id: jobId,
    userId: DEMO_USER_ID,
    description: input.description,
    imageProvided: input.imageProvided,
    location: input.location,
    diagnosisId,
    status: "diagnosed",
    createdAt,
    updatedAt: createdAt,
  };
  db.diagnoses.unshift(diagnosis);
  db.job_requests.unshift(job);
  saveDb(db);
  return { db, job, diagnosis };
}

export function matchArtisans(db: FixMateDB, category: ArtisanCategory, location: string) {
  const locationText = location.toLowerCase();
  return [...db.artisans]
    .filter((artisan) => artisan.applicationStatus === "approved")
    .sort((a, b) => {
      const categoryScoreA = a.category === category ? 1000 : 0;
      const categoryScoreB = b.category === category ? 1000 : 0;
      const verifiedA = a.isVerified ? 200 : 0;
      const verifiedB = b.isVerified ? 200 : 0;
      const locationA = locationText && a.location.toLowerCase().includes(locationText.split(",")[0]) ? 80 : 0;
      const locationB = locationText && b.location.toLowerCase().includes(locationText.split(",")[0]) ? 80 : 0;
      return categoryScoreB + verifiedB + b.trustScore + b.completedJobs * 0.2 + locationB - (categoryScoreA + verifiedA + a.trustScore + a.completedJobs * 0.2 + locationA);
    })
    .slice(0, 4);
}

export function createBooking(jobId: string, artisanId: string, quoteAmount: number) {
  const db = loadDb();
  const job = db.job_requests.find((item) => item.id === jobId);
  if (!job) throw new Error("Job not found");
  const createdAt = now();
  const userFee = money(quoteAmount * 0.02);
  const artisanFee = money(quoteAmount * 0.1);
  const booking: Booking = {
    id: id("booking"),
    jobId,
    userId: DEMO_USER_ID,
    artisanId,
    quoteAmount: money(quoteAmount),
    userFee,
    artisanFee,
    totalCharge: money(quoteAmount + userFee),
    escrowStatus: "not_funded",
    opayReference: opayReference(db.escrow_transactions.length + 1),
    createdAt,
    updatedAt: createdAt,
  };
  job.selectedArtisanId = artisanId;
  job.bookingId = booking.id;
  job.status = "booking_created";
  job.updatedAt = createdAt;
  db.bookings.unshift(booking);
  saveDb(db);
  return { db, booking };
}

function addTransaction(db: FixMateDB, booking: Booking, action: EscrowAction, amount: number, actor: "user" | "artisan" | "admin", note: string, userFee = 0, artisanFee = 0, platformFee = 0) {
  const tx: EscrowTransaction = {
    id: id("txn"),
    reference: booking.opayReference,
    bookingId: booking.id,
    jobId: booking.jobId,
    action,
    amount: money(amount),
    userFee: money(userFee),
    artisanFee: money(artisanFee),
    platformFee: money(platformFee),
    actor,
    note,
    createdAt: now(),
  };
  db.escrow_transactions.unshift(tx);
}

export function escrowAction(bookingId: string, action: EscrowAction, note = "") {
  const db = loadDb();
  const booking = db.bookings.find((item) => item.id === bookingId);
  if (!booking) throw new Error("Booking not found");
  const job = db.job_requests.find((item) => item.id === booking.jobId);
  const user = db.users.find((item) => item.id === booking.userId);
  const artisan = db.artisans.find((item) => item.id === booking.artisanId);
  if (!job || !user || !artisan) throw new Error("Linked record not found");

  const stamp = now();
  const setJob = (status: JobStatus) => {
    job.status = status;
    job.updatedAt = stamp;
    booking.updatedAt = stamp;
  };

  if (action === "fund_escrow" && booking.escrowStatus === "not_funded") {
    if (user.user_wallet_balance < booking.totalCharge) throw new Error("Insufficient wallet balance");
    user.user_wallet_balance -= booking.totalCharge;
    user.escrow_balance += booking.quoteAmount;
    db.platform_fee_balance += booking.userFee;
    booking.escrowStatus = "funded";
    setJob("escrow_funded");
    addTransaction(db, booking, action, booking.quoteAmount, "user", "User funded simulated OPay escrow.", booking.userFee, 0, booking.userFee);
  }

  if (action === "artisan_accept" && ["funded", "not_funded"].includes(booking.escrowStatus)) {
    booking.escrowStatus = booking.escrowStatus === "funded" ? "accepted" : "not_funded";
    setJob("artisan_accepted");
    addTransaction(db, booking, action, 0, "artisan", "Artisan accepted the job.");
  }

  if (action === "artisan_decline") {
    setJob("declined");
    addTransaction(db, booking, action, 0, "artisan", "Artisan declined the job.");
  }

  if (action === "mark_completed") {
    booking.escrowStatus = "completed";
    setJob("completed");
    addTransaction(db, booking, action, 0, "artisan", "Artisan marked the job completed.");
  }

  if ((action === "user_release" || action === "admin_release") && ["completed", "disputed", "accepted", "funded"].includes(booking.escrowStatus)) {
    const netPayout = booking.quoteAmount - booking.artisanFee;
    user.escrow_balance = money(user.escrow_balance - booking.quoteAmount);
    artisan.artisan_pending_balance = money(artisan.artisan_pending_balance - booking.quoteAmount);
    artisan.artisan_available_balance += netPayout;
    artisan.completedJobs += 1;
    artisan.trustScore = Math.min(100, artisan.trustScore + 1);
    db.platform_fee_balance += booking.artisanFee;
    booking.escrowStatus = "released";
    setJob("released");
    addTransaction(db, booking, action, netPayout, action === "user_release" ? "user" : "admin", note || "Escrow released to artisan.", 0, booking.artisanFee, booking.artisanFee);
  }

  if (action === "open_dispute") {
    booking.escrowStatus = "disputed";
    setJob("disputed");
    const dispute: Dispute = {
      id: id("dispute"),
      jobId: booking.jobId,
      bookingId: booking.id,
      userId: booking.userId,
      artisanId: booking.artisanId,
      reason: note || "Customer opened a dispute for admin review.",
      status: "open",
      createdAt: stamp,
    };
    db.disputes.unshift(dispute);
    addTransaction(db, booking, action, 0, "user", dispute.reason);
  }

  if (action === "admin_refund" && ["funded", "accepted", "completed", "disputed"].includes(booking.escrowStatus)) {
    user.escrow_balance = money(user.escrow_balance - booking.quoteAmount);
    user.user_wallet_balance += booking.quoteAmount;
    booking.escrowStatus = "refunded";
    setJob("refunded");
    db.disputes.filter((item) => item.bookingId === booking.id && item.status === "open").forEach((item) => (item.status = "resolved_refund"));
    addTransaction(db, booking, action, booking.quoteAmount, "admin", note || "Admin refunded escrow to user.");
  }

  if (booking.escrowStatus === "accepted") {
    artisan.artisan_pending_balance = Math.max(artisan.artisan_pending_balance, booking.quoteAmount);
  }

  saveDb(db);
  return db;
}

export function saveMessage(jobId: string, senderType: "user" | "artisan", text: string) {
  const db = loadDb();
  db.messages.push({ id: id("msg"), jobId, senderType, text, timestamp: now() });
  saveDb(db);
  return db;
}

export function saveReview(jobId: string, rating: number, comment: string) {
  const db = loadDb();
  const job = db.job_requests.find((item) => item.id === jobId);
  if (!job?.selectedArtisanId) return db;
  const review: Review = {
    id: id("review"),
    jobId,
    artisanId: job.selectedArtisanId,
    userId: DEMO_USER_ID,
    rating,
    comment,
    createdAt: now(),
  };
  db.reviews.unshift(review);
  saveDb(db);
  return db;
}

export function saveArtisanApplication(input: Omit<Artisan, "id" | "trustScore" | "completedJobs" | "isVerified" | "applicationStatus" | "artisan_pending_balance" | "artisan_available_balance" | "avatar" | "createdAt">) {
  const db = loadDb();
  const artisan: Artisan = {
    ...input,
    id: id("artisan"),
    trustScore: 70,
    completedJobs: 0,
    isVerified: false,
    applicationStatus: "pending",
    artisan_pending_balance: 0,
    artisan_available_balance: 0,
    avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(input.phone)}`,
    createdAt: now(),
  };
  db.artisans.unshift(artisan);
  saveDb(db);
  return { db, artisan };
}

export function updateArtisan(artisanId: string, patch: Partial<Artisan>) {
  const db = loadDb();
  const artisan = db.artisans.find((item) => item.id === artisanId);
  if (artisan) Object.assign(artisan, patch);
  saveDb(db);
  return db;
}

export function saveInventoryItem(input: Omit<InventoryItem, "id" | "createdAt">) {
  const db = loadDb();
  db.inventory_items.unshift({ ...input, id: id("inv"), createdAt: now() });
  saveDb(db);
  return db;
}
