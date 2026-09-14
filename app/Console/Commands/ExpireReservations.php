<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Domains\Inventory\Services\ReservationService;

class ExpireReservations extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'inventory:expire-reservations {--hours= : Optional threshold in hours to force expire reservations without explicit expiry date}';

    /**
     * The console command description.
     */
    protected $description = 'Expire active inventory stock reservations that have passed their explicit expiry date';

    /**
     * Execute the console command.
     */
    public function handle(ReservationService $reservationService): int
    {
        $hoursOption = $this->option('hours');
        $hours = $hoursOption !== null ? (int) $hoursOption : null;
        $count = $reservationService->expireOldReservations($hours);

        $this->info("Expired reservations cleanup complete. Marked {$count} reservations as EXPIRED.");
        return Command::SUCCESS;
    }
}
