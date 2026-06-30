<?php

namespace App\Domains\Accounting\Services;

use App\Domains\Accounting\Models\Account;
use App\Domains\Accounting\Models\AccountGroup;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Accounting\Models\OpeningBalance;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Generate Trial Balance.
     */
    public function getTrialBalance(int $organizationId): array
    {
        $accounts = Account::where('organization_id', $organizationId)->get();

        $rows = [];
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($accounts as $account) {
            $debitSum = JournalEntry::whereHas('journal', function ($q) use ($organizationId) {
                $q->where('organization_id', $organizationId);
            })
                ->where('account_id', $account->id)
                ->where('entry_type', 'DEBIT')
                ->sum('amount') ?? 0;

            $creditSum = JournalEntry::whereHas('journal', function ($q) use ($organizationId) {
                $q->where('organization_id', $organizationId);
            })
                ->where('account_id', $account->id)
                ->where('entry_type', 'CREDIT')
                ->sum('amount') ?? 0;

            $opBalance = OpeningBalance::where('account_id', $account->id)->first();
            $opDebit = $opBalance ? (float)$opBalance->debit : 0.0;
            $opCredit = $opBalance ? (float)$opBalance->credit : 0.0;

            $netDebit = 0;
            $netCredit = 0;

            $balance = ($debitSum + $opDebit) - ($creditSum + $opCredit);

            if ($balance > 0) {
                $netDebit = $balance;
            } elseif ($balance < 0) {
                $netCredit = abs($balance);
            }

            if ($netDebit > 0 || $netCredit > 0 || ($opDebit > 0 || $opCredit > 0)) {
                $rows[] = [
                    'account_id' => $account->id,
                    'account_code' => $account->code,
                    'account_name' => $account->name,
                    'debit' => (float)$netDebit,
                    'credit' => (float)$netCredit
                ];
                $totalDebit += $netDebit;
                $totalCredit += $netCredit;
            }
        }

        $difference = abs($totalDebit - $totalCredit);

        return [
            'success' => true,
            'rows' => $rows,
            'total_debit' => (float)$totalDebit,
            'total_credit' => (float)$totalCredit,
            'difference' => (float)$difference,
            'is_balanced' => $difference < 0.0001
        ];
    }

    /**
     * Generate Profit and Loss.
     */
    public function getProfitLoss(int $organizationId): array
    {
        $incomeAccounts = Account::where('organization_id', $organizationId)
            ->whereHas('group', function ($q) {
                $q->where('type', 'REVENUE')
                    ->orWhere('accounts.name', 'like', '%income%')
                    ->orWhere('accounts.name', 'like', '%revenue%')
                    ->orWhere('accounts.name', 'like', '%sales%')
                    ->orWhere('accounts.name', 'like', '%INCOME%')
                    ->orWhere('accounts.name', 'like', '%REVENUE%')
                    ->orWhere('accounts.name', 'like', '%SALES%');
            })
            ->get();

        $incomeRows = [];
        $totalIncome = 0;

        foreach ($incomeAccounts as $account) {
            $debits = JournalEntry::where('account_id', $account->id)->where('entry_type', 'DEBIT')->sum('amount') ?? 0;
            $credits = JournalEntry::where('account_id', $account->id)->where('entry_type', 'CREDIT')->sum('amount') ?? 0;

            $netBalance = $credits - $debits;
            if ($netBalance != 0) {
                $incomeRows[] = [
                    'account_name' => $account->name,
                    'balance' => (float)$netBalance
                ];
                $totalIncome += $netBalance;
            }
        }

        $expenseAccounts = Account::where('organization_id', $organizationId)
            ->whereHas('group', function ($q) {
                $q->where('type', 'EXPENSE')
                    ->orWhere('accounts.name', 'like', '%expense%')
                    ->orWhere('accounts.name', 'like', '%purchase%')
                    ->orWhere('accounts.name', 'like', '%EXPENSE%')
                    ->orWhere('accounts.name', 'like', '%PURCHASE%');
            })
            ->get();

        $expenseRows = [];
        $totalExpense = 0;

        foreach ($expenseAccounts as $account) {
            $debits = JournalEntry::where('account_id', $account->id)->where('entry_type', 'DEBIT')->sum('amount') ?? 0;
            $credits = JournalEntry::where('account_id', $account->id)->where('entry_type', 'CREDIT')->sum('amount') ?? 0;

            $netBalance = $debits - $credits;
            if ($netBalance != 0) {
                $expenseRows[] = [
                    'account_name' => $account->name,
                    'balance' => (float)$netBalance
                ];
                $totalExpense += $netBalance;
            }
        }

        $netProfit = $totalIncome - $totalExpense;

        return [
            'success' => true,
            'income' => $incomeRows,
            'total_income' => (float)$totalIncome,
            'expenses' => $expenseRows,
            'total_expenses' => (float)$totalExpense,
            'net_profit' => (float)$netProfit
        ];
    }

    /**
     * Generate Balance Sheet.
     */
    public function getBalanceSheet(int $organizationId): array
    {
        $pl = $this->getProfitLoss($organizationId);
        $netProfit = $pl['net_profit'];

        $assetAccounts = Account::where('organization_id', $organizationId)
            ->whereHas('group', function ($q) {
                $q->where('type', 'ASSET')
                    ->orWhere('accounts.name', 'like', '%asset%')
                    ->orWhere('accounts.name', 'like', '%cash%')
                    ->orWhere('accounts.name', 'like', '%bank%')
                    ->orWhere('accounts.name', 'like', '%inventory%')
                    ->orWhere('accounts.name', 'like', '%ASSET%')
                    ->orWhere('accounts.name', 'like', '%CASH%')
                    ->orWhere('accounts.name', 'like', '%BANK%')
                    ->orWhere('accounts.name', 'like', '%INVENTORY%');
            })
            ->get();

        $assets = [];
        $totalAssets = 0;

        foreach ($assetAccounts as $account) {
            $debits = JournalEntry::where('account_id', $account->id)->where('entry_type', 'DEBIT')->sum('amount') ?? 0;
            $credits = JournalEntry::where('account_id', $account->id)->where('entry_type', 'CREDIT')->sum('amount') ?? 0;

            $opBalance = OpeningBalance::where('account_id', $account->id)->first();
            $opDebit = $opBalance ? (float)$opBalance->debit : 0.0;
            $opCredit = $opBalance ? (float)$opBalance->credit : 0.0;

            $balance = ($debits + $opDebit) - ($credits + $opCredit);
            if ($balance != 0) {
                $assets[] = [
                    'account_name' => $account->name,
                    'balance' => (float)$balance
                ];
                $totalAssets += $balance;
            }
        }

        $liabilityAccounts = Account::where('organization_id', $organizationId)
            ->whereHas('group', function ($q) {
                $q->where('type', 'LIABILITY')
                    ->orWhere('accounts.name', 'like', '%liability%')
                    ->orWhere('accounts.name', 'like', '%payable%')
                    ->orWhere('accounts.name', 'like', '%tax%')
                    ->orWhere('accounts.name', 'like', '%LIABILITY%')
                    ->orWhere('accounts.name', 'like', '%PAYABLE%')
                    ->orWhere('accounts.name', 'like', '%TAX%');
            })
            ->get();

        $liabilities = [];
        $totalLiabilities = 0;

        foreach ($liabilityAccounts as $account) {
            $debits = JournalEntry::where('account_id', $account->id)->where('entry_type', 'DEBIT')->sum('amount') ?? 0;
            $credits = JournalEntry::where('account_id', $account->id)->where('entry_type', 'CREDIT')->sum('amount') ?? 0;

            $opBalance = OpeningBalance::where('account_id', $account->id)->first();
            $opDebit = $opBalance ? (float)$opBalance->debit : 0.0;
            $opCredit = $opBalance ? (float)$opBalance->credit : 0.0;

            $balance = ($credits + $opCredit) - ($debits + $opDebit);
            if ($balance != 0) {
                $liabilities[] = [
                    'account_name' => $account->name,
                    'balance' => (float)$balance
                ];
                $totalLiabilities += $balance;
            }
        }

        $equityAccounts = Account::where('organization_id', $organizationId)
            ->whereHas('group', function ($q) {
                $q->where('type', 'EQUITY')
                    ->orWhere('accounts.name', 'like', '%equity%')
                    ->orWhere('accounts.name', 'like', '%capital%')
                    ->orWhere('accounts.name', 'like', '%EQUITY%')
                    ->orWhere('accounts.name', 'like', '%CAPITAL%');
            })
            ->get();

        $equity = [];
        $totalEquity = 0;

        foreach ($equityAccounts as $account) {
            $debits = JournalEntry::where('account_id', $account->id)->where('entry_type', 'DEBIT')->sum('amount') ?? 0;
            $credits = JournalEntry::where('account_id', $account->id)->where('entry_type', 'CREDIT')->sum('amount') ?? 0;

            $opBalance = OpeningBalance::where('account_id', $account->id)->first();
            $opDebit = $opBalance ? (float)$opBalance->debit : 0.0;
            $opCredit = $opBalance ? (float)$opBalance->credit : 0.0;

            $balance = ($credits + $opCredit) - ($debits + $opDebit);
            if ($balance != 0) {
                $equity[] = [
                    'account_name' => $account->name,
                    'balance' => (float)$balance
                ];
                $totalEquity += $balance;
            }
        }

        $equity[] = [
            'account_name' => 'Retained Earnings (P&L Net Profit)',
            'balance' => (float)$netProfit
        ];
        $totalEquity += $netProfit;

        return [
            'success' => true,
            'assets' => $assets,
            'total_assets' => (float)$totalAssets,
            'liabilities' => $liabilities,
            'total_liabilities' => (float)$totalLiabilities,
            'equity' => $equity,
            'total_equity' => (float)$totalEquity,
            'total_liabilities_and_equity' => (float)($totalLiabilities + $totalEquity)
        ];
    }
}
