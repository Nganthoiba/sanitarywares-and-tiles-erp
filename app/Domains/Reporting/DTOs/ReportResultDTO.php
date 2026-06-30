<?php

namespace App\Domains\Reporting\DTOs;

class ReportResultDTO
{
    public function __construct(
        public string $reportType,
        public string $reportName,
        public array $filters,
        public array $data,
        public float $executionTimeMs,
        public string $generatedAt
    ) {}

    public function toArray(): array
    {
        return [
            'success' => true,
            'report_type' => $this->reportType,
            'report_name' => $this->reportName,
            'filters' => $this->filters,
            'data' => $this->data,
            'record_count' => count($this->data),
            'execution_time_ms' => $this->executionTimeMs,
            'generated_at' => $this->generatedAt,
        ];
    }
}
