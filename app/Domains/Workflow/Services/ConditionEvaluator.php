<?php

namespace App\Domains\Workflow\Services;

use App\Domains\Workflow\Models\WorkflowCondition;
use Illuminate\Database\Eloquent\Model;

class ConditionEvaluator
{
    /**
     * Evaluate a condition against a target model/context.
     */
    public function evaluate(WorkflowCondition $condition, Model $targetModel): bool
    {
        $field = $condition->field;
        $operator = strtoupper($condition->operator);
        $expectedValue = $condition->value;

        // Support JSON paths (e.g. metadata->limits->min_amount)
        if (str_contains($field, '->')) {
            $parts = explode('->', $field);
            $jsonColumn = $parts[0];
            $jsonValue = $targetModel->getAttribute($jsonColumn);

            if (is_string($jsonValue)) {
                $jsonValue = json_decode($jsonValue, true);
            }

            $temp = $jsonValue;
            for ($i = 1; $i < count($parts); $i++) {
                $key = $parts[$i];
                if (is_array($temp) && isset($temp[$key])) {
                    $temp = $temp[$key];
                } else if (is_object($temp) && isset($temp->{$key})) {
                    $temp = $temp->{$key};
                } else {
                    $temp = null;
                    break;
                }
            }
            $actualValue = $temp;
        } else {
            // Check if model dynamic balance attribute or property exists
            $actualValue = $targetModel->getAttribute($field);

            // Fallback for custom logic check
            if ($actualValue === null && str_contains($field, '.')) {
                // E.g. relation field (e.g. supplier.name)
                $parts = explode('.', $field);
                $temp = $targetModel;
                foreach ($parts as $part) {
                    if (is_object($temp)) {
                        $temp = $temp->{$part};
                    } else {
                        $temp = null;
                        break;
                    }
                }
                $actualValue = $temp;
            }
        }

        if ($actualValue === null && $operator !== 'IS NULL' && $operator !== 'IS NOT NULL') {
            return false;
        }

        switch ($operator) {
            case '=':
            case '==':
                return (string)$actualValue === (string)$expectedValue;
            case '!=':
                return (string)$actualValue !== (string)$expectedValue;
            case '>':
                return (float)$actualValue > (float)$expectedValue;
            case '<':
                return (float)$actualValue < (float)$expectedValue;
            case '>=':
                return (float)$actualValue >= (float)$expectedValue;
            case '<=':
                return (float)$actualValue <= (float)$expectedValue;
            case 'IN':
                $items = array_map('trim', explode(',', $expectedValue));
                return in_array((string)$actualValue, $items);
            case 'NOT IN':
                $items = array_map('trim', explode(',', $expectedValue));
                return !in_array((string)$actualValue, $items);
            case 'IS NULL':
                return is_null($actualValue);
            case 'IS NOT NULL':
                return !is_null($actualValue);
            default:
                return false;
        }
    }
}
