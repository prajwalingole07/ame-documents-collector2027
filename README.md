# ADMISSIONS MADE EASY, LATUR – STUDENT DOCUMENT PORTAL 2027

A complete, responsive web application for managing student document collection, category-wise eligibility requirements, Excel bulk imports, and real-time scrutiny verification.

---

## 🚀 Quick Start on Windows PC

1. Double-click the included **`start.bat`** file in the root directory.
2. It will automatically check Node.js, install dependencies if needed, and start the local server.
3. Open your browser and navigate to:
   - **Local PC:** `http://localhost:3000`
   - **Mobile (Same Wi-Fi):** `http://<YOUR-PC-IP>:3000`

---

## 🔐 Default Admin Credentials

- **Admin ID:** `ame2027`
- **Password:** `ame@2027`
*(You can change the admin password at any time under **Admin Settings** in the dashboard).*

---

## 👨‍🎓 Student Login Details

- **Login ID:** Student Registration Number / Receipt Number (e.g. `20270001`)
- **Password:** Student Mobile Number (`Contact-1`). If blank, `Contact-2` (parent mobile), or DOB (`DDMMYYYY`).

---

## ☁️ Deploying to Vercel (1-Click Deployment)

This project is pre-configured with `vercel.json` for client-side routing.

1. **Option A: Via Vercel CLI**
   ```bash
   npm i -g vercel
   vercel
   ```
2. **Option B: Via GitHub / Vercel Dashboard**
   - Push this repository to your GitHub account.
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Import your GitHub repo.
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Click **Deploy**!

---

## 📦 Features Implemented

- **Dual Login Portals:** Separate, secure login flows for students and admission admins.
- **Excel Bulk Import:** Automatically provisions student records and accounts from standard spreadsheets with validation and error reporting.
- **Dynamic Category Rules:** Scrutiny requirements adjust automatically for OPEN, SC, ST, VJ, NT, OBC, SBC, SEBC, EWS, Defence, Orphan, PWD, and Fee Concessions.
- **Real-Time Cloud Storage & Verification:** Uploads to Firebase Storage and Cloud Firestore with live sync between student actions and scrutiny officer review.
- **ZIP Document Bundling:** Download individual student portfolios or bulk Excel rosters with one click.
