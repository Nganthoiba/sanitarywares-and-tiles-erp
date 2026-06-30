<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Domains\Inventory\Models\InventoryReservation;
use App\Domains\Inventory\Services\ReservationService;
use Carbon\Carbon;

class ExpireReservations extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'inventory:expire-reservations {--hours=24 : Expiry threshold in hours}';

    /**
     * The console command description.
     */
    protected $description = 'Expire pending inventory reservations that exceed the time threshold';

    /**
     * Execute the console command.
     */
    public function handle(ReservationService $reservationService): int
    {
        $hours = (int) $this->option('hours');
        $checkTime = Carbon::now()->subHours($hours);

        $expiredReservations = InventoryReservation::where('status', 'PENDING')
            ->where('created_at', '<', $checkTime)
            ->get();

        $count = 0;
        foreach ($expiredReservations as $res) {
            try {
                $reservationService->release($res->id);
                $this->info("Reservation ID {$res->id} expired and released successfully.");
                $count++;
            } catch (\Exception $e) {
                $this->error("Failed to release reservation ID {$res->id}: {$e->getMessage()}");
            }
        }

        $this->info("Expired reservations cleanup complete. Released {$count} reservations.");
        return Command::SUCCESS;
    }
}
