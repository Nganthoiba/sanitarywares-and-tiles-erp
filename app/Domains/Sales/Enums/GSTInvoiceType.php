<?php

namespace App\Domains\Sales\Enums;

enum GSTInvoiceType: string
{
    case REGULAR = 'REGULAR';
    case BILL_OF_SUPPLY = 'BILL_OF_SUPPLY';
    case SEZ_WITH_PAYMENT = 'SEZ_WITH_PAYMENT';
    case SEZ_WITHOUT_PAYMENT = 'SEZ_WITHOUT_PAYMENT';
    case DEEMED_EXPORT = 'DEEMED_EXPORT';
}
