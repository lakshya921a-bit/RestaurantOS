# RestaurantOS — full-stack foundation

A Next.js + TypeScript + Tailwind CSS + PostgreSQL starter for restaurant operations, table management, POS workflows and QR ordering.

## Included
- Next.js App Router application and minimalist responsive dashboard
- PostgreSQL + Prisma schema for restaurants, branches, users, tables, menus, orders, payments, reservations, customers, inventory and audit logs
- Password-hash login and signed, HTTP-only session cookie
- Role checks and tenant/branch-scoped data access helpers
- Order creation with server-side menu pricing, database transaction, idempotency key and table conflict check
- Explicit order status transition endpoint and audit records
- QR-token menu endpoint and guest order endpoint
- Payment record endpoint; cash payments are recorded directly, non-cash stays pending
- Razorpay webhook signature verification skeleton
- Docker Compose PostgreSQL and seed script

## Run locally
Requirements: Node.js 20+, npm, Docker Desktop.

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma generate
npx prisma migrate dev --name init
ALLOW_DEMO_SEED=true npm run db:seed
npm run dev
```

Open http://localhost:3000

Demo login:
- Email: `owner@example.com`
- Password: `ChangeMe123!`

Change the demo password before exposing the app to any network. Seed is blocked unless `ALLOW_DEMO_SEED=true`.

## Important security / production gaps
This is a foundation, not a certified production POS. Before handling live restaurant operations:
1. Add account registration, password reset, MFA, session revocation, login throttling and stronger CSRF/origin protections.
2. Add tenant-safe admin CRUD for branches, tables, menu, reservations, staff, ingredients, recipes and suppliers.
3. Add a secure QR issuance/rotation workflow. Current QR guest API expects a 64-character random token whose SHA-256 hash is stored in `DiningTable.qrTokenHash`; the seed intentionally does not print raw tokens.
4. Implement real-time delivery (WebSocket/SSE) and reliable offline queueing.
5. Complete payment provider order creation, exact webhook event mapping, refund handling, reconciliation and provider idempotency. Do not mark card/UPI payments successful from a browser.
6. Implement GST invoice logic with professional review, credit notes, invoice numbering and immutable financial audit.
7. Add inventory deduction under transaction/locking and tested recipe units.
8. Add tests (unit, integration, concurrency and Playwright E2E), CI, dependency scanning, backups, monitoring, alerts, rate limits and security review.
9. Add proper data retention, privacy notices, consent and deletion/export workflows.
10. Review Prisma transaction retry behavior for serialization conflicts in the deployment database.

## Money representation
All monetary values are stored as integer paise (`pricePaise`, `totalPaise`). `₹240` is stored as `24000`.

## QR guest API
- `GET /api/qr/{raw-64-char-token}/menu`
- `POST /api/qr/{raw-64-char-token}/orders`
The guest order payload includes branchId, tableId, type=`DINE_IN`, idempotencyKey and item product IDs/quantities. Server-side prices are always loaded from PostgreSQL.

## Architecture notes
- `src/lib/auth.ts`: signed session, user lookup and role authorization.
- `src/app/api/orders/route.ts`: staff order API.
- `src/app/api/orders/[id]/status/route.ts`: state machine.
- `src/app/api/qr/[token]/...`: guest QR endpoints.
- `prisma/schema.prisma`: tenant-aware relational data model.

Do not deploy with the demo secret or default database credentials. Use managed PostgreSQL, strong secrets, HTTPS, secure backups and a reviewed deployment configuration.
