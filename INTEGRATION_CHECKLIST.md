# Architectural Review & Integration Checklist

## 1. General Architectural Review

### **Strengths**
- **Signal-Based State Management:** The use of Angular Signals in `AuthService` and `CompanyContextService` is modern and efficient, providing reactive updates without the overhead of `BehaviorSubject` (though `BehaviorSubject` is still used for backward compatibility/Observable streams, which is fine).
- **Guard Logic:** The separation of concerns between `authGuard`, `contextGuard`, and role-based guards (`adminGuard`, etc.) is clean.
- **Interceptors:** The `authInterceptor` is simple and focused, correctly handling token injection.

### **Areas for Improvement**
- **Hybrid Workflow (Expert vs Employee):** The current `CompanyContextService` relies on `isExpertMode` flag. When switching contexts, we must ensure that **all** permissions and role-derived signals in `AuthService` (like `isAdmin`, `isRH`) update immediately. Currently, `AuthService` computes these from `currentUser`, but `CompanyContextService` manages the *active* context.
    - *Risk:* If a user is an Admin in Company A and an Employee in Company B, `AuthService.isAdmin()` might still return `true` if it looks at the *User* object instead of the *Context*.
    - *Fix:* `AuthService`'s computed signals (e.g., `isAdmin`) should probably depend on `CompanyContextService.currentContext()` rather than just the static `currentUser` if roles are company-specific. **However**, the backend returns a single User object with a `role`. If the backend only supports *one* active role per session token, then the current FE implementation is correct. If the backend allows "switching" roles without re-login (just context switch), the FE needs to know the role *per membership*.
- **Role Handling:** The `User` model uses a single `role` field, but the backend documentation suggests a user can have multiple `roles` (`"roles": ["Admin"]`). The current frontend forces a single role mapping (`mapBackendRole`).

## 2. Integration Checklist (Frontend vs Backend Discrepancies)

| Feature | Frontend Expectation | Backend Reality (Docs) | Action Required |
| :--- | :--- | :--- | :--- |
| **User Role** | Expects single `role` string (mapped to enum). | Returns `roles` array (e.g., `["Admin"]`). | Update `AuthService` to parse the first role from the `roles` array or handle multiple roles. |
| **Permissions** | Expects `permissions` in User object. | Returns `permissions` array (strings) in Login response. | **MATCH**. Frontend code already handles this. |
| **Company Info** | Expects `companyName` and `isCabinetExpert` in User object. | `User` object in Login response does **not** explicitly show `companyName` or `isCabinetExpert` in the example JSON, though `employee` endpoint does. | Verify if the Login `User` payload actually includes `companyName`. If not, we might need to fetch it separately or rely on the `Company` endpoints. |
| **Memberships** | Expects to build memberships from `user.companyId`. | Backend `GET /api/users/{id}` or Login response doesn't explicitly list "Memberships" for multi-tenancy. | **GAP.** How does a user know which companies they belong to? The current code assumes 1 user = 1 company. For multi-tenancy (Hybrid), we need an endpoint like `GET /api/users/me/companies` or similar. |
| **Context Header** | Sends `X-Company-Id`. | Backend documentation doesn't explicitly mention `X-Company-Id` header requirement for all endpoints, but implies standard `Authorization`. | **VERIFY.** Does the backend *need* `X-Company-Id` to filter data? Or does the Token claim contain the Company ID? If the token is scoped to a company, switching contexts might require a **Token Refresh** with a new Company ID. |

## 3. "Hybrid Expert" Workflow Analysis
- **Current Logic:** The user logs in -> gets a Token -> FE builds "Memberships" based on `user.companyId`.
- **The Flaw:** If the backend User object only has *one* `companyId`, the frontend cannot "discover" the second company (where the user might be an employee) to create the second membership.
- **Conclusion:** The frontend "Hybrid" logic is hypothetical until the backend provides a list of companies the user is associated with.
- **Recommendation:** Ask Backend Developer for an endpoint: `GET /api/my-companies` which returns `{ companyId, role, ... }[]`.

## 4. Specific Code Improvements to Apply
1.  **`User` Model:** Add `roles: string[]` to match backend.
2.  **`AuthService`:** Update `normalizeUserPayload` to handle the `roles` array properly.
3.  **`CompanyContextService`:** Ensure `selectContext` saves the *Role* specific to that context. (Current implementation does this, which is good).
