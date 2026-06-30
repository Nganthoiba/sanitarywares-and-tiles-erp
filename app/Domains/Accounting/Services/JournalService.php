<?php

namespace App\Domains\Accounting\Services;

use App\Domains\Accounting\Models\Journal;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Accounting\Models\Account;
use Illuminate\Support\Facades\DB;
use Exception;

class JournalService
{
    /**
     * Validate that direct debit and credit amounts match exactly.
     */
    public function validateDoubleEntry(array $entries): bool
    {
        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($entries as $entry) {
            $isDebit = filter_var($entry['is_debit'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $amount = floatval($entry['amount'] ?? 0.0);

            if ($isDebit) {
                $totalDebit += $amount;
            } else {
                $totalCredit += $amount;
            }
        }

        // Using small threshold for float comparison safety
        return abs($totalDebit - $totalCredit) < 0.0001;
    }

    /**
     * Create and post transactional double entry entries.
     */
    public function postJournal(array $journalData, array $entries): Journal
    {
        if (!$this->validateDoubleEntry($entries)) {
            throw new Exception("Double entry validation failed: Total Debits must equal Total Credits.");
        }

        return DB::transaction(function () use ($journalData, $entries) {
            // 1. Create the general journal root header
            $journal = Journal::create([
                'organization_id' => $journalData['organization_id'],
                'journal_date' => $journalData['journal_date'] ?? $journalData['entry_date'] ?? now(),
                'reference_type' => $journalData['reference_type'] ?? null,
                'reference_id' => $journalData['reference_id'] ?? null,
                'narration' => $journalData['narration'] ?? $journalData['description'] ?? null,
                'created_by' => $journalData['created_by'] ?? null,
            ]);

            // 2. Post detailed line entries and adjust ledger account balances
            foreach ($entries as $entryData) {
                $account = Account::lockForUpdate()->findOrFail($entryData['account_id']);
                $isDebit = filter_var($entryData['is_debit'] ?? false, FILTER_VALIDATE_BOOLEAN);
                $amount = floatval($entryData['amount']);

                // Create JournalEntry record
                $journal->entries()->create([
                    'organization_id' => $journalData['organization_id'],
                    'account_id' => $account->id,
                    'entry_type' => $isDebit ? 'DEBIT' : 'CREDIT',
                    'amount' => $amount,
                ]);
            }

            return $journal;
        });
    }
}
