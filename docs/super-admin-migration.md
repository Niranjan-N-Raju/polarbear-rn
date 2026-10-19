# Super-Admin Migration Inventory

Scope: the `admin` role only. The existing Next.js app remains unchanged. Store-scoped franchise workflows and employee operations are excluded unless explicitly called by a super-admin screen.

## Source behavior checklist

| Workflow | Next.js behavior | Status |
|---|---|---|
| Sign-in / access | `/login`; bcrypt password verification, active-user check, store-association check for store-bound roles, 8-hour HS256 JWT. The admin role needs no store. | Login UI/API exists in RN/backend; bearer auth for data APIs is not yet implemented. |
| Admin navigation | Sidebar shows Dashboard, Stores, Users, Profile, and Sign out for `admin`. Admin bypasses store selection. Store and Staff groups and Store Config are not shown. | Not ported beyond login screen. |
| Dashboard | `/dashboard`; global cards: total, active, inactive, franchise and company stores; total users excluding admin; sub-admins; store admins; active employees. Admin does not see franchise sales charts/date filters. | Not implemented in RN/backend. |
| Stores | `/stores`; list all stores; add company/franchise store; edit and archive/restore. Search/filter/pagination are not present in the current screen. Add/edit validates name, store code, phone, owner phone, and owner email. Archive requires confirmation and preserves assignments/data. | RN/backend archive/restore implemented. |
| Users | `/users`; load stores and current role; list users excluding employees, current user, and archived users by default; optionally filter by store; limit 500. Admin can add sub-admin/store-admin, edit role/store assignments/name, and delete eligible users with confirmation. The UI does not expose employee management. | Not implemented in RN/backend. |
| Profile | `/profile`; display name/email/role; update name; change password with current-password verification, confirmation, and complexity checks. Successful password changes increment `sessionVersion` and issue a replacement JWT. | Not implemented in RN/backend. |
| Session / logout | Next app warns after 40 minutes of inactivity, allows 60 seconds to extend, otherwise logs out; `/api/auth/extend` refreshes session. `/api/auth/logout` clears session/store cookies. | Native token lifecycle, timeout/extend, and backend logout are not implemented. |

## API inventory and contract

| Method and path | Super-admin behavior | Relevant contract |
|---|---|---|
| `GET /api/dashboard` | Global aggregate counts across all stores/users. | `200` with `totalStores`, `activeStores`, `inactiveStores`, `franchiseStores`, `companyStores`, `totalUsers`, `storeAdmins`, `subAdmins`, `employees`. `401` if unauthenticated. |
| `GET /api/stores?page=&limit=` | Admin sees all stores, sorted by name, default page 1/limit 50, max limit 100. | `200 { franchises, pagination: { page, limit, total, totalPages } }`. |
| `POST /api/stores` | Admin may create a store. | JSON store form; `201 { franchise }`. Existing validation/rate limit/CSRF; duplicate store code `409`. Store is assigned to creator. |
| `PATCH /api/stores?id=...` | Admin may edit only stores created by that admin (despite global list visibility). | Same store form; `200 { franchise }`; invalid id/body `400`, not found `404`, unowned existing store `403`, duplicate code `409`. |
| `PATCH /api/stores/archive?id=...` | Admin may archive or restore only stores created by that admin; preserves the record and user assignments. | JSON `{ archived: boolean }`; `200 { message, franchise }`; invalid ID/body `400`, not found `404`, unowned existing store `403`. |
| `GET /api/users?franchiseId=&excludeEmployees=true&limit=500` | Lists active users except the caller and, for this UI, employees. Admin may optionally filter by store. | `200 { users, pagination }`, user rows omit passwords and include assigned store summaries; unauthorized `401`, disallowed role `403`. |
| `POST /api/users` | Admin may create sub-admin/store-admin through the UI; API also allows employee role. | JSON name/email/password/role/franchiseIds and supported employee fields. Password rules: min 12, uppercase, lowercase, digit, special; store assignment required for store-admin/employee. `201` on success. |
| `GET /api/users/:id` | Admin may read editable user details. | `200 { user }`; `401/403/404` as applicable; decrypts PII for authorized profile. |
| `PATCH /api/users/:id` | Admin may update name, role, store assignments, and supported user fields. Role/store changes increment `sessionVersion`. | Validated JSON patch; `200 { message, user }`; `400/401/403/404/413` on failures. |
| `DELETE /api/users/:id` | Admin cannot delete self. UI list excludes employees; eligible non-employee users are permanently deleted. Employee deletion through API archives instead. | `200 { message }`; `400/401/403/404` on failures. |
| `GET /api/me` | Returns current user's id/name/email/role. | `200`; unauthenticated/missing user `401`. |
| `PATCH /api/me` | Updates name and/or password. Password update requires current password and minimum/complexity validation; increments session version and reissues JWT. | `200 { message }`; `400/401/413/429` as applicable. |
| `POST /api/auth/extend` | Refreshes the 8-hour session after the inactivity prompt. | Current Next.js implementation refreshes the session cookie; no Node backend equivalent yet. |
| `POST /api/auth/logout` | Clears session and store cookies. | Current Next.js implementation returns `{ message: "Logged out." }`; native bearer-token logout is not defined yet. |

## Data and security constraints

- Existing MongoDB collections and data must be reused; no schema reset or destructive migration.
- Next.js `User` and `Franchise` Mongoose schemas are the source of truth. Sensitive user fields use `encryptField`; password is bcrypt-hashed and excluded from ordinary selects.
- The Next.js session is an 8-hour HS256 JWT with `id`, `name`, `email`, `role`, and `sessionVersion`; user lookup checks active state and session version.
- The Node backend currently exposes login and health only. It has no admin data routes/models or shared bearer-auth middleware yet.
- The RN login response keeps the token in in-memory state; current API calls are not yet authenticated because super-admin data screens are not implemented.
- Admin must never receive password hashes. Admin visibility in mobile must not replace backend authorization.

## Next implementation sequence

1. Port shared Mongo models/serialization and bearer-token verification into the backend without changing collections.
2. Add dashboard, store CRUD, user management, profile, extend, and logout APIs with matching role checks/status semantics.
3. Add an authenticated RN API client and super-admin navigation/screens for Dashboard, Stores, Users, Profile, and Sign out.
4. Verify admin and negative-permission flows against the existing database on Android, iOS, and web.

## Current verification

- Source audit completed for the admin sidebar, dashboard, store/user/profile screens, related API handlers, schemas, role helpers, and current backend route coverage.
- No super-admin data workflow has yet been migrated; the login screen alone is not feature parity.
