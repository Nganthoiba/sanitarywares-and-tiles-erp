<?php
namespace App\Domains\Purchase\Enums;

enum PurchaseRequisitionStatus: string {
    case DRAFT = 'DRAFT';
    case PENDING = 'PENDING';
    case APPROVED = 'APPROVED';
    case REJECTED = 'REJECTED';
    case ORDERED = 'ORDERED';
}
