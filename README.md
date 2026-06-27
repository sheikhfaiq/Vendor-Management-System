# Vendor Management System (VMS) - Real Estate Construction

A modern, production-ready web application designed for real estate and construction management firms to handle subcontractor registrations, onboarding compliance, and trade cataloging.

---

## 🚀 Key Features

### 1. Subcontractor Onboarding & Profile Completion
*   **dense Form Grid:** Compact 3-column registration fields displaying all input panels at once to eliminate vertical scrolling.
*   **Completion Progress Meter:** Real-time percentage indicator computed on the server matching the compliance criteria.
*   **Cascading Multi-Trade Selector:** Cascading tree picker (Divisions → Categories → Subcategories) allowing contractors to add multiple trades to a basket, configure scopes of work (Design, Supply, Installation, Commissioning), and submit them in bulk.

### 2. Administrator Compliance Dashboard
*   **Access Control Panel:** Audit users and system privileges in a unified, paginated data grid.
*   **Interactive Row Inspector:** Selecting any subcontractor dynamically reveals their detailed profile sheet (licenses, contact info, and registered trades) directly below the table.
*   **Inline Compliance Approvals:** Direct Approve/Reject buttons inside the inspector panel with custom verification modal overlays.

### 3. Cascading Database Search Engine
*   Upgraded search page utilizing a 3-column cascading browser. Admins can select multiple divisions, categories, or trades to build a filter query.
*   Resolves searches on the database level using Prisma nested relation checks (`OR` + `some` + `in` operators) for rapid contractor querying.

---

## 🛠️ Technology Stack

### Frontend
*   **React 19** with **TypeScript** & **Vite**
*   **TailwindCSS** for responsive design styling
*   **TanStack React Query** for API state caching
*   **Lucide Icons** & **React Hot Toast** notifications

### Backend
*   **Node.js**, **Express**, **TypeScript**
*   **Prisma ORM** with **PostgreSQL** database
*   **Zod** query validation schemas
*   **Winston** centralized error logger with Morgan middleware

---

## ⚙️ Installation & Setup

### Database & Environment Setup
Ensure you have a running PostgreSQL instance and configure your connection strings.

1.  **Backend Environment (`backend/.env`):**
    ```env
    PORT=5050
    DATABASE_URL="postgresql://username:password@localhost:5432/vms_db?schema=public"
    JWT_SECRET="your_jwt_secret_token_key"
    JWT_REFRESH_SECRET="your_jwt_refresh_secret_key"
    NODE_ENV="development"
    ```
2.  **Frontend Environment (`frontend/.env`):**
    ```env
    VITE_API_URL="http://localhost:5050"
    ```

### Backend Installation
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```
The backend server runs on `http://localhost:5050`.

### Frontend Installation
```bash
cd ../frontend
npm install
npm run dev
```
The client dashboard opens on `http://localhost:5173`.

---

## 📂 Project Structure

```
├── backend/
│   ├── docs/                 # List of Categories and detailed specs
│   ├── prisma/               # Database schemas and seeds
│   ├── src/
│   │   ├── config/           # Logger and database client setups
│   │   ├── middleware/       # JWT guards and centralized error middleware
│   │   ├── modules/          # Auth, Admin, Service, and Vendor route controllers
│   │   └── utils/            # Calculation helper scripts
└── frontend/
    ├── src/
    │   ├── api/              # Axios wrappers and API routes
    │   ├── components/       # Reusable tables, inputs, modals, cards
    │   ├── features/         # Features (Auth, Admin, Vendor)
    │   ├── routes/           # Guarded React Router mappings
    │   └── types/            # Global TypeScript types definitions
```
