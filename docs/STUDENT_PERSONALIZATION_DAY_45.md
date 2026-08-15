# GrabIt Student Personalization, Recommendations & Experience Intelligence Report

## 1. Executive Summary & Architecture Overview

Day 45 delivers a production-grade Student Personalization, Recommendations & Experience Intelligence layer for the GrabIt Student Platform.

**Key Personalization Capabilities**:
- **Deterministic & Explainable Recommendations**: Replaces black-box AI predictions with explainable rules (`ORDER_AGAIN`, `POPULAR_AT_CAMPUS`, `TRENDING_NOW`, `POPULAR_AT_CANTEEN`, `TIME_OF_DAY`) accompanied by clear human-understandable reasons (e.g. `"Ordered 4 times by you"`, `"Popular at PSIT Kanpur"`, `"Trending lunch pick"`).
- **Authenticated Identity & Strict Privacy**: Student identity is derived exclusively from `auth.uid()`. Client query parameters attempting identity/scope spoofing (`?student_id=...`, `?user_id=...`, `?campus_id=...`) are explicitly ignored.
- **Availability Filtering**: Only currently available menu items (`is_available === true`) are recommended. Out-of-stock items are automatically excluded.
- **Price Display Rules**: Renders current `menu_items.price` for UI display while preserving historical `order_items.price_at_order` for financial analytics.
- **Recommendation Diversity Rules**: Enforces a maximum of 2 items per category and 3 items per canteen to ensure a diverse menu selection.
- **New Student Fallback**: Gracefully falls back to campus/canteen popularity and time-of-day demand signals if a student has no order history.
- **First-Party Analytics Instrumentation**: Non-blocking tracking of `recommendation_viewed`, `recommendation_clicked`, and `recommendation_added_to_cart` events.
- **Super Admin Recommendation Telemetry**: Exposes aggregate CTR %, click-throughs, and order conversion rates on `/superadmin/analytics`.
- **Zero PII & Read-Only Financial Safety**: Zero student names, emails, phone numbers, or raw user IDs are exposed. 0 database mutations occur during recommendation execution.

---

## 2. Recommendation Categories & Explanations

| Category | Trigger & Scoring Methodology | Example User Explanation |
| :--- | :--- | :--- |
| **`ORDER_AGAIN`** | Student's past completed orders (frequency + recency + completion) | *"Ordered 4 times by you"* |
| **`POPULAR_AT_CAMPUS`** | Aggregated campus order counts and units sold | *"Popular at PSIT Kanpur"* |
| **`TRENDING_NOW`** | Short-window order velocity growth (last 2h vs prior 2h) | *"Trending lunch pick"* |
| **`POPULAR_AT_CANTEEN`** | Canteen top selling menu items | *"Best Seller at North Canteen"* |
| **`TIME_OF_DAY`** | Meal time buckets (`BREAKFAST`, `LUNCH`, `SNACK`, `DINNER`, `LATE_NIGHT`) | *"Popular during lunch"* |

---

## 3. Recommendation Scoring Formula

$$\text{recommendationScore} = (\text{frequencyScore} \times 0.45) + (\text{recencyScore} \times 0.35) + (\text{completionScore} \times 0.20)$$

- **`frequencyScore`**: $\min(100, \text{order\_count} \times 25)$
- **`recencyScore`**: Recency-weighted activity score (100 for recent 7d activity, 70 for 30d)
- **`completionScore`**: $\frac{\text{completed\_orders}}{\text{attempted\_orders}} \times 100$

---

## 4. Student API Security & Identity Isolation

Implemented API endpoint [`app/api/student/recommendations/route.ts`](file:///Users/gopaljidwivedi/GRABIT-WHHG/app/api/student/recommendations/route.ts):

- **Role Guard**: Enforces `auth.uid() -> public.users.role === 'student'`.
- **HTTP Status Codes**:
  - Unauthenticated requests → `401 Unauthorized`.
  - Non-student requests (Vendors/Super Admins) → `403 Forbidden`.
  - Authorized Student → `200 OK`.
- **Identity Isolation**: Query parameters attempting to spoof identity (`?student_id=...`, `?user_id=...`, `?campus_id=...`) are explicitly ignored.

---

## 5. Privacy & Read-Only Financial Audit

- **Privacy Audit**: Passed. Zero student names, emails, phone numbers, delivery addresses, passwords, auth tokens, or raw student IDs exist in response payloads.
- **Financial Immutability**: 0 financial mutations. Tables `orders`, `order_items`, `payments`, `wallets`, `wallet_transactions`, `subscriptions`, `payouts`, `canteens`, and `menu_items` remain 100% unmutated.

---

## 6. QA & Verification Results

- **`npm run lint`**: Passed cleanly with **0 errors and 0 warnings**.
- **`npm run build`**: Next.js production build succeeded with clean static/dynamic route generation for all **45 static and dynamic routes** (`/api/student/recommendations` added).

---

## 7. Operational Status

**STUDENT PERSONALIZATION & RECOMMENDATION INTELLIGENCE READY** ✅
