import os
import re

# Directory to scan for PHP files
directories = ["app", "tests", "database"]
standalone_tests = ["test_inventory.php", "test_accounting.php", "test_reporting.php", "test_workflow.php"]

# Singular mapping
singular_map = {
    "organizations": "organization",
    "tax_profiles": "tax_profile",
    "units": "unit",
    "categories": "category",
    "brands": "brand",
    "manufacturers": "manufacturer",
    "branches": "branch",
    "warehouses": "warehouse",
    "permission_groups": "permission_group",
    "permissions": "permission",
    "roles": "role",
    "suppliers": "supplier",
    "customers": "customer",
    "product_families": "product_family",
    "product_variants": "product_variant",
    "product_attributes": "product_attribute",
    "account_groups": "account_group",
    "accounts": "account",
    "workflow_definitions": "workflow_definition",
    "workflow_steps": "workflow_step",
    "workflow_conditions": "workflow_condition",
    "workflow_actions": "workflow_action",
    "financial_years": "financial_year",
    "journal_batches": "journal_batch"
}

# 1. Let's find all occurrences of ->name or ['name'] or 'name' =>
# across all files to see where we might need to modify name to singular_name
results = []
def scan_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()
    for idx, line in enumerate(lines):
        line_num = idx + 1
        # Check for ->name or ['name'] or "name" or 'name' => or 'name' =>
        if "->name" in line or "'name'" in line or '"name"' in line:
            results.append((filepath, line_num, line.strip()))

# Scan directories
for directory in directories:
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".php"):
                scan_file(os.path.join(root, file))

for file in standalone_tests:
    if os.path.exists(file):
        scan_file(file)

print(f"Found {len(results)} matches for name-related strings:")
# Save first 200 matches or all
with open("codebase_name_references.txt", "w", encoding="utf-8") as out:
    for r in results:
        out.write(f"{r[0]}:{r[1]}: {r[2]}\n")

print("Done scanning. Written references to codebase_name_references.txt")
