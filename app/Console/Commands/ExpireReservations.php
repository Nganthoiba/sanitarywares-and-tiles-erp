<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Domains\Inventory\Services\ReservationService;

class ExpireReservations extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'inventory:expire-reservations {--hours=24 : Expiry threshold in hours for reservations without explicit expiry date}';

    /**
     * The console command description.
     */
    protected $description = 'Expire active inventory reservations that exceed the time threshold or explicit expiry date';

    /**
     * Execute the console command.
     */
    public function handle(ReservationService $reservationService): int
    {
        $hours = (int) $this->option('hours');
        $count = $reservationService->expireOldReservations($hours);

        $this->info("Expired reservations cleanup complete. Marked {$count} reservations as EXPIRED.");
        return Command::SUCCESS;
    }
}
