# ADMISSIONS MADE EASY, LATUR – STUDENT DOCUMENT PORTAL 2027

A complete, responsive web application for student document collection, category-wise eligibility requirements, Excel bulk imports, and real-time scrutiny verification.

> **What changed in this fixed version:** every student, document and file is stored in **Cloud Firestore**, and every screen uses live `onSnapshot` subscriptions. Uploading a document on a phone appears on the admin PC (and on any other phone/PC) within seconds. The old version silently fell back to `localStorage` because the Firestore rules were locked.

---

## 🚀 Quick Start on Windows PC

1. Double-click the included **`start.bat`** file in the root directory.
2. It checks Node.js, installs dependencies if needed, and starts the local server.
3. Open:
   - **Local PC:** `http://localhost:3000`
   - **Mobile (same Wi-Fi):** `http://<YOUR-PC-IP>:3000`

---

## 🔐 Default Admin Credentials

- **Admin ID:** ``
- **Password:** ``

Change the admin password immediately after your first login under **Admin Settings → Update Admin Password**. The password is stored as a SHA-256 hash in `admin_config/credentials` in Firestore.

---

## 👨‍🎓 Student Login Details

- **Login ID:** Student Registration / Receipt Number (e.g. `20270001`)
- **Password:** Student Mobile Number (`Contact-1`). If blank, `Contact-2` (parent mobile), or DOB (`DDMMYYYY`).

---

## ☁️ Cloud Architecture (Free Firebase Spark plan)

| Data | Where it is stored |
|---|---|
| Students, passwords, statuses | Cloud Firestore → `students/{regNo}` |
| Document metadata (status, remarks, rejection reason) | Cloud Firestore → `student_documents/{regNo}` |
| Actual file bytes | Cloud Firestore → `document_files/{fileId}/chunks/{0000…}` |
| Admin password hash | Cloud Firestore → `admin_config/credentials` |

**Why chunked files?** Firebase Storage and Firebase Authentication require the paid **Blaze** plan on Firebase projects created after 30 Oct 2024. To keep the portal free and fully working, files are split into 700 KB binary chunks in Firestore. Images are compressed in the browser (max 2000 px, JPEG 82%) before upload.

- Maximum file size: **4.5 MB** (free Firestore document/chunk limits and 1 GiB total quota).
- Accepted types: PDF, JPG, JPEG, PNG, WEBP.
- Every phone/PC reads the same Firestore records, so data is no longer tied to one device.

**Free quota planning:** the Spark plan includes about **1 GiB total** Firestore storage. With 4.5 MB files that is roughly 200–250 large scans, or more when students upload compressed photos. For a large cohort (hundreds of students × 15 documents), upgrade to Blaze and move files to Firebase Storage, or use another object-storage provider. Check usage in Firebase Console → Firestore → Usage.

---

## 🔥 One-Time Firebase Rules Deployment

The included `firestore.rules` is already deployed to the project `ame-student-portal-2027`. If you create a **new** Firebase project, or the rules are ever overwritten, deploy them again:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules --project ame-student-portal-2027
```

`firebase.json` and `.firebaserc` are included in this folder. The rules allow access only to these named collections and expire on **31 Dec 2028**:

- `students/{regNo}`
- `student_documents/{regNo}`
- `document_files/{fileId}` and `document_files/{fileId}/chunks/{chunkId}`
- `admin_config/{docId}`
- `counters/{docId}`, `audit_logs/{docId}`

---

## 🚚 Moving Old Device Data to the Cloud

The old version saved students and files only inside each browser (`localStorage`). Those records do **not** move automatically. To migrate them:

1. Open the deployed portal on the **same phone/PC/browser** that has the old data.
2. Log in as admin.
3. Go to **Admin Settings → Move Old Device Data to the Cloud**.
4. Click **Upload This Device's Data to Cloud**.

The tool uploads the old students and Base64 files, skips records already in the cloud, and reports any file larger than 4.5 MB. Repeat it once on every device that has old local data.

---

## ☁️ Deploying to Vercel

This project is pre-configured with `vercel.json` for client-side routing.

### Option A – Vercel CLI

```bash
npm install
npm run build
npx vercel
```

### Option B – GitHub + Vercel Dashboard

1. Push this folder to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repository.
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Click **Deploy**.

No environment variables are required; the Firebase web config is already in `src/firebase/config.js`.

---

## ✅ Post-Deployment Test Checklist

1. Open the site on a PC, log in as admin (`` / ``).
2. Import an Excel sheet or add one student.
3. On a phone, log in with that student's registration number and mobile number.
4. Upload a document. The admin dashboard should show it **without refreshing**.
5. Mark the document **Correct** or **Incorrect** from the admin panel. The student's phone should update live.
6. Download one document and the full student ZIP from the admin verification screen.
7. If you have old local data, run the migration in Admin Settings (see above).

---

## 📦 Features Implemented

- **Dual login portals:** separate student and admin flows.
- **Excel bulk import:** provisions student accounts with validation and error reporting.
- **Dynamic category rules:** OPEN, SC, ST, VJ, NT, OBC, SBC, SEBC, EWS, Defence, Orphan, PWD and fee-concession requirements.
- **Real-time cloud sync:** live Firestore subscriptions on the student dashboard, admin overview, student roster and verification screen.
- **Cloud file storage:** chunked binary Firestore storage with image compression, preview, single download and ZIP download with official filenames.
- **Approval workflow:** mark documents Correct (approved) or Incorrect (re-upload requested) with remarks that sync instantly to the student.
- **One-time local-data migration** for data created by the old per-device version.
- **Excel reports and ZIP exports** generated directly from cloud data.

---

## ⚠️ Security Note (Important)

The free Spark plan does not include Firebase Authentication. The included Firestore rules therefore allow anyone who knows the project ID to read/write the named collections. This is acceptable for a short admission season behind an unguessable Vercel URL, but it is **not** suitable for long-term sensitive data.

For a production-grade deployment:

1. Upgrade the Firebase project to **Blaze** (billing).
2. Enable **Firebase Authentication** (email/password or phone) for admins and students.
3. Move files to **Firebase Storage** (or keep chunks with authenticated rules).
4. Replace `firestore.rules` with rules that check `request.auth` and admin custom claims.
5. Restrict CORS/API keys and add audit logging.

Until then, change the default admin password and avoid sharing the Firestore project ID publicly.
