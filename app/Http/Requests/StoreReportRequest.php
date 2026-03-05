<?php

namespace App\Http\Requests;

use App\Models\EmergencyType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreReportRequest extends FormRequest
{
    private array $parsedMetadata = [];

    public function authorize(): bool
    {
        return $this->user()?->isPelapor() ?? false;
    }

    public function rules(): array
    {
        return [
            'emergency_type_id' => [
                'required',
                'integer',
                Rule::exists('emergency_types', 'id')->whereNull('deleted_at'),
            ],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
            'metadata_text' => ['nullable', 'string'],
            'photos' => ['required', 'array', 'min:1', 'max:8'],
            'photos.*' => ['required', 'image', 'max:5120'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $emergencyType = EmergencyType::query()->find($this->integer('emergency_type_id'));

            if (!$emergencyType) {
                return;
            }

            if ($emergencyType->is_need_location && (!$this->filled('latitude') || !$this->filled('longitude'))) {
                $validator->errors()->add('latitude', 'Location is required for this emergency type.');
                $validator->errors()->add('longitude', 'Location is required for this emergency type.');
            }

            $this->validateAndParseMetadata($validator, $emergencyType);
        });
    }

    public function parsedMetadata(): array
    {
        return $this->parsedMetadata;
    }

    private function validateAndParseMetadata(Validator $validator, EmergencyType $emergencyType): void
    {
        $rawMetadata = $this->input('metadata_text');
        if ($rawMetadata === null || trim($rawMetadata) === '') {
            $decoded = [];
        } else {
            $decoded = json_decode($rawMetadata, true);
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
                $validator->errors()->add('metadata_text', 'Invalid metadata JSON format.');

                return;
            }
        }

        $fields = data_get($emergencyType->form_schema, 'fields', []);
        if (!is_array($fields)) {
            $fields = [];
        }

        $schemaMap = [];
        foreach ($fields as $field) {
            if (!is_array($field)) {
                continue;
            }

            $name = trim((string) ($field['name'] ?? $field['value_name'] ?? $field['key'] ?? ''));
            if ($name === '') {
                continue;
            }

            $schemaMap[$name] = $field;
        }

        foreach (array_keys($decoded) as $key) {
            if (!array_key_exists($key, $schemaMap)) {
                $validator->errors()->add("metadata_text.$key", "Field [$key] is not allowed by schema.");
            }
        }

        foreach ($schemaMap as $name => $field) {
            if (!array_key_exists($name, $decoded)) {
                $validator->errors()->add("metadata_text.$name", "Field [$name] is required.");
                continue;
            }

            $value = $decoded[$name];
            $type = strtolower((string) ($field['type'] ?? 'text'));

            if (!$this->isValueValidByType($value, $type, $field)) {
                $validator->errors()->add("metadata_text.$name", "Field [$name] must be a valid $type value.");
            }
        }

        $this->parsedMetadata = $decoded;
    }

    private function isValueValidByType(mixed $value, string $type, array $field): bool
    {
        return match ($type) {
            'text' => is_string($value) && trim($value) !== '',
            'number' => is_numeric($value),
            'boolean' => is_bool($value) || in_array($value, [0, 1, '0', '1', 'true', 'false'], true),
            'date' => is_string($value) && strtotime($value) !== false,
            'select' => $this->isValidSelectValue($value, $field),
            default => false,
        };
    }

    private function isValidSelectValue(mixed $value, array $field): bool
    {
        if (!is_string($value)) {
            return false;
        }

        $options = $field['options'] ?? [];
        if (!is_array($options)) {
            return false;
        }

        return in_array($value, $options, true);
    }
}
