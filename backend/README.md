# Backend - AI-Powered RFP Management (Gemini)

## Tech

- Node.js + Express
- MongoDB + Mongoose
- Google Gemini API (`@google/generative-ai`)
- Nodemailer + IMAP (imap-simple) for email send/receive

## Setup

1. Copy `.env.example` to `.env` and fill values.

2. Start MongoDB locally (e.g. `mongod`).

3. Install deps:

```bash
cd backend
npm install
```

4. Run dev:

```bash
npm run dev
```

API runs on `http://localhost:5000`.

Key endpoints:

- `POST /api/ai/rfp-structure` – input: `{ "prompt": "I need 20 laptops..." }`, output structured RFP JSON.
- `POST /api/rfps` – save structured RFP.
- `GET /api/rfps` – list RFPs.
- `GET /api/rfps/:id` – RFP + proposals.
- `POST /api/rfps/send` – body: `{ "rfpId", "vendorIds": [] }` send emails.
- `POST /api/vendors` / `GET /api/vendors` – vendor CRUD (minimal).
- `GET /api/email/fetch` – fetch unread vendor replies from IMAP.
- `POST /api/ai/parse-vendor-email` – convert email body to structured proposal.
- `GET /api/ai/compare/:rfpId` – AI comparison + recommendation.
