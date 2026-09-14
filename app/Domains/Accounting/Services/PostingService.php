<?php

namespace App\Domains\Accounting\Services;

use App\Domains\Accounting\Models\Account;
use App\Domains\Accounting\Models\AccountGroup;
use App\Domains\Accounting\Models\FinancialYear;

class PostingService
{
    public function __construct(
        protected JournalService $journalService
    ) {}

    /**
     * Post a Purchase Invoice record (Supplier Bill).
     * Entry:
     *   Dr. Inventory Asset / GRNI A/c   (Amount - GST)
     *   Dr. Input GST A/c                (GST Amount)
     *     To Accounts Payable / Supplier (Total Amount)
     */
    public function postPurchase(
        int $organizationId,
        int $branchId,
        float $totalAmount,
        int $inventoryAccountId,
        int $supplierAccountId,
        int $gstInputAccountId,
        float $gstAmount,
        string $voucherNo,
        string $date
    ): void {
        $netAmount = $totalAmount - $gstAmount;
        $financialYear = $this->getActiveFinancialYear($organizationId);

        $journalData = [
            'organization_id' => $organizationId,
            'financial_year_id' => $financialYear->id,
            'journal_date' => $date,
            'narration' => "Purchase Invoice posted: {$voucherNo}",
            'reference_type' => 'PurchaseInvoice',
        ];

        $entries = [
            [
                'account_id' => $inventoryAccountId,
                'is_debit' => true,
                'amount' => $netAmount,
            ],
            [
                'account_id' => $supplierAccountId,
                'is_debit' => false,
                'amount' => $totalAmount,
            ]
        ];

        if ($gstAmount > 0) {
            $entries[] = [
                'account_id' => $gstInputAccountId,
                'is_debit' => true,
                'amount' => $gstAmount,
            ];
        }

        $this->journalService->postJournal($journalData, $entries);
    }

    /**
     * Post a Sales Invoice record (Tax Invoice).
     * Entry:
     *   Dr. Accounts Receivable / Customer (Total Amount)
     *     To Sales Revenue A/c             (Amount - GST)
     *     To Output GST A/c                (GST Amount)
     */
    public function postSales(
        int $organizationId,
        int $branchId,
        float $totalAmount,
        int $customerAccountId,
        int $salesAccountId,
        int $gstOutputAccountId,
        float $gstAmount,
        string $voucherNo,
        string $date
    ): void {
        $netAmount = $totalAmount - $gstAmount;
        $financialYear = $this->getActiveFinancialYear($organizationId);

        $journalData = [
            'organization_id' => $organizationId,
            'financial_year_id' => $financialYear->id,
            'journal_date' => $date,
            'narration' => "Sales Invoice posted: {$voucherNo}",
            'reference_type' => 'Invoice',
        ];

        $entries = [
            [
                'account_id' => $customerAccountId,
                'is_debit' => true,
                'amount' => $totalAmount,
            ],
            [
                'account_id' => $salesAccountId,
                'is_debit' => false,
                'amount' => $netAmount,
            ]
        ];

        if ($gstAmount > 0) {
            $entries[] = [
                'account_id' => $gstOutputAccountId,
                'is_debit' => false,
                'amount' => $gstAmount,
            ];
        }

        $this->journalService->postJournal($journalData, $entries);
    }

    /**
     * Post Cost of Goods Sold (COGS) for a sale/dispatch.
     * Entry:
     *   Dr. Cost of Goods Sold (COGS) A/c  (Cost Amount)
     *     To Inventory Asset A/c           (Cost Amount)
     */
    public function postCOGS(
        int $organizationId,
        float $cogsAmount,
        int $cogsAccountId,
        int $inventoryAccountId,
        string $voucherNo,
        string $date,
        ?int $invoiceId = null
    ): void {
        if ($cogsAmount <= 0) {
            return;
        }

        $financialYear = $this->getActiveFinancialYear($organizationId);

        $journalData = [
            'organization_id' => $organizationId,
            'financial_year_id' => $financialYear->id,
            'journal_date' => $date,
            'narration' => "COGS cost of goods sold posted: {$voucherNo}",
            'reference_type' => 'InvoiceCOGS',
            'reference_id' => $invoiceId,
        ];

        $entries = [
            [
                'account_id' => $cogsAccountId,
                'is_debit' => true,
                'amount' => $cogsAmount,
            ],
            [
                'account_id' => $inventoryAccountId,
                'is_debit' => false,
                'amount' => $cogsAmount,
            ]
        ];

        $this->journalService->postJournal($journalData, $entries);
    }

    /**
     * Post a Supplier payment record (Outflow).
     * Entry:
     *   Dr. Accounts Payable / Supplier A/c (Amount)
     *     To Bank / Cash A/c                (Amount)
     */
    public function postPayment(
        int $organizationId,
        int $branchId,
        float $amount,
        int $supplierAccountId,
        int $paymentSourceAccountId,
        string $voucherNo,
        string $date
    ): void {
        $financialYear = $this->getActiveFinancialYear($organizationId);

        $journalData = [
            'organization_id' => $organizationId,
            'financial_year_id' => $financialYear->id,
            'journal_date' => $date,
            'narration' => "Payment voucher posted: {$voucherNo}",
            'reference_type' => 'Payment',
        ];

        $entries = [
            [
                'account_id' => $supplierAccountId,
                'is_debit' => true,
                'amount' => $amount,
            ],
            [
                'account_id' => $paymentSourceAccountId,
                'is_debit' => false,
                'amount' => $amount,
            ]
        ];

        $this->journalService->postJournal($journalData, $entries);
    }

    /**
     * Post a Customer receipt record (Inflow).
     * Entry:
     *   Dr. Bank / Cash A/c                 (Amount)
     *     To Accounts Receivable / Customer (Amount)
     */
    public function postReceipt(
        int $organizationId,
        int $branchId,
        float $amount,
        int $receiptDestinationAccountId,
        int $customerAccountId,
        string $voucherNo,
        string $date
    ): void {
        $financialYear = $this->getActiveFinancialYear($organizationId);

        $journalData = [
            'organization_id' => $organizationId,
            'financial_year_id' => $financialYear->id,
            'journal_date' => $date,
            'narration' => "Receipt voucher posted: {$voucherNo}",
            'reference_type' => 'Receipt',
        ];

        $entries = [
            [
                'account_id' => $receiptDestinationAccountId,
                'is_debit' => true,
                'amount' => $amount,
            ],
            [
                'account_id' => $customerAccountId,
                'is_debit' => false,
                'amount' => $amount,
            ]
        ];

        $this->journalService->postJournal($journalData, $entries);
    }

    /**
     * Post a Goods Receipt Note record (GRN Receipt).
     * Entry:
     *   Dr. Inventory Asset A/c
     *     To Goods Received Not Invoiced (GRNI Clearing A/c)
     */
    public function postGRNReceipt(
        int $organizationId,
        float $totalValue,
        int $inventoryAccountId,
        int $grniAccountId,
        string $grnNumber,
        string $date,
        int $grnId
    ): void {
        if ($totalValue <= 0) {
            return;
        }

        $financialYear = $this->getActiveFinancialYear($organizationId);

        $journalData = [
            'organization_id' => $organizationId,
            'financial_year_id' => $financialYear->id,
            'journal_date' => $date,
            'narration' => "GRN inventory receipt posted: {$grnNumber}",
            'reference_type' => 'GoodsReceiptNote',
            'reference_id' => $grnId,
        ];

        $entries = [
            [
                'account_id' => $inventoryAccountId,
                'is_debit' => true,
                'amount' => $totalValue,
            ],
            [
                'account_id' => $grniAccountId,
                'is_debit' => false,
                'amount' => $totalValue,
            ]
        ];

        $this->journalService->postJournal($journalData, $entries);
    }

    /**
     * Post a Purchase Return / Debit Note.
     * Entry:
     *   Dr. Accounts Payable / Supplier A/c (Total Amount)
     *     To Inventory / Purchase Return    (Amount - GST)
     *     To Input GST Reversal A/c        (GST Amount)
     */
    public function postPurchaseReturn(
        int $organizationId,
        float $totalAmount,
        int $supplierAccountId,
        int $returnAccountId,
        int $gstInputAccountId,
        float $gstAmount,
        string $voucherNo,
        string $date,
        ?int $returnId = null
    ): void {
        $netAmount = $totalAmount - $gstAmount;
        $financialYear = $this->getActiveFinancialYear($organizationId);

        $journalData = [
            'organization_id' => $organizationId,
            'financial_year_id' => $financialYear->id,
            'journal_date' => $date,
            'narration' => "Purchase Return / Debit Note posted: {$voucherNo}",
            'reference_type' => 'PurchaseReturn',
            'reference_id' => $returnId,
        ];

        $entries = [
            [
                'account_id' => $supplierAccountId,
                'is_debit' => true,
                'amount' => $totalAmount,
            ],
            [
                'account_id' => $returnAccountId,
                'is_debit' => false,
                'amount' => $netAmount,
            ]
        ];

        if ($gstAmount > 0) {
            $entries[] = [
                'account_id' => $gstInputAccountId,
                'is_debit' => false,
                'amount' => $gstAmount,
            ];
        }

        $this->journalService->postJournal($journalData, $entries);
    }

    /**
     * Post a Sales Return / Credit Note.
     * Entry:
     *   Dr. Sales Return A/c               (Amount - GST)
     *   Dr. Output GST Reversal A/c        (GST Amount)
     *     To Accounts Receivable / Customer (Total Amount)
     * AND stock restoration if applicable:
     *   Dr. Inventory Asset A/c            (COGS Amount)
     *     To Cost of Goods Sold (COGS) A/c (COGS Amount)
     */
    public function postSalesReturn(
        int $organizationId,
        float $totalAmount,
        float $cogsAmount,
        int $customerAccountId,
        int $salesReturnAccountId,
        int $gstOutputAccountId,
        float $gstAmount,
        int $inventoryAccountId,
        int $cogsAccountId,
        string $voucherNo,
        string $date,
        ?int $returnId = null
    ): void {
        $netAmount = $totalAmount - $gstAmount;
        $financialYear = $this->getActiveFinancialYear($organizationId);

        // 1. Credit Note Financial Entry
        $journalData = [
            'organization_id' => $organizationId,
            'financial_year_id' => $financialYear->id,
            'journal_date' => $date,
            'narration' => "Sales Return / Credit Note posted: {$voucherNo}",
            'reference_type' => 'SalesReturn',
            'reference_id' => $returnId,
        ];

        $entries = [
            [
                'account_id' => $salesReturnAccountId,
                'is_debit' => true,
                'amount' => $netAmount,
            ],
            [
                'account_id' => $customerAccountId,
                'is_debit' => false,
                'amount' => $totalAmount,
            ]
        ];

        if ($gstAmount > 0) {
            $entries[] = [
                'account_id' => $gstOutputAccountId,
                'is_debit' => true,
                'amount' => $gstAmount,
            ];
        }

        $this->journalService->postJournal($journalData, $entries);

        // 2. COGS Restoration Entry
        if ($cogsAmount > 0) {
            $cogsJournal = [
                'organization_id' => $organizationId,
                'financial_year_id' => $financialYear->id,
                'journal_date' => $date,
                'narration' => "Sales Return stock COGS restoration: {$voucherNo}",
                'reference_type' => 'SalesReturnCOGS',
                'reference_id' => $returnId,
            ];

            $cogsEntries = [
                [
                    'account_id' => $inventoryAccountId,
                    'is_debit' => true,
                    'amount' => $cogsAmount,
                ],
                [
                    'account_id' => $cogsAccountId,
                    'is_debit' => false,
                    'amount' => $cogsAmount,
                ]
            ];

            $this->journalService->postJournal($cogsJournal, $cogsEntries);
        }
    }

    /**
     * Post Inventory Adjustment (Damage, Loss, Shrinkage, Found Stock).
     * Damage / Loss:
     *   Dr. Inventory Adjustment Loss A/c  (Value Amount)
     *     To Inventory Asset A/c           (Value Amount)
     * Found Stock / Extra:
     *   Dr. Inventory Asset A/c            (Value Amount)
     *     To Inventory Adjustment Gain A/c (Value Amount)
     */
    public function postInventoryAdjustment(
        int $organizationId,
        float $amount,
        bool $isLoss,
        int $inventoryAccountId,
        int $adjustmentAccountId,
        string $reason,
        string $date,
        ?int $adjustmentId = null
    ): void {
        if ($amount <= 0) {
            return;
        }

        $financialYear = $this->getActiveFinancialYear($organizationId);

        $journalData = [
            'organization_id' => $organizationId,
            'financial_year_id' => $financialYear->id,
            'journal_date' => $date,
            'narration' => "Inventory Adjustment posted: {$reason}",
            'reference_type' => 'InventoryAdjustment',
            'reference_id' => $adjustmentId,
        ];

        if ($isLoss) {
            $entries = [
                [
                    'account_id' => $adjustmentAccountId,
                    'is_debit' => true,
                    'amount' => $amount,
                ],
                [
                    'account_id' => $inventoryAccountId,
                    'is_debit' => false,
                    'amount' => $amount,
                ]
            ];
        } else {
            $entries = [
                [
                    'account_id' => $inventoryAccountId,
                    'is_debit' => true,
                    'amount' => $amount,
                ],
                [
                    'account_id' => $adjustmentAccountId,
                    'is_debit' => false,
                    'amount' => $amount,
                ]
            ];
        }

        $this->journalService->postJournal($journalData, $entries);
    }

    /**
     * Post Operational Expense Voucher.
     * Entry:
     *   Dr. Expense A/c                  (Amount - GST)
     *   Dr. Input GST A/c                (GST Amount)
     *     To Cash / Bank / Payables A/c  (Total Amount)
     */
    public function postExpenseVoucher(
        int $organizationId,
        float $totalAmount,
        int $expenseAccountId,
        int $paymentAccountId,
        int $gstInputAccountId,
        float $gstAmount,
        string $voucherNo,
        string $date,
        ?int $expenseId = null
    ): void {
        $netAmount = $totalAmount - $gstAmount;
        $financialYear = $this->getActiveFinancialYear($organizationId);

        $journalData = [
            'organization_id' => $organizationId,
            'financial_year_id' => $financialYear->id,
            'journal_date' => $date,
            'narration' => "Expense Voucher posted: {$voucherNo}",
            'reference_type' => 'ExpenseVoucher',
            'reference_id' => $expenseId,
        ];

        $entries = [
            [
                'account_id' => $expenseAccountId,
                'is_debit' => true,
                'amount' => $netAmount,
            ],
            [
                'account_id' => $paymentAccountId,
                'is_debit' => false,
                'amount' => $totalAmount,
            ]
        ];

        if ($gstAmount > 0) {
            $entries[] = [
                'account_id' => $gstInputAccountId,
                'is_debit' => true,
                'amount' => $gstAmount,
            ];
        }

        $this->journalService->postJournal($journalData, $entries);
    }

    /**
     * Helper to resolve or create default GL Accounts for an organization.
     */
    public function resolveOrCreateAccount(
        int $organizationId,
        string $code,
        string $name,
        string $groupType,
        string $groupName
    ): Account {
        $account = Account::where('organization_id', $organizationId)
            ->where(function ($q) use ($code, $name) {
                $q->where('code', $code)->orWhere('name', $name);
            })->first();

        if (!$account) {
            $group = AccountGroup::where('organization_id', $organizationId)
                ->where('name', $groupName)
                ->first();

            if (!$group) {
                $baseCode = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $groupName), 0, 4));
                if (empty($baseCode)) {
                    $baseCode = 'GRP';
                }
                $codeCounter = 1;
                $groupCode = $baseCode . '-' . sprintf('%02d', $codeCounter);
                while (AccountGroup::where('organization_id', $organizationId)->where('code', $groupCode)->exists()) {
                    $codeCounter++;
                    $groupCode = $baseCode . '-' . sprintf('%02d', $codeCounter);
                }

                $group = AccountGroup::create([
                    'organization_id' => $organizationId,
                    'type' => $groupType,
                    'name' => $groupName,
                    'code' => $groupCode,
                ]);
            }

            $account = Account::create([
                'organization_id' => $organizationId,
                'account_group_id' => $group->id,
                'code' => $code,
                'name' => $name,
                'currency' => 'INR',
            ]);
        }

        return $account;
    }

    /**
     * Active financial year helper.
     */
    protected function getActiveFinancialYear(int $organizationId): FinancialYear
    {
        $fy = FinancialYear::where('organization_id', $organizationId)
            ->where('is_active', true)
            ->where('is_closed', false)
            ->first();

        if (!$fy) {
            $fy = FinancialYear::firstOrCreate([
                'organization_id' => $organizationId,
                'is_active' => true,
                'is_closed' => false
            ], [
                'name' => 'FY 2026-27',
                'start_date' => '2026-04-01',
                'end_date' => '2027-03-31'
            ]);
        }

        return $fy;
    }
}
