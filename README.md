# FixMate

FixMate is a hackathon MVP for an OPay + Google Gemini scholarship project. It is an AI-powered local artisan marketplace for Nigeria: users describe or upload photos of household/service issues, Gemini creates a structured diagnosis and cost estimate, FixMate recommends verified artisans, and payment is tracked through a transparent simulated OPay escrow ledger.

## What Works In This MVP

- Gemini diagnosis on `/report` with numeric naira estimates, safety warnings, first-aid steps, and artisan category matching.
- Persistent demo data model for users, artisans, job requests, diagnoses, bookings, escrow transactions, messages, reviews, disputes, and inventory items.
- Firebase client bootstrap is included. If Firebase env keys are missing, the app uses a localStorage demo database so judges can run it immediately.
- Simulated OPay escrow ledger with references like `OPAY-FIX-2026-0001`.
- User fee: 2% when escrow is funded.
- Artisan fee: 10% deducted from completed payout.
- User dashboard, artisan dashboard, admin panel, and persisted job chat.
- WhatsApp bot support is planned to mirror website job request, status, and payment activities. Registration remains website-only.

## Gemini Usage

`app/actions.ts` calls `@google/genai` with a strict JSON-only prompt. Gemini returns:

- `issue_title`
- `summary`
- `artisan_category`
- `urgency`
- `estimated_min_naira`
- `estimated_max_naira`
- `estimated_labor_naira`
- `estimated_materials_naira`
- `safety_warning`
- `first_aid_steps`
- `follow_up_questions`

If Gemini fails or `GEMINI_API_KEY` is not set, FixMate returns a safe fallback diagnosis and keeps the UI working.

## Simulated OPay Escrow

No real OPay API is integrated in this MVP. The escrow system is a demo ledger that records:

- user wallet deductions
- escrow balance
- artisan pending balance
- artisan available balance
- platform fee balance
- transaction history for funding, acceptance, release, disputes, refunds, and admin release

This is intentionally labelled as simulated OPay escrow throughout the app.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and add a Gemini key if available:

```bash
GEMINI_API_KEY=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

3. Start the dev server:

```bash
npm run dev
```

## Demo Flow For Judges

1. Open `/report`.
2. Type: `My generator is smoking and smells like fuel`.
3. Review Gemini diagnosis, safety warning, numeric cost estimate, and recommended artisans.
4. Select an artisan and fund simulated OPay escrow.
5. Open `/artisan/dashboard`, accept the job, send a chat message, and mark it completed.
6. Open `/dashboard`, release funds, and leave a review.
7. Open `/admin` to inspect ledger records, approve artisans, resolve disputes, and adjust trust scores.
8. Note the product direction: WhatsApp bot support will mirror website activities later, but artisan and user registration stay on the website.

## Future Real OPay Integration Plan

- Replace the local ledger funding action with real OPay checkout/collection APIs.
- Store verified OPay transaction references in Firestore.
- Use OPay webhooks to confirm funding, release, refund, and settlement events.
- Keep FixMate escrow status locked to verified webhook events, not client actions.
- Add Firebase Auth roles for users, artisans, and admins before production.
