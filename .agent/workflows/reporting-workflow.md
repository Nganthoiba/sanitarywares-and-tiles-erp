---
description: How to run integration tests and verify ERP reporting modules
---

### Steps to Run Reporting Engine Integrations

1. Execute the reporting CLI verification script:
    ```bash
    php test_reporting.php
    ```
2. Inspect the JSON outputs to verify that execution logs are cleanly persisted under the `report_audit_logs` table.
3. Validate that inventory aggregations join correctly against `product_variants` and `product_families` tables.
