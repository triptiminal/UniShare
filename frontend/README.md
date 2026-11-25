# UniShare frontend (React + Vite)

Student-to-student rental platform for Medi-Caps University. This app talks to the UniShare Spring Boot backend.

## Run it
1. Start the backend (port 8080) with MySQL and MongoDB running.
2. In this folder:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:5173

The dev server proxies `/api` and `/ws` to `http://localhost:8080` (see `vite.config.js`), so there is no CORS setup to do.
Sign in as the seeded admin (`admin@campusrent.local`) to see the admin panel at `/admin`.

## Screens and routes
| Route | Screen | Backend it uses |
|---|---|---|
| `/` | Explore (search, categories, filters, sort) | GET /api/listings, /listings/categories, /saved/ids |
| `/listing/:id` | Item details, dates, send request, reviews, report | GET /listings/{id}, /reviews, POST /bookings |
| `/login`, `/register` | Sign in and join | POST /auth/login, /auth/register, GET /colleges |
| `/verify` | College verification (email code, or ID upload) | POST /verification/otp, /otp/confirm, /id |
| `/dashboard` | Dashboard | GET /bookings, /my/listings, /transactions |
| `/requests` | Incoming and outgoing requests | GET /bookings, POST accept, decline, cancel |
| `/rental/:id` | Rental hub for every status: photos, handover, return, claim, dispute, settlement, review | /bookings/{id}/... |
| `/rental/:id/pay` | Checkout with Razorpay, all four payment outcomes | POST /bookings/{id}/pay, /payments/verify |
| `/messages/:bookingId` | Chat, live over WebSocket (STOMP) | GET/POST /bookings/{id}/messages, /ws |
| `/my-listings`, `/listings/new`, `/listings/:id/edit` | Manage listings | /my/listings, /listings |
| `/payments` | Payments and history | GET /transactions |
| `/saved`, `/profile`, `/u/:id` | Saved items, profile, public profile | /saved, /users/me, /public/users/{id} |
| `/admin/...` | Dashboard, disputes, verifications, users, listings, audit log | /admin/... |

The bell in the header shows notifications from `/api/notifications` (refreshed every 30 seconds).

## Backend tweaks that make the UI complete (small, optional)
1. **Admin can see uploaded college IDs.** In the backend `Dtos.java`, add a last component to `UserDto`:
   `..., BigDecimal ratingAvg, int ratingCount, String verificationDocUrl)` and append `, u.getVerificationDocUrl()` at the end of `UserDto.from(...)`.
2. **"Academic essentials" category** (used by your design). In `Listing.java` add `ACADEMIC` to `enum Category`. The category list in the app comes from the backend, so it appears automatically.
3. **Rental code prefix.** The backend generates `CR-30001`. For `US-30001`, change `"CR-"` to `"US-"` in `BookingService.request`.

## Notes
- Photos: set `app.cloudinary.*` in the backend. Until then, the uploader falls back to "paste an image link".
- Razorpay: put TEST keys in the backend. The browser never sees card details, and payment is marked paid only after the backend verifies the signature.
- Tokens are kept in `localStorage` and refreshed automatically. Fine for a student project; use httpOnly cookies for production.
- For deployment, serve the built app (`npm run build`) from the same origin as the API (for example behind nginx), because the app calls `/api` and `/ws` with relative URLs.
