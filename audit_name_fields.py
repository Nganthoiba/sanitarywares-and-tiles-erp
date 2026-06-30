import os
import re

migrations_dir = "database/migrations"
files = sorted(os.listdir(migrations_dir))

# Helper to singularize simple English plurals
def singularize(table_name):
    # Mapping for special terms in this codebase if any
    special = {
        "categories": "category",
        "companies": "company",
        "tax_profiles": "tax_profile",
        "permissions": "permission",
        "workflow_definitions": "workflow_definition",
        "workflow_versions": "workflow_version",
        "workflow_steps": "workflow_step",
        "workflow_conditions": "workflow_condition",
        "workflow_actions": "workflow_action",
        "workflow_transitions": "workflow_transition",
        "workflow_instances": "workflow_instance",
        "workflow_instance_steps": "workflow_instance_step",
        "workflow_executions": "workflow_execution",
        "workflow_audits": "workflow_audit",
        "financial_years": "financial_year",
        "bank_accounts": "bank_account",
        "bank_transactions": "bank_transaction",
        "opening_balances": "opening_balance",
        "closing_entries": "closing_entry",
        "report_audit_logs": "report_audit_log",
        "storage_locations": "storage_location",
        "permission_groups": "permission_group",
    }
    if table_name in special:
        return special[table_name]
    
    if table_name.endswith("ies"):
        return table_name[:-3] + "y"
    if table_name.endswith("s") and not table_name.endswith("ss"):
        return table_name[:-1]
    return table_name

results = []
for file in files:
    if not file.endswith(".php"):
        continue
    filepath = os.path.join(migrations_dir, file)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Extract table name: Schema::create('tableName', ...
    table_match = re.search(r"Schema::create\(\s*[\"\']([^\"\']+)[\"\']", content)
    if not table_match:
        continue
    table_name = table_match.group(1)
    
    lines = content.splitlines()
    for idx, line in enumerate(lines):
        line_num = idx + 1
        # Search for string('name') or text('name') or similar
        match = re.search(r"->(?:string|text|char|varchar)\(\s*[\"\']name[\"\']", line)
        if match:
            singular = singularize(table_name)
            results.append({
                "file": file,
                "table": table_name,
                "singular": singular,
                "line": line_num,
                "content": line.strip()
            })

print(f"Found {len(results)} tables with 'name' fields:")
for r in results:
    print(f"FILE: {r['file']}:{r['line']} | TABLE: {r['table']} (singular: {r['singular']}) | LINE: {r['content']}")
