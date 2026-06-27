# Vendor Management System (VMS) Documentation

This document provides a detailed overview of the Vendor Management System (VMS) codebase, database schema, REST API endpoints, user onboarding flows, and the technical implementation of the multi-filter cascading search engine.

---

## 1. Database Architecture & Relations

The VMS uses **PostgreSQL** configured via **Prisma ORM**. Below is a summary of the database models:

### Models & Schema Mapping

*   **`User`**: Base credentials account.
    *   `id` (UUID), `email` (Unique string), `password` (Hashed string), `role` (Enum: `ADMIN` | `VENDOR`).
    *   Has a one-to-one relationship with `VendorProfile`, and one-to-many relationships with `ActivityLog`, `RefreshToken`, and `PasswordResetToken`.
*   **`VendorProfile`**: Subcontractor onboarding metadata.
    *   Linked to `User` via `userId`.
    *   Fields: `vendorType` (`COMPANY` | `INDIVIDUAL`), `ownerName`, `phone`, `website`, `address`, `city`, `country`, `status` (`PENDING` | `APPROVED` | `REJECTED`), and `profileCompletion` (Progress percentage).
    *   Has a one-to-many relationship with `VendorService`.
*   **`MainCategory` (Division)**: Outer construction division grouping (e.g., *MEP*, *Civil Works*).
    *   Has a one-to-many relationship with `Category`.
*   **`Category`**: Sub-group under a Division (e.g., *Plumbing Systems* under *MEP*).
    *   Has a one-to-many relationship with `SubCategory`.
*   **`SubCategory` (Trade)**: Individual construction trade (e.g., *Commercial Drainage*).
    *   Has a one-to-many relationship with `VendorService` mapping.
*   **`VendorService`**: Mapped join table linking a `VendorProfile` to a `SubCategory` trade.
    *   Contains `scopes` (Array Enum: `DESIGN_ENGINEERING`, `SUPPLY`, `INSTALLATION`, `TESTING_COMMISSIONING`).
*   **`ActivityLog`**: System audit trails for compliance events.
    *   Stores `action` (string), `details` (string), `ipAddress`, and `userAgent` logs.

---

## 2. Full Application Flow

### A. Vendor (Contractor) Onboarding Flow
1.  **Register Account**: Subcontractors sign up on the multi-column layout `/signup` screen. The credential record is created with default role `VENDOR`.
2.  **Fill Profile Sheet**: Upon first login, the user is redirected to the `/vendor/profile-completion` wizard. All fields are laid out in a compact row grid to avoid scrollbars. The onboarding completion percentage increases dynamically as fields are filled.
3.  **Register Trade Services**: Under `My Services`, the contractor uses a 3-column cascading browser (Divisions → Categories → Trades) to select their specialties. They select scope checkboxes (e.g., Supply, Installation) and click "Register Trades" to save them in bulk.
4.  **Awaiting Review**: The vendor's dashboard displays a **"Review in Progress"** status alert. The contractor cannot participate in bidding while their profile is pending.

### B. Admin Inspection & Compliance Workflow
1.  **Database Lookup**: Administrators view the **Contractors Database** showing onboarding progress, status, and contact info.
2.  **Access Control Inspection**: Under `System Users`, the admin clicks any user row. Clicking a vendor dynamically renders an **Inspector Panel** directly below the table showing:
    *   Contact Info, TRN, and License numbers.
    *   Full list of registered service trades and scopes.
    *   Direct **Approve** and **Reject** buttons.
3.  **Approve / Reject Action**: Clicking approve/reject opens a custom confirmation modal. Submitting the form triggers a status change, logs the action in the audit trail, and immediately transitions the vendor's dashboard status banner.

---

## 3. How Admin Cascading Filters Work (In Easy Words)

The admin filter engine allows searching contractors across multiple divisions, categories, or trades simultaneously. Here is how it works under the hood:

### 1. The Frontend Cascading Selector (The "Basket")
*   Instead of stacked selector dropdowns, the admin is presented with three side-by-side columns: **Divisions**, **Categories**, and **Trades**.
*   Clicking a row in *Divisions* expands its category folder, and clicking a row in *Categories* shows the subcategory trades.
*   Next to each item, there is an **"Add"** button. Clicking "Add" inserts that division, category, or trade into an **Active Filters Basket** as a tag.
*   Admins can select multiple items from different columns (e.g. Division A AND Trade B). These tags can be removed in real time by clicking the `[X]` button.

### 2. Comma-Separated Query Transport
*   When filters change, the frontend groups the selected filter IDs by type and joins them with commas (e.g., `?subCategoryId=id1,id2,id3`).
*   This single string is sent to the backend `/admin/vendors/filter` endpoint.

### 3. Backend Database Join Query (Prisma `OR` & `in`)
*   The backend receives the comma-separated strings and splits them into string arrays:
    `filters.subCategoryId.split(',')` $\rightarrow$ `['id1', 'id2', 'id3']`
*   It builds a Prisma query utilizing the **`OR`** operator within a **`some`** relation condition:
    ```typescript
    where.services = {
      some: {
        OR: [
          { subCategoryId: { in: ['id1', 'id2', 'id3'] } },
          { subCategory: { categoryId: { in: ['catId1'] } } }
        ]
      }
    };
    ```
*   This database structure finds any contractor that has a matching registered trade in any of the selected divisions, categories, or subcategories, making filter queries fast and powerful.

---

## 4. API Endpoints Reference

### Auth Endpoints (`/auth`)
*   `POST /auth/register` - Creates a new user credentials account.
*   `POST /auth/login` - Authenticates credentials and returns session tokens.
*   `POST /auth/refresh-token` - Rotates refresh tokens to maintain active sessions.
*   `POST /auth/forgot-password` - Generates a password reset link and token.
*   `POST /auth/reset-password` - Updates account password using a valid token.
*   `GET /auth/profile` - Fetches authenticated user account details.
*   `PUT /auth/profile` - Updates personal user profile information.
*   `PUT /auth/change-password` - Updates password for logged-in sessions.

### Category & Service Tree Endpoints (`/services`)
*   `GET /services` - Returns the full cascading categories hierarchy tree.
*   `GET /services/main-categories` - Returns main construction divisions list.
*   `GET /services/categories/:id` - Returns subcategories within a division.
*   `GET /services/sub-categories/:id` - Returns trades within a category.

### Vendor Endpoints (`/vendors`)
*   `GET /vendors/profile` - Returns the contractor profile details.
*   `PUT /vendors/profile` - Updates contractor onboarding details and updates completion status.
*   `GET /vendors/dashboard` - Fetches profile status, metrics, and recent audit logs.
*   `GET /vendors/profile/completion` - Returns completion percentage and list of missing fields.
*   `GET /vendors/services` - Returns the vendor's active registered trades list.
*   `POST /vendors/services` - Maps a new trade and scopes of work to the profile.
*   `PUT /vendors/services/:id` - Updates scopes of work for a registered trade.
*   `DELETE /vendors/services/:id` - Removes a trade mapping.

### Admin Endpoints (`/admin`)
*   `GET /admin/dashboard` - Returns total vendor counts (pending, approved, rejected, total services).
*   `GET /admin/vendors` - Lists all registered contractors (paginated).
*   `GET /admin/vendors/search?q=...` - Searches contractors by email, license, contact name, or phone.
*   `GET /admin/vendors/filter` - Filters contractors by comma-separated main category, category, or subcategory IDs.
*   `GET /admin/vendors/:id` - Returns single contractor onboarding sheet, linked user, and registered service trades.
*   `PATCH /admin/vendors/:id/status` - Approves or rejects a vendor onboarding application.
*   `GET /admin/users` - Lists all system administrative and contractor user records.
*   `GET /admin/activity-logs` - Returns global system audit trail logs (paginated).
*   `POST /admin/services` - Registers a new division, category, or trade in the service tree.
*   `DELETE /admin/services/:id` - Removes a category node and deletes child categories.
