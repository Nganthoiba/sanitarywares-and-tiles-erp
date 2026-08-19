# Implementation Plan - Modern Landing Page Redesign for Tiles & Sanitaryware ERP

Transform the existing basic Landing Page into a stunning, high-converting, enterprise-grade landing page for the **Tiles & Sanitaryware ERP System**, tailored directly to the business lifecycle and product domains described in [README.md](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/README.md).

## User Review Required

> [!IMPORTANT]
> **Key Design & Interactive Feature Highlights:**
> - **Interactive Live UOM Calculator Widget in Hero**: Allows prospective store owners/managers to test tile box-to-sqft and granite slab area calculations right on the landing page!
> - **Stateful Workflow Lifecycle Visualizer**: Interactive 5-stage stepper (Supplier PO ➔ GRN ➔ Warehouse Stock ➔ Allocation ➔ Sales Invoice) highlighting stateful transitions (`PARTIALLY_RECEIVED`, `DIRECT_GRN`, etc.).
> - **Interactive Role Switcher**: Tabs to preview workflows for Super Admin, Store Administrator, Warehouse Manager, and Sales Operator.
> - **Domain-Specific Cards**: Highlights Tiles (Box/PCS/SQFT), Sanitaryware, Marble/Granite Slabs, CP Fittings, and Global Manufacturer Masters (Kajaria, Somany, Jaquar).
> - **Glassmorphic Modern Aesthetic**: Premium gradients, dark/light theme integration, micro-interactions, responsive container scaling, and fluid animations.

---

## Proposed Changes

### Styles & Aesthetics

#### [MODIFY] [app.css](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/css/app.css)
- Add landing page design tokens: glassmorphism cards, glowing gradient badges, animated hero background grid, interactive tabs styling, floating feature cards, and custom scrollbar/responsive utilities.

---

### React Frontend Components

#### [MODIFY] [LandingPage.jsx](file:///home/nganthoiba/projects/sanitarywares-and-tiles-erp/resources/js/components/auth/LandingPage.jsx)
Redesign `LandingPage.jsx` with structured modular sections:
1. **Header / Navbar**: Glassmorphism navbar with brand icon, quick scroll links, and Login / Get Started buttons.
2. **Hero Section with Interactive Sandbox**:
   - Bold hero title & subtext highlighting Multi-Unit Inventory & Procurement.
   - Live interactive **Tiles & Granite Calculator Sandbox** where users can select product type (Tiles vs Granite Slab) and interactively test box-to-sqft or slab dimension calculations.
3. **Core Business Pipeline Stepper**:
   - Visual 5-stage pipeline (Supplier ➔ PO ➔ GRN ➔ Inventory ➔ Sales).
   - Interactive selection showing details on PO Statuses, Direct GRN exception rules, and stock deduction.
4. **Industry Domain Showcase (Grid of Feature Cards)**:
   - *Tile Coverage Engine*: Box/PCS/SQFT auto conversion.
   - *Granite Slab Manager*: Individual slab L×W dimensional surface area pricing.
   - *Global Manufacturer Registry*: Global master setup (Kajaria, Jaquar) vs Tenant Suppliers.
   - *Multi-Branch & Warehouse*: HQ to showroom display & warehouse rack management.
   - *GST Tax & Audit Engine*: HSN/SAC splitting & unalterable audit trails.
5. **Role-Based Workflow Simulator**:
   - Interactive role switcher tabs (Super Admin, Store Owner, Store Supervisor, Sales Staff) showing specialized features for each persona.
6. **Enterprise Metrics & Industry Formats**:
   - Counter metrics (99.9% Stock Accuracy, 100% UOM Precision, 3x Faster Billing).
   - Target format badges (Showrooms, Wholesale Dealers, Stone Yards, Multi-Branch Chains).
7. **Interactive FAQ Accordion**:
   - Answers key domain questions (Tile box coverage, Granite slab dimensions, Direct GRN audit).
8. **High-Impact CTA Section & Footer**:
   - Visual call to action with quick login/registration triggers.
   - Comprehensive footer with links and system info.

---

## Verification Plan

### Automated Tests
- Build verification via Vite:
  - Run `npm run build` or inspect running `npm run dev` hot-reloader logs to ensure zero syntax or compilation errors.

### Manual Verification
- Launch/Inspect the browser landing page using the web dev server (`http://localhost:8000`).
- Test interactive elements on the landing page:
  - Live Tile Box/SQFT Calculator input changes.
  - Live Granite Slab dimension input changes.
  - Interactive Workflow Pipeline step selection.
  - Role switcher tab toggle.
  - FAQ Accordion toggle.
  - Navigation buttons ("Log In", "Get Started", "Enter Application").
