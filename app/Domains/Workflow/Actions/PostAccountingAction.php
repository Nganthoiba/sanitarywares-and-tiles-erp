<?php

namespace App\Domains\Workflow\Actions;

use App\Domains\Accounting\Services\JournalService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;

class PostAccountingAction implements WorkflowActionInterface
{
    public function execute(Model $targetModel, ?array $parameters = null): void
    {
        // Dynamic bookkeeping trigger
        $journalService = App::make(JournalService::class);

        // E.g. assume target model is a SupplierInvoice or PO that needs recording
        $journalService->postJournal([
            'organization_id' => $targetModel->organization_id,
            'journal_date' => now()->toDateString(),
            'narration' => 'Post-accounting trigger via Workflow ID ' . $targetModel->id,
            'entries' => $parameters['entries'] ?? []
        ]);
    }
}
