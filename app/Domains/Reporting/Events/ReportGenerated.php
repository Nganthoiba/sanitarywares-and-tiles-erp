<?php

namespace App\Domains\Reporting\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReportGenerated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $organizationId,
        public string $reportType,
        public string $reportName,
        public array $filters,
        public float $executionTimeMs
    ) {}
}
