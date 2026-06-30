<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CutSlabRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'splits' => ['required', 'array', 'min:1'],
            'splits.*.length' => ['required', 'numeric', 'gt:0'],
            'splits.*.width' => ['required', 'numeric', 'gt:0'],
        ];
    }
}
