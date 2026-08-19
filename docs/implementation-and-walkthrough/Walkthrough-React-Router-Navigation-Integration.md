Walkthrough: React Router Navigation Integration
We have successfully migrated the application's navigation system from manual state tracking (view and activeTab) to a declarative React Router setup using react-router-dom (v7).
Changes Made

1. Root Routing Configuration
   We wrapped the entry point in app.jsx with <BrowserRouter> and migrated the rendering logic to <Routes> and <Route>.
   • Public Routes:
   ◦ / (Landing Page)
   ◦ /login (Login)
   ◦ /register (Register Organization)
   ◦ /accept-invitation (Accept Invitation)
   • Dashboard Layout:
   ◦ Configured <DashboardLayout> layout route that wraps all authenticated view screens.
   ◦ Implemented <ProtectedRoute> and <GuestRoute> component controllers to handle token validation gates and redirect users to correct states without screen flash.
   ◦ Sidebar links migrated from buttons with click handlers to <NavLink> elements with active styling.
   ◦ Dynamic menus (GRN, Purchase Orders, Products) now auto-expand if any of their nested routes are currently active.
2. View Mode Synchronization
   Inside nested components, when internal tab/view changes occur (e.g. switching between list registries and form views), we pass the parent router navigate callbacks to sync the URL:
   • /grn and /grn/new
   • /purchase-orders and /purchase-orders/new
   • /products/variants and /products/families

Verification Results

1. Automated Verification
   • Ran PHPUnit test suite: Passed (83 tests, 282 assertions).
   • Ran BI Reporting Hub integration script: Passed.
2. Browser Verification
   The browser subagent logged into the portal, navigated through the sidebar, triggered sub-menus, refreshed /grn/new to test page refresh persistence, and clicked back to verify history preservation.
   Here is the recorded video demonstration of the verified routing flow:
