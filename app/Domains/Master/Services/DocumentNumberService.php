<?php

namespace App\Domains\Master\Services;

use App\Domains\Master\Models\DocumentSequence;
use App\Domains\Accounting\Models\FinancialYear;
use Illuminate\Support\Facades\DB;
use Exception;

class DocumentNumberService
{
    /**
     * Generate the next concurrency-safe, Financial Year-integrated document number.
     *
     * Format: {PREFIX}/{FY_CODE}/{NUMBER}
     * Examples:
     *   - INV/26-27/000001
     *   - PO/26-27/000001
     *   - GRN/26-27/000001
     *   - SO/26-27/000001
     *   - RES/26-27/000001
     *   - DSP/26-27/000001
     *   - PAY/26-27/000001
     *   - RCP/26-27/000001
     *   - QTN/26-27/000001
     *   - RET/26-27/000001
     */
    public function generateNextNumber(int $organizationId, string $documentType, ?string $date = null, ?int $padding = 6): string
    {
        $documentType = strtoupper(trim($documentType));
        $date = $date ? date('Y-m-d', strtotime($date)) : date('Y-m-d');

        return DB::transaction(function () use ($organizationId, $documentType, $date, $padding) {
            $fy = $this->resolveFinancialYear($organizationId, $date);
            $fyCode = $this->getFinancialYearCode($fy);

            // Lock sequence record for update to prevent concurrent duplicate generation
            $sequence = DocumentSequence::where('organization_id', $organizationId)
                ->where('document_type', $documentType)
                ->where('fy_code', $fyCode)
                ->lockForUpdate()
                ->first();

            if (!$sequence) {
                // First document of this type for this FY & Org: create sequence atomically
                $sequence = DocumentSequence::create([
                    'organization_id' => $organizationId,
                    'document_type' => $documentType,
                    'financial_year_id' => $fy->id,
                    'fy_code' => $fyCode,
                    'current_number' => 0,
                    'prefix' => $documentType,
                    'padding' => $padding ?? 6,
                ]);

                // Lock the newly created sequence record
                $sequence = DocumentSequence::where('id', $sequence->id)
                    ->lockForUpdate()
                    ->first();
            }

            $sequence->current_number += 1;
            $sequence->save();

            $numStr = str_pad((string) $sequence->current_number, $sequence->padding, '0', STR_PAD_LEFT);

            return "{$sequence->prefix}/{$sequence->fy_code}/{$numStr}";
        });
    }

    /**
     * Resolve active Financial Year for given date and organization.
     */
    public function resolveFinancialYear(int $organizationId, string $date): FinancialYear
    {
        $fy = FinancialYear::where('organization_id', $organizationId)
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->first();

        if ($fy) {
            return $fy;
        }

        // Fallback: active FY or auto-create standard FY (April 1 to March 31)
        $fy = FinancialYear::where('organization_id', $organizationId)
            ->where('is_active', true)
            ->first();

        if ($fy) {
            return $fy;
        }

        $timestamp = strtotime($date);
        $year = (int) date('Y', $timestamp);
        $month = (int) date('m', $timestamp);

        $startYear = ($month >= 4) ? $year : $year - 1;
        $endYear = $startYear + 1;

        $startDate = "{$startYear}-04-01";
        $endDate = "{$endYear}-03-31";
        $fyName = sprintf('FY %d-%02d', $startYear, $endYear % 100);

        return FinancialYear::firstOrCreate([
            'organization_id' => $organizationId,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ], [
            'name' => $fyName,
            'is_active' => true,
            'is_closed' => false,
        ]);
    }

    /**
     * Generate financial year short code, e.g. "26-27"
     */
    public function getFinancialYearCode(FinancialYear $fy): string
    {
        $startYear = (int) date('Y', strtotime($fy->start_date));
        $endYear = (int) date('Y', strtotime($fy->end_date));

        return sprintf('%02d-%02d', $startYear % 100, $endYear % 100);
    }
}
