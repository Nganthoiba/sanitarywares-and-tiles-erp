<?php

namespace App\Domains\Sales\Enums;

enum GSTRegistrationType: string
{
    case REGISTERED_REGULAR = 'REGISTERED_REGULAR';
    case REGISTERED_COMPOSITION = 'REGISTERED_COMPOSITION';
    case UNREGISTERED = 'UNREGISTERED';
    case SEZ = 'SEZ';
    case OVERSEAS = 'OVERSEAS';
}
