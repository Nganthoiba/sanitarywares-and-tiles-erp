====================================================
ARCHITECTURAL DECISION (MUST FOLLOW)
====================================================

The Building Materials ERP follows a strict Multi-Tenant SaaS architecture.

The following architectural decisions are FINAL and MUST NOT be changed.

---

1. Every User MUST belong to exactly ONE Organization.

---

A user CANNOT exist without an Organization.

The database and application must enforce this rule.

There shall never be orphan users.

---

2. Public User Registration is NOT Allowed.

---

The system MUST NOT provide a generic "Create Account" page.

Anonymous users cannot register themselves as ordinary users.

The only public registration available is:

"Register Your Organization"

---

3. Organization Registration

---

The ERP follows a Self-Service Business Registration model.

A business representative registers an Organization.

Registration consists of two phases.

## Phase 1

Create Organization

Capture information such as:

• Organization Name
• Legal Name
• Business Type
• Country
• State / Province
• City
• Address
• Email
• Phone
• GSTIN (optional/configurable)
• PAN (optional/configurable)
• Business Registration Number (optional/configurable)

## Phase 2

Create Organization Owner Account

Capture:

• Full Name
• Email
• Password
• Confirm Password

The registering user automatically becomes:

Organization Owner

The system MUST automatically create:

• Organization
• Owner User
• Default Administrator Role
• Default Permission Set
• Default Branch
• Default Warehouse
• Default Settings
• Organization Preferences

No manual setup should be required.

---

4. Organization Owner

---

The first registered user is the Organization Owner.

The Organization Owner is automatically assigned the highest role within that Organization.

This role has unrestricted permissions ONLY inside its own Organization.

The Organization Owner CANNOT access data belonging to another Organization.

---

5. Employee Registration

---

Employees MUST NEVER register themselves publicly.

Employees are created ONLY by:

• Organization Owner
OR
• Users with User Management permission.

Supported methods:

• Create User
• Invite User via Email

Invitation flow:

Administrator

↓

Invite Employee

↓

Email Invitation

↓

Accept Invitation

↓

Set Password

↓

Join Organization

Employees never choose an Organization.

The Organization is determined automatically by the invitation.

---

6. Tenant Isolation

---

Every authenticated request must automatically resolve:

Current Organization

Current User

Current Branch

Current Permissions

No Organization ID may be accepted from client-side forms to determine tenancy.

Tenant resolution must rely on the authenticated session.

---

7. Future Expansion

---

The architecture must support future features including:

• Subscription Plans
• Free Trial Organizations
• Paid Organizations
• Organization Verification
• GST Verification
• Business Registration Verification
• Multi-Branch Organizations
• Multiple Warehouses
• SSO
• LDAP / Active Directory
• Mobile Applications
• Public APIs

The implementation must remain extensible without requiring database redesign.
