# AI-Powered RFP Management System (MERN + Google Gemini)

Implements the assignment: create RFPs from natural language, manage vendors, send RFPs via email, parse vendor responses, and compare proposals with AI assistance. fileciteturn0file0

## 1. Tech Stack

- **Frontend:** React + Vite, Redux Toolkit, Axios
- **Backend:** Node.js, Express
- **DB:** MongoDB (local or Atlas)
- **AI:** Google Gemini API (free tier)
- **Email:** Nodemailer (SMTP) + IMAP (imap-simple)

## 2. Prerequisites

- Node.js >= 18
- npm or yarn
- MongoDB running locally (`mongodb://localhost:27017`) or an Atlas URI
- Google Cloud project with Gemini API enabled and an API key
- Email account for send/receive (e.g. Gmail with App Password)

## 3. Backend Setup

```bash
cd backend
cp .env.example .env
# edit .env with your MONGO_URI, GEMINI_API_KEY, SMTP, IMAP details
npm install
npm run dev
```

Backend: `http://localhost:5000`.

## 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`.

## 5. Basic Flow

1. **Create RFP from natural language**
   - In UI, type description (items, quantities, budget, delivery, terms).
   - Click **"Generate Structured RFP"** (calls `/api/ai/rfp-structure` using Gemini).
   - Review JSON, click **"Save RFP"**.

2. **Manage vendors**
   - Add vendors (name + email) in UI (stored in MongoDB).
   - Checkbox vendors you want to invite.

3. **Send RFP emails**
   - Select an RFP from the list.
   - Check vendors and click **"Send selected RFP to checked vendors"**.
   - Backend uses Nodemailer + SMTP.

4. **Receive vendor responses**
   - Vendors reply to the same email address.
   - Hit `GET /api/email/fetch` (you can wire a simple button or run via Postman) to pull unread emails from IMAP.
   - For each email, call `POST /api/ai/parse-vendor-email` with `{ rfpId, vendorId, emailBody, rawEmailId }` to create `Proposal` records.

5. **Compare proposals**
   - In UI, click an RFP.
   - It loads `/api/proposals/rfp/:rfpId` and `/api/ai/compare/:rfpId`.
   - Gemini returns scores, summaries, and a recommendation which is shown in the right panel.

## 6. Notes

- This is a minimal but end-to-end implementation focused on the single-user flow described in the assignment.
- You can extend the frontend with nicer tables, filters, and detailed proposal views as needed.
