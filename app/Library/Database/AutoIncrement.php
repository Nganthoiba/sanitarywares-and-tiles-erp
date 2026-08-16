<?php

namespace App\Library\Database;

use Illuminate\Support\Facades\DB;

/**
 * Class AutoIncrement
 *
 * A helper utility for resetting auto-increment (MySQL) or sequence (PostgreSQL) values
 * after seeding or manual inserts. This ensures the next inserted record uses the correct
 * incremented primary key value.
 *
 * ## Supported Drivers:
 * - **MySQL / MariaDB**: Resets the AUTO_INCREMENT value of a table.
 * - **PostgreSQL**: Resets the sequence value associated with a SERIAL / BIGSERIAL column.
 *
 * ## Example Usage:
 * ```php
 * use App\Library\Database\AutoIncrement;
 *
 * DB::table('roles')->upsert($roles, ['role_id'], ['role_name', 'role_group']);
 * AutoIncrement::resetIndex('roles', 'role_id');
 *
 * This will ensure the `roles` table’s next `role_id` is correctly set.
 *
 * ## Notes:
 * - If the table is empty, the index resets to **1**.
 * - This class does not validate whether the target column is actually auto-increment/serial.
 *   It assumes the given `$field_name` is a primary key or incrementing column.
 */
class AutoIncrement
{

    /**
     * Reset the auto-increment (MySQL/MariaDB) or sequence (PostgreSQL)
     * of a given table to ensure the next insert uses the correct ID.
     *
     * @param string $table_name The name of the table whose index should be reset.
     * @param string $field_name The auto-increment/serial column name (usually the primary key).
     * 
     * @return void
     */
    public static function resetIndex(string $table_name, string $field_name): void
    {
        $driver = DB::getDriverName();
        $maxId = DB::table($table_name)->max($field_name) ?? 0;

        if ($driver === 'pgsql') {
            // Reset PostgreSQL sequence linked to the column
            DB::statement("SELECT setval(pg_get_serial_sequence('{$table_name}', '{$field_name}'), $maxId, true)");
        } elseif ($driver === 'mysql') {
            // Reset AUTO_INCREMENT value in MySQL/MariaDB
            DB::statement("ALTER TABLE {$table_name} AUTO_INCREMENT = " . ($maxId + 1));
        }
    }
}
