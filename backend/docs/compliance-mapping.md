# Individual Vendor Compliance & Trade Mapping Matrix

This document outlines the strict business and compliance rules applied to Individual contractor accounts within the Vendor Management System (VMS). These rules ensure that individuals register only for trades and scopes they are qualified to perform based on their registered **Vendor Role** (stored in `businessCategory`).

---

## 1. Compliance Matrix (Main Categories & Divisions)

The VMS automatically filters the available divisions (Main Categories) in the trade selector interface. Individual vendors will only see the options permitted for their specific role:

| Vendor Role | Permitted Divisions (Main Categories) | Excluded Divisions & Rationale |
| :--- | :--- | :--- |
| **Engineer** | • Civil Works<br>• Structural Steel Works<br>• MEP<br>• Building Envelope<br>• Infrastructure Works<br>• Temporary Works<br>• Finishing Works (Civil Scope)<br>• Specialized Systems by Project Type | **None (100% Unrestricted)**<br>Authorized to perform and oversee any engineering or specialized works. |
| **Supervisor** | • Civil Works<br>• Structural Steel Works<br>• MEP<br>• Building Envelope<br>• Infrastructure Works<br>• Temporary Works<br>• Finishing Works (Civil Scope)<br>• Specialized Systems by Project Type | **None (100% Unrestricted)**<br>Authorized to manage general field and site operations. |
| **Foreman** | • Civil Works<br>• Structural Steel Works<br>• MEP<br>• Building Envelope<br>• Finishing Works (Civil Scope)<br>• Temporary Works | **Excluded:** *Infrastructure Works* & *Specialized Systems*.<br>Foremen lead local field crews but are not authorized for heavy grid utility infrastructure or specialized certified automation/protection systems. |
| **Technician** | • Structural Steel Works<br>• MEP<br>• Building Envelope<br>• Finishing Works (Civil Scope)<br>• Temporary Works | **Excluded:** *Civil Works* (heavy structural concrete), *Infrastructure Works*, & *Specialized Systems*.<br>Technicians are qualified for specific skilled trades (e.g., plumbing, electrical, HVAC, welding) but do not execute general heavy structural concrete works. |
| **Labour** | • Finishing Works (Civil Scope)<br>• Temporary Works | **Excluded:** *Civil Works*, *Structural Steel*, *MEP*, *Infrastructure*, & *Specialized Systems*.<br>Unskilled or semi-skilled labor is restricted strictly to finishing execution (painting, tiling, general cleanup) and temporary site installations (scaffolding). |

---

## 2. Scope of Work (SOW) Restrictions

Within the allowed divisions, the permitted **Scope of Work** checkboxes are filtered in the user interface and validated on the server:

*   **Engineer:** All scopes permitted:
    *   `Design & Engineering`
    *   `Supply`
    *   `Installation`
    *   `Testing & Commissioning`
*   **Supervisor:** Permitted:
    *   `Supply`
    *   `Installation`
    *   `Testing & Commissioning`
    *   *(Blocked: Design & Engineering)*
*   **Foreman / Technician:** Permitted:
    *   `Installation`
    *   `Testing & Commissioning`
    *   *(Blocked: Design & Engineering, Supply)*
*   **Labour / Unrecognized:** Permitted:
    *   `Installation` only (representing physical hands-on site labor execution).
    *   *(Blocked: Design & Engineering, Supply, Testing & Commissioning)*

---

## 3. Account Quantity Limits

To prevent individual accounts from acting as broad subcontractors (which is reserved for Corporate entities), the following trade quantity limits are enforced:

*   **Individual Vendor Account:** Restricted to registering a **maximum of 2 service trades** (subcategories). Attempts to register more are blocked on both the frontend and backend.
*   **Corporate Vendor Account:** Unrestricted. Can register any number of trades and scopes.
