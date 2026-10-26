# Bean Coffee POS — Deployment Roadmap
## Phase 10 → Phase 12 Completion Plan

**Document Date:** 2026-10-26  
**Current Phase:** Phase 10 (Inventory Management) → Phase 12 (Authentication & Deployment)  
**Project Status:** Backend API functional with sales and inventory. Frontend partial: POS works, Admin view incomplete.

---

## Executive Summary

The project has solid foundation work completed:
- **Backend:** ASP.NET Core 10 API with all CRUD endpoints, transactional inventory management, and sales persistence ✓
- **Frontend:** React/Vite POS interface functional, cart and checkout working ✓
- **Database:** PostgreSQL with proper schema and migrations ✓

**Critical blockers for go-live:**
1. Inventory management modal UI not rendered (state exists but no modal)
2. Sales history view missing entirely (backend exists, no UI)
3. Environment configuration not production-ready
4. No authentication/authorization (Phase 12)
5. Deployment infrastructure missing

**Timeline Estimate:** 6-8 weeks for full deployment readiness

---

## Priority 1: Phase 10 Completion — Inventory Management UI

### 1.1 Create Inventory Management Modal Component
**Effort:** Medium  
**Dependency:** None  
**Files to Create/Modify:**
- `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` (add modal rendering)

**Detailed Tasks:**

#### Task 1.1.1: Render Inventory Modal
Add the missing inventory modal UI below the product modal in App.jsx (around line 1275).

**What to build:**
- Modal backdrop with inventory product details
- Two tabs or sections: "Adjustment Form" and "History"
- Stock-in/stock-out radio or dropdown selector
- Quantity input (validated: positive integer)
- Reason textarea (max 200 chars, required)
- History table showing past adjustments (Date, Type, Quantity, Before/After, Reason)
- Loading state while fetching history
- Error/success messages
- Submit button that calls `handleInventoryAdjustment`
- Close button to dismiss modal

**Acceptance Criteria:**
- Modal appears when "Manage inventory" button clicked on any product
- Current stock quantity displayed prominently
- Adjustment form has proper validation feedback
- History loads from `/api/products/{id}/stock-adjustments`
- Stock-in and stock-out operations both work
- Success/error states show correctly
- Modal closes after successful adjustment

**Code Location:** `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` lines 77-189 (logic exists, need UI)

---

### 1.2 Add Low-Stock Alert Component
**Effort:** Small  
**Dependency:** 1.1 (visual consistency)  
**Files to Create/Modify:**
- `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` (Admin page)

**Detailed Tasks:**

#### Task 1.2.1: Low-Stock Alert Widget
Add a prominent alert widget in the admin dashboard above the product table.

**What to build:**
- Collapsible alert banner showing products with stock <= 5
- List with product name, current stock, and quick link to manage inventory
- Dismiss/hide option
- Visual styling: warning color (yellow/amber)

**Acceptance Criteria:**
- Shows on Admin page load
- Only displays products with 0 < stock <= 5
- Updates when inventory is adjusted
- Can be dismissed by user
- Re-appears on page refresh

**Code Location:** `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` around line 800 (stat cards area)

---

### 1.3 Out-of-Stock Prevention Feedback
**Effort:** Small  
**Dependency:** None  
**Files to Modify:**
- `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx`

**Detailed Tasks:**

#### Task 1.3.1: Enhanced Disabled Product Card UI
Improve visual feedback when products are unavailable or out of stock.

**What to build:**
- Add overlay or visual indicator on disabled product cards in POS
- Show "Out of Stock" or "Unavailable" badge
- Disable add-to-cart button with tooltip explaining why
- Different styling for temp out-of-stock vs. unavailable

**Acceptance Criteria:**
- Unavailable/out-of-stock products have clear visual distinction
- Tooltips explain why product can't be purchased
- Mobile-responsive design maintained
- No regression to working products

**Code Location:** `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` lines 628-654 (product card)

---

### 1.4 Inventory History View
**Effort:** Medium  
**Dependency:** 1.1 (modal exists, need dedicated page)  
**Files to Create/Modify:**
- `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` (add new view tab)

**Detailed Tasks:**

#### Task 1.4.1: Inventory History Page/Tab
Create dedicated page showing all inventory adjustments across all products with filtering.

**What to build:**
- New view accessible from admin sidebar
- Table or timeline of all stock adjustments (newest first)
- Columns: Product Name, Adjustment Type (In/Out), Quantity, Before/After, Reason, Timestamp
- Filter by product, date range, adjustment type
- Export to CSV option (optional, Phase 11+)
- Pagination for large datasets

**Acceptance Criteria:**
- Accessible from Admin area
- Shows all adjustments across all products
- Can filter by product
- Sorted by most recent first
- Display reason for each adjustment
- Mobile-responsive layout

**Code Location:** `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` (new section near line 754)

---

## Priority 2: Phase 11 Partial — Sales History UI

### 2.1 Create Sales History Page
**Effort:** Large  
**Dependency:** Backend API working (`/api/sales` endpoint verified)  
**Files to Create/Modify:**
- `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` (add new view)

**Detailed Tasks:**

#### Task 2.1.1: Sales Transaction List View
Create paginated sales history listing accessible from Admin area.

**What to build:**
- New admin view showing all completed sales
- Table with columns: Sale ID, Date/Time, Total Amount, Cash Received, Change
- Pagination controls (page size 20 by default, max 100)
- Click row to view sale details
- Date range filter (optional: from/to date pickers)
- Search by sale ID
- Loading and error states
- Empty state message when no sales

**Acceptance Criteria:**
- Shows paginated list of sales ordered newest first
- Calls `/api/sales?page=1&pageSize=20` correctly
- Pagination works (prev/next, page numbers)
- Can click sale row to view details
- Displays currency in PHP format
- Responsive on mobile/tablet
- Error handling for API failures

**API Reference:**
```
GET /api/sales?page=1&pageSize=20
Response:
{
  page: 1,
  pageSize: 20,
  totalCount: 45,
  totalPages: 3,
  items: [
    {
      id: 1,
      totalAmount: 450.00,
      cashReceived: 500.00,
      changeDue: 50.00,
      createdAt: "2026-10-26T10:30:00Z",
      items: [...]
    }
  ]
}
```

**Code Location:** `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` (new view near line 754)

---

#### Task 2.1.2: Sales Detail Modal
Show full details of a single sale transaction.

**What to build:**
- Modal showing:
  - Sale ID and timestamp
  - Line items table (Product, Quantity, Unit Price, Line Total)
  - Subtotal (sum of line totals)
  - Total Amount
  - Cash Received
  - Change Due
  - Print receipt button (stretch goal)
- Close button

**Acceptance Criteria:**
- Modal opens when clicking a sale row
- Shows all items purchased in that transaction
- Displays prices in PHP format
- Handles missing product names gracefully
- Print-friendly layout

**API Reference:**
```
GET /api/sales/{id}
Response:
{
  id: 1,
  totalAmount: 450.00,
  cashReceived: 500.00,
  changeDue: 50.00,
  createdAt: "2026-10-26T10:30:00Z",
  items: [
    {
      id: 1,
      productId: 5,
      productName: "Caramel Latte",
      quantity: 2,
      unitPrice: 150.00,
      lineTotal: 300.00
    }
  ]
}
```

**Code Location:** `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` (modal section near line 1140)

---

### 2.2 Revenue Dashboard (Optional for Phase 11)
**Effort:** Medium  
**Dependency:** 2.1  
**Status:** Planned but lower priority than core sales history

**What to build:**
- Summary cards: Total Revenue (today/week/month), Transaction Count, Average Transaction
- Bar chart: Daily revenue trend (7 days)
- Top products by quantity sold (table)

---

## Priority 3: Integration Gaps & API Alignment

### 3.1 Verify API Response Field Names
**Effort:** Small  
**Dependency:** None  
**Files to Check:**
- `/Users/gerard/Developer/Bean-Coffee-POS/backend/Bean.Api/Program.cs` (endpoints)
- `/Users/gerard/Developer/Bean-Coffee-POS/backend/Bean.Api/DTOs/` (response DTOs)
- `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` (consumption)

**Detailed Tasks:**

#### Task 3.1.1: Document API Contract
Ensure frontend field names match backend responses.

**Verification Checklist:**
- [ ] Product response includes `categoryName` (not just `categoryId`)
- [ ] Stock adjustment response includes `productName`, `stockBefore`, `stockAfter`
- [ ] Sale response includes `items` array with `productName`, `unitPrice`, `lineTotal`
- [ ] All timestamps in ISO 8601 format with UTC timezone
- [ ] Error responses use consistent format (check App.jsx error parsing)

**Action:** If mismatches found, update DTOs in backend to match frontend expectations or update frontend parsing logic.

**Code Locations:**
- Backend DTOs: `/Users/gerard/Developer/Bean-Coffee-POS/backend/Bean.Api/DTOs/`
- Frontend API handler: `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` lines 32-65 (apiRequest function)

---

### 3.2 Standardize Error Handling
**Effort:** Small  
**Dependency:** 3.1  
**Files to Modify:**
- `/Users/gerard/Developer/Bean-Coffee-POS/backend/Bean.Api/Program.cs`
- `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx`

**Detailed Tasks:**

#### Task 3.2.1: Consistent Error Response Format
Ensure all API errors follow same structure.

**Standard format:**
```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {}
}
```

**Current format issues to fix:**
- Validation errors use `Dictionary<string, string[]>` format (correct in backend, needs frontend awareness)
- NotFound responses use custom `{ message: "..." }` format (should standardize)
- Ensure frontend's `apiRequest()` function handles all variants

**Acceptance Criteria:**
- All error responses use consistent structure
- Frontend error parsing handles validation errors correctly
- User-facing error messages are clear and actionable
- No console errors for unexpected formats

**Code Locations:**
- Backend error handling: `/Users/gerard/Developer/Bean-Coffee-POS/backend/Bean.Api/Program.cs` throughout
- Frontend error parsing: `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` lines 52-62

---

### 3.3 CORS Configuration for Deployment
**Effort:** Small  
**Dependency:** Environment setup (Priority 4)  
**Files to Modify:**
- `/Users/gerard/Developer/Bean-Coffee-POS/backend/Bean.Api/Program.cs`
- `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx`

**Detailed Tasks:**

#### Task 3.3.1: Environment-Aware CORS
Update CORS policy to handle both dev and production URLs.

**Current state (lines 18-26 of Program.cs):**
```csharp
.WithOrigins("http://localhost:5173")
```

**Required changes:**
- Read frontend URL from configuration (environment variable)
- Support multiple origins (dev, staging, prod)
- Restrict in production (no wildcard)

**Acceptance Criteria:**
- Dev environment allows localhost:5173
- Production uses configured domain only
- No `AllowAnyOrigin()` in production
- No console warnings about CORS

**Code Location:** `/Users/gerard/Developer/Bean-Coffee-POS/backend/Bean.Api/Program.cs` lines 18-26

---

## Priority 4: Environment Configuration & Deployment

### 4.1 Production Configuration Files
**Effort:** Medium  
**Dependency:** None  
**Files to Create:**
- `appsettings.Production.json` (backend)
- `.env.production` (frontend)
- `.env.example` (documentation)
- Docker configuration files (optional)

**Detailed Tasks:**

#### Task 4.1.1: Backend Production Configuration
Create production-specific settings for ASP.NET Core API.

**File:** `/Users/gerard/Developer/Bean-Coffee-POS/backend/Bean.Api/appsettings.Production.json`

**Contents:**
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Error"
    }
  },
  "AllowedHosts": "yourdomain.com,www.yourdomain.com",
  "ConnectionStrings": {
    "DefaultConnection": "${POSTGRES_CONNECTION_STRING}"
  }
}
```

**Acceptance Criteria:**
- File created and in .gitignore
- Sensitive data uses environment variable placeholders
- Logging level set appropriately for production
- AllowedHosts configured for deployment domain

**Code Location:** `/Users/gerard/Developer/Bean-Coffee-POS/backend/Bean.Api/`

---

#### Task 4.1.2: Frontend Environment Configuration
Create environment-specific frontend configuration.

**File:** `/Users/gerard/Developer/Bean-Coffee-POS/frontend/.env.production`

**Contents:**
```
VITE_API_BASE_URL=https://api.yourdomain.com
NODE_ENV=production
```

**Update:** Modify `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` line 22:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5080/api";
```

**Acceptance Criteria:**
- .env.production file created
- Not committed to git
- Frontend reads from environment variables
- Build process applies environment-specific config

**Code Location:** `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` line 22

---

#### Task 4.1.3: Environment Documentation
Create `.env.example` file documenting all required variables.

**File:** `/Users/gerard/Developer/Bean-Coffee-POS/.env.example`

**Contents:**
```
# Backend (ASP.NET Core)
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:5080
POSTGRES_CONNECTION_STRING=Host=db-host;Port=5432;Database=bean_pos;Username=postgres;Password=xxxx
POSTGRES_DB=bean_pos
POSTGRES_USER=postgres
POSTGRES_PASSWORD=xxxx

# Frontend (React/Vite)
VITE_API_BASE_URL=https://api.yourdomain.com
NODE_ENV=production
```

**Acceptance Criteria:**
- Example file documents all required env vars
- Clear instructions for deployment team
- Sensitive values masked with xxxx
- Not used directly (only reference)

---

### 4.2 Database Seeding Strategy
**Effort:** Medium  
**Dependency:** 4.1  
**Files to Create:**
- `DatabaseSeeder.cs` (backend service)
- Seed data JSON file
- Seed script/endpoint

**Detailed Tasks:**

#### Task 4.2.1: Initial Data Seeding
Create mechanism to populate database with initial categories and demo products.

**What to build:**
- DatabaseSeeder service in backend
- Seed method called on first-run or migration
- JSON file with initial categories (Espresso, Latte, Pastries, etc.)
- Demo products for each category
- Idempotent seeding (won't duplicate on re-runs)

**File:** `/Users/gerard/Developer/Bean-Coffee-POS/backend/Bean.Api/Services/DatabaseSeeder.cs` (create)

**Acceptance Criteria:**
- Seeder runs automatically on `dotnet ef database update`
- Creates standard categories (Espresso Drinks, Milk Drinks, etc.)
- Adds 10-15 demo products with realistic pricing
- Safe to run multiple times (no duplicate errors)
- Can be disabled via configuration if needed

---

### 4.3 Build & Deployment Scripts
**Effort:** Medium  
**Dependency:** 4.1, 4.2  
**Files to Create:**
- `deploy.sh` (Unix/Linux deployment script)
- `deploy.ps1` (Windows deployment script)
- `docker-compose.yml` (containerization, optional)
- `Dockerfile` (backend and frontend)

**Detailed Tasks:**

#### Task 4.3.1: Deployment Automation Script
Create shell script to orchestrate deployment steps.

**File:** `/Users/gerard/Developer/Bean-Coffee-POS/deploy.sh`

**Script tasks:**
1. Validate environment variables
2. Build backend (`dotnet publish`)
3. Build frontend (`npm run build`)
4. Run database migrations
5. Run seeder (if needed)
6. Start services (systemd or docker)
7. Health check endpoints
8. Report success/failure

**Acceptance Criteria:**
- Script is executable
- Performs all steps in correct order
- Rolls back on failure
- Clear success/failure messaging
- Documented with usage instructions

---

#### Task 4.3.2: Docker Containerization (Optional but Recommended)
Create Docker setup for consistent deployment across environments.

**Files:**
- `/Users/gerard/Developer/Bean-Coffee-POS/Dockerfile.backend`
- `/Users/gerard/Developer/Bean-Coffee-POS/Dockerfile.frontend`
- `/Users/gerard/Developer/Bean-Coffee-POS/docker-compose.yml`

**Acceptance Criteria:**
- Backend container runs on port 5080
- Frontend container runs on port 5173 (dev) or 80 (prod)
- PostgreSQL container with named volume for persistence
- docker-compose up starts full stack
- Health checks configured

---

## Priority 5: Phase 12 — Authentication & Authorization

### 5.1 User Authentication System
**Effort:** Large  
**Dependency:** 4.1, 4.2  
**Files to Create/Modify:**
- Backend: User model, auth controller, JWT middleware
- Frontend: Login page, auth state, protected routes

**Detailed Tasks:**

#### Task 5.1.1: Backend Authentication
Implement JWT-based authentication for ASP.NET Core API.

**What to build:**
- User model with hashed password
- AuthController with `/api/auth/login` endpoint
- JWT token generation
- Middleware to validate tokens on protected routes
- Refresh token mechanism (optional)

**Acceptance Criteria:**
- Login endpoint returns JWT token
- Token includes user ID and role
- Protected endpoints reject requests without valid token
- Token expiration enforced (recommend 1-24 hours)
- Refresh token extends session (optional)

**Code Location:** `/Users/gerard/Developer/Bean-Coffee-POS/backend/Bean.Api/`

---

#### Task 5.1.2: Frontend Authentication UI
Create login page and authentication state management.

**What to build:**
- Login form with username/email and password fields
- Store JWT in localStorage/sessionStorage
- Add token to all API request headers
- Redirect to login if token missing/expired
- Logout functionality
- "Remember me" option (optional)

**Acceptance Criteria:**
- Login page accessible before auth
- Credentials validated against backend
- JWT stored securely
- Token sent with all API requests
- Logout clears session
- Redirect to login on 401 response

**Code Location:** `/Users/gerard/Developer/Bean-Coffee-POS/frontend/src/App.jsx` or new `Login.jsx` component

---

### 5.2 Role-Based Access Control (RBAC)
**Effort:** Large  
**Dependency:** 5.1  
**Files to Modify:**
- Backend: Authorization policies
- Frontend: Route guards, UI visibility

**Detailed Tasks:**

#### Task 5.2.1: Role Definition & Backend Authorization
Define roles and protect endpoints by role.

**Roles:**
- **Cashier:** Can view POS, add to cart, checkout, view sales history (read-only)
- **Admin:** Can manage products, categories, inventory, view all reports
- **Manager:** Can view analytics, generate reports, export data (Phase 11+)

**What to build:**
- User model with Role field
- Authorization attributes on endpoints (e.g., `[Authorize(Roles = "Admin")]`)
- Seed initial admin user
- Endpoint to manage user roles (admin only)

**Acceptance Criteria:**
- Cashier cannot access `/api/products` PUT/DELETE
- Admin can perform all operations
- Unauthorized requests return 403 Forbidden
- Token contains role claim

---

#### Task 5.2.2: Frontend Route Guards & UI Hiding
Enforce role-based access on frontend.

**What to build:**
- Route protection (redirect to login or error if unauthorized)
- Hide admin menu for cashier users
- Show only allowed tabs/actions per role
- Display "Unauthorized" message if attempting restricted action

**Acceptance Criteria:**
- Cashier cannot navigate to admin section
- Admin menu visible to admin only
- Inventory/category management hidden for cashier
- Clear messaging when lacking permissions

---

### 5.3 Security Hardening
**Effort:** Medium  
**Dependency:** 5.1, 5.2  
**Files to Modify:**
- Backend: Program.cs, all controllers
- Frontend: App.jsx
- DevOps: deployment scripts

**Detailed Tasks:**

#### Task 5.3.1: HTTPS/TLS Configuration
Ensure all traffic is encrypted in production.

**What to implement:**
- SSL certificate (Let's Encrypt recommended)
- HTTPS endpoint configuration
- HSTS header (Strict-Transport-Security)
- Redirect HTTP to HTTPS
- Secure cookie flags

**Acceptance Criteria:**
- HTTPS enforced in production
- No mixed content (all resources loaded via HTTPS)
- HSTS header present
- Certificate valid and not self-signed

---

#### Task 5.3.2: Input Validation & Output Encoding
Prevent injection attacks and XSS.

**What to implement:**
- Validate all API input (already partially done, verify completeness)
- Sanitize user input on frontend
- Encode output in templates (React does this by default)
- Use parameterized queries (EF Core does this)
- Content Security Policy header

**Acceptance Criteria:**
- No SQL injection possible (parameterized queries used)
- No XSS vulnerabilities (input sanitized, output encoded)
- CSP header configured

---

#### Task 5.3.3: Secrets Management
Secure sensitive configuration data.

**What to implement:**
- Use Azure Key Vault or AWS Secrets Manager
- Never commit `.env` or secrets to git
- Document secrets rotation process
- API keys for external services (if any)

**Acceptance Criteria:**
- No secrets in source code
- Production secrets separate from dev
- Clear documentation for secrets management

---

## Priority 6: Testing & Quality Assurance

### 6.1 Backend API Testing
**Effort:** Medium  
**Dependency:** None (can start immediately)  
**Files to Create:**
- Test project with xUnit/nUnit
- Integration tests for each endpoint

**Detailed Tasks:**

#### Task 6.1.1: Integration Test Suite
Create comprehensive test coverage for API endpoints.

**What to test:**
- Happy path: Create product, add to cart, checkout
- Error cases: Insufficient stock, invalid input
- Inventory: Stock adjustments, negative stock prevention
- Sales: Transaction persistence, inventory deduction
- Concurrency: Multiple simultaneous checkouts

**Acceptance Criteria:**
- Tests cover all CRUD endpoints
- Happy path and error cases both tested
- Tests pass consistently
- At least 80% code coverage

---

### 6.2 Frontend Component Testing
**Effort:** Medium  
**Dependency:** None  
**Files to Create:**
- Jest/Vitest configuration
- Component tests for critical flows

**Detailed Tasks:**

#### Task 6.2.1: Critical Path Testing
Test key user workflows.

**What to test:**
- Product catalog loads
- Add to cart functionality
- Cart quantity updates
- Checkout validation
- Admin product creation/edit
- Inventory adjustment

**Acceptance Criteria:**
- Tests run with `npm test`
- Critical workflows tested
- At least 60% code coverage
- Tests pass in CI/CD pipeline

---

### 6.3 End-to-End Testing
**Effort:** Medium  
**Dependency:** 6.1, 6.2  
**Files to Create:**
- Cypress or Playwright test suite
- Automated workflow scenarios

**Test Scenarios:**
1. Customer POS workflow (browse → add → checkout)
2. Admin workflow (add product → adjust stock → view sales)
3. Payment edge cases (insufficient cash, exact amount, over-pay)
4. Inventory edge cases (stock deduction, low-stock alerts)

---

## Priority 7: Documentation & Deployment Preparation

### 7.1 API Documentation
**Effort:** Small  
**Dependency:** 3.1  
**Files to Create/Modify:**
- Swagger annotations in Program.cs (already partially done)
- Postman collection export
- API.md documentation file

**Detailed Tasks:**

#### Task 7.1.1: Complete Swagger Documentation
Ensure all endpoints documented with descriptions and examples.

**What to add:**
- Request/response examples for each endpoint
- Error response documentation
- Authentication requirements
- Rate limiting info (if implemented)

**Acceptance Criteria:**
- Swagger UI shows all endpoints
- Examples for each endpoint
- Clear descriptions
- No warnings/errors in Swagger

---

### 7.2 Deployment Guide
**Effort:** Small  
**Dependency:** 4.3  
**Files to Create:**
- `DEPLOYMENT.md`
- Infrastructure architecture diagram
- Backup/recovery procedures

**Contents:**
- System requirements (OS, runtime, database)
- Step-by-step deployment instructions
- Environment variable setup
- Database backup procedures
- Health check verification
- Rollback procedures
- Troubleshooting guide

---

### 7.3 Operations Runbook
**Effort:** Small  
**Dependency:** 7.2  
**Files to Create:**
- `OPERATIONS.md`

**Contents:**
- Daily checks (health endpoints, disk space)
- Backup procedures
- Log rotation
- Password rotation
- Update procedures
- Incident response steps

---

## Execution Timeline

### Week 1-2: Phase 10 Completion (Inventory UI)
- Task 1.1: Inventory modal (3-4 days)
- Task 1.2: Low-stock alerts (1-2 days)
- Task 1.3: Out-of-stock feedback (1 day)
- Task 1.4: Inventory history view (2-3 days)

### Week 3-4: Phase 11 Partial (Sales UI)
- Task 2.1: Sales history page (3-4 days)
- Task 2.1.2: Sales detail modal (2 days)
- Integration testing (2-3 days)

### Week 5: Integration & Configuration
- Task 3.1-3.3: API alignment & error handling (2-3 days)
- Task 4.1: Environment configuration (1-2 days)
- Task 4.2: Database seeding (1 day)

### Week 6: Deployment Setup
- Task 4.3: Deployment scripts (2-3 days)
- Documentation updates (1 day)
- Testing: backend + frontend (2-3 days)

### Week 7-8: Phase 12 (Auth & Security)
- Task 5.1: Authentication system (3-4 days)
- Task 5.2: RBAC implementation (2-3 days)
- Task 5.3: Security hardening (2-3 days)
- Final testing & QA (3-4 days)

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| API field name mismatches | High | Medium | Complete Task 3.1 first |
| Frontend modal complexity | Medium | Medium | Build incrementally, test early |
| Database migration issues | High | Low | Test migrations locally, backup before prod |
| Authentication integration | High | Medium | Follow ASP.NET Core auth guide, test thoroughly |
| CORS/deployment issues | Medium | Medium | Test CORS early, use docker for consistency |
| Performance under load | Medium | Low | Load test sales endpoint before go-live |

---

## Success Metrics

- [ ] All Phase 10 features working (inventory UI, alerts, history)
- [ ] Sales history page functional with pagination
- [ ] All API responses validated and documented
- [ ] Environment configuration production-ready
- [ ] Authentication system working with role-based access
- [ ] 80% backend test coverage, 60% frontend coverage
- [ ] Security review completed (no critical findings)
- [ ] Deployment scripts tested and documented
- [ ] Team trained on deployment procedures
- [ ] System runs for 24 hours without errors under typical load

---

## Files Summary

### Files to Create
```
backend/Bean.Api/Services/DatabaseSeeder.cs
backend/Bean.Api/appsettings.Production.json
backend/Bean.Api/Models/User.cs
backend/Bean.Api/Controllers/AuthController.cs
backend/Tests/IntegrationTests.cs
frontend/.env.production
frontend/.env.example
frontend/src/components/InventoryModal.jsx (or inline in App.jsx)
frontend/src/components/SalesHistory.jsx (or inline in App.jsx)
.env.example
deploy.sh
docker-compose.yml
Dockerfile
DEPLOYMENT.md
OPERATIONS.md
```

### Files to Modify
```
backend/Bean.Api/Program.cs (CORS, auth middleware, seeding)
backend/Bean.Api/DTOs/* (validation, consistency)
frontend/src/App.jsx (modals, new views, environment config)
frontend/package.json (test dependencies)
README.md (update phase status)
```

---

## Next Steps

1. **Immediate:** Review this roadmap with team; confirm priorities
2. **Week 1:** Start Task 1.1 (inventory modal) in parallel with Task 3.1 (API alignment)
3. **Checkpoint:** After Week 2, demo Phase 10 completion
4. **Continuous:** Maintain documentation and commit messages per Phase requirements
5. **Pre-launch:** Complete security review (Task 5.3) and load testing

---

**Document prepared by:** Claude Code  
**Last updated:** 2026-10-26  
**Review interval:** After each phase completion
