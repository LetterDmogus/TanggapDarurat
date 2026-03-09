<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'emergency_type_id',
        'user_id',
        'status',
        'is_other_emergency',
        'description',
        'other_emergency_title',
        'triaged_by',
        'triaged_at',
        'longitude',
        'latitude',
        'metadata',
        'metadata_schema_version',
        'date',
        'client_reported_at',
        'client_timezone',
        'client_utc_offset_minutes',
        'geo_accuracy_m',
        'geo_source',
        'server_received_at',
    ];

    protected function casts(): array
    {
        return [
            'is_other_emergency' => 'boolean',
            'metadata' => 'array',
            'metadata_schema_version' => 'integer',
            'date' => 'datetime',
            'triaged_at' => 'datetime',
            'client_reported_at' => 'datetime',
            'client_utc_offset_minutes' => 'integer',
            'geo_accuracy_m' => 'decimal:2',
            'server_received_at' => 'datetime',
        ];
    }

    public function emergencyType(): BelongsTo
    {
        return $this->belongsTo(EmergencyType::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ReportPhoto::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function steps(): HasMany
    {
        return $this->hasMany(Step::class);
    }
}
