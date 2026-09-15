<?php

namespace App\Domains\Sales\Enums;

enum GSTSupplyType: string
{
    case INTRA_STATE = 'INTRA_STATE';
    case INTER_STATE = 'INTER_STATE';
}
