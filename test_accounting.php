<?php

use Illuminate\Contracts\Console\Kernel;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Branch;
use App\Domains\Accounting\Models\FinancialYear;
use App\Domains\Accounting\Models\AccountGroup;
use App\Domains\Accounting\Models\Account;
use App\Domains\Accounting\Services\JournalService;
use App\Domains\Accounting\Services\PostingService;
use App\Domains\Accounting\Services\ReportService;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "--- Bootstrapped Laravel 12 workspace context for Accounting System ---\n";

\Illuminate\Support\Facades\DB::transaction(function () {
    // 1. Setup multi-tenant master data
    $org = Organization::firstOrCreate(['id' => 1]);
    $branch = Branch::firstOrCreate([
        'organization_id' => $org->id,
        'code' => 'TE-BR-2',
        'name' => 'Branch Two'
    ]);

    echo "1. Configured Org and Branch.\n";

    // 2. Setup financial year
    $fy = FinancialYear::create([
        'organization_id' => $org->id,
        'name' => 'Trial FY 2026-27',
        'start_date' => '2026-04-01',
        'end_date' => '2027-03-31',
        'is_active' => true,
        'is_closed' => false
    ]);

    echo "2. Financial period added.\n";

    // 3. Setup Account Groups
    $assetsGrp = AccountGroup::create([
        'organization_id' => $org->id,
        'name' => 'ASSETS',
        'code' => 'AST',
        'type' => 'ASSET'
    ]);

    $liabilitiesGrp = AccountGroup::create([
        'organization_id' => $org->id,
        'name' => 'LIABILITIES',
        'code' => 'LIA',
        'type' => 'LIABILITY'
    ]);

    $incomeGrp = AccountGroup::create([
        'organization_id' => $org->id,
        'name' => 'INCOME/SALES',
        'code' => 'INC',
        'type' => 'REVENUE'
    ]);

    $expenseGrp = AccountGroup::create([
        'organization_id' => $org->id,
        'name' => 'EXPENSE/PURCHASES',
        'code' => 'EXP',
        'type' => 'EXPENSE'
    ]);

    echo "3. Account groups instantiated.\n";

    // 4. Setup Accounts
    $inventoryAcc = Account::create([
        'organization_id' => $org->id,
        'account_group_id' => $assetsGrp->id,
        'code' => 'INV-01',
        'name' => 'Inventory Asset A/c',
        'opening_balance' => 0.00,
        'opening_type' => 'DEBIT',
        'is_system' => true
    ]);

    $gstInputAcc = Account::create([
        'organization_id' => $org->id,
        'account_group_id' => $liabilitiesGrp->id,
        'code' => 'TAX-IN-GST',
        'name' => 'GST Input Credit A/c',
        'opening_balance' => 0.00,
        'opening_type' => 'DEBIT',
        'is_system' => true
    ]);

    $gstOutputAcc = Account::create([
        'organization_id' => $org->id,
        'account_group_id' => $liabilitiesGrp->id,
        'code' => 'TAX-OUT-GST',
        'name' => 'GST Output Payables A/c',
        'opening_balance' => 0.00,
        'opening_type' => 'CREDIT',
        'is_system' => true
    ]);

    $supplierAcc = Account::create([
        'organization_id' => $org->id,
        'account_group_id' => $liabilitiesGrp->id,
        'code' => 'SUPP-VEN-10',
        'name' => 'Material Supplier Payable',
        'opening_balance' => 0.00,
        'opening_type' => 'CREDIT',
        'is_system' => false
    ]);

    $customerAcc = Account::create([
        'organization_id' => $org->id,
        'account_group_id' => $assetsGrp->id,
        'code' => 'CUST-ACC-20',
        'name' => 'Retail Customer Receivable',
        'opening_balance' => 0.00,
        'opening_type' => 'DEBIT',
        'is_system' => false
    ]);

    $salesAcc = Account::create([
        'organization_id' => $org->id,
        'account_group_id' => $incomeGrp->id,
        'code' => 'REV-SALES',
        'name' => 'Sales Revenue Account',
        'opening_balance' => 0.00,
        'opening_type' => 'CREDIT',
        'is_system' => true
    ]);

    echo "4. Chart of accounts seeded.\n";

    // 5. Instantiating Double Entry post service
    $journalService = new JournalService();
    $postingService = new PostingService($journalService);
    $reportService = new ReportService();

    echo "5. Triggering postPurchase double-entry...\n";
    $postingService->postPurchase(
        $org->id,
        $branch->id,
        15000.0000,
        $inventoryAcc->id,
        $supplierAcc->id,
        $gstInputAcc->id,
        2700.0000,
        'PUR-VOUCH-100',
        now()->toDateString()
    );

    echo "6. Triggering postSales double-entry...\n";
    $postingService->postSales(
        $org->id,
        $branch->id,
        25000.0000,
        $customerAcc->id,
        $salesAcc->id,
        $gstOutputAcc->id,
        4500.0000,
        'SAL-VOUCH-200',
        now()->toDateString()
    );

    // 7. Verify Statements Reports
    $tb = $reportService->getTrialBalance($org->id);
    $pl = $reportService->getProfitLoss($org->id);
    $bs = $reportService->getBalanceSheet($org->id);

    echo "\n=== FINANCIAL VERIFICATION REPORTS ===\n";
    echo "Trial Balance Total Debit:  ₹" . number_format($tb['total_debit'], 2) . "\n";
    echo "Trial Balance Total Credit: ₹" . number_format($tb['total_credit'], 2) . "\n";
    echo "Trial Balance Balanced:     " . ($tb['is_balanced'] ? "YES (Algebraic checks passed)" : "NO") . "\n";

    echo "\nProfit & Loss Incomes:      ₹" . number_format($pl['total_income'], 2) . "\n";
    echo "Profit & Loss Net Profit:   ₹" . number_format($pl['net_profit'], 2) . "\n";

    echo "\nBalance Sheet Assets:       ₹" . number_format($bs['total_assets'], 2) . "\n";
    echo "Balance Sheet Liabilities:  ₹" . number_format($bs['total_liabilities'], 2) . "\n";
    echo "Balance Sheet Equity:       ₹" . number_format($bs['total_equity'], 2) . "\n";
    echo "Liabilities + Equities Balance: ₹" . number_format($bs['total_liabilities_and_equity'], 2) . "\n";

    $isBalancedSheet = abs($bs['total_assets'] - $bs['total_liabilities_and_equity']) < 0.0001;
    echo "Balance Sheet Balanced:     " . ($isBalancedSheet ? "YES (\$Assets = \$Liabilities + \$Equity check passed)" : "NO") . "\n";

    if ($tb['is_balanced'] && $isBalancedSheet && floatval($pl['net_profit']) === 20500.0) {
        echo "\n=== SUCCESS: Enterprise Double-Entry Accounting Engine validated perfectly! ===\n";
    } else {
        echo "\n=== FAILURE: Calculations are unbalanced or incorrect. ===\n";
    }

    throw new \Exception("Rollback transaction to maintain pristine state.");
});
