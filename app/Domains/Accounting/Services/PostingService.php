<?php

namespace App\Domains\Accounting\Services;

use App\Domains\Accounting\Models\Account;
use App\Domains\Accounting\Models\FinancialYear;
use Illuminate\Support\Facades\DB;

class PostingService
{
    public function __construct(
        protected JournalService $journalService
    ) {}

    /**
     * Post a Purchase Invoice record.
     * Entry:
     *   Dr. Inventory A/c          (Amount - GST)
     *   Dr. Input GST A/c          (GST Amount)
     *     To Supplier A/c         (Total Amount)
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
     * Post a Sales Invoice record.
     * Entry:
     *   Dr. Customer A/c          (Total Amount)
     *     To Sales A/c            (Amount - GST)
     *     To Output GST A/c       (GST Amount)
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
     * Post a Supplier payment record.
     * Entry:
     *   Dr. Supplier A/c          (Amount)
     *     To Bank/Cash A/c        (Amount)
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
     * Post a Customer receipt record.
     * Entry:
     *   Dr. Bank/Cash A/c          (Amount)
     *     To Customer A/c          (Amount)
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
     * Post a Goods Receipt Note record.
     * Entry:
     *   Dr. Inventory A/c
     *     To Goods Received Not Invoiced (GRNI) / Supplier
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
