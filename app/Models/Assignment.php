<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_QUEUED = 'queued';
    public const STATUS_ON_PROGRESS = 'on_progress';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'report_id',
        'agency_id',
        'agency_branch_id',
        'is_primary',
        'status',
        'description',
        'distance_km',
        'admin_verification',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'distance_km' => 'decimal:3',
            'admin_verification' => 'boolean',
            'date' => 'datetime',
        ];
    }

    public static function allowedTransitions(): array
    {
        return [
            self::STATUS_PENDING => [self::STATUS_ON_PROGRESS, self::STATUS_REJECTED],
            self::STATUS_QUEUED => [self::STATUS_PENDING, self::STATUS_REJECTED],
            self::STATUS_ON_PROGRESS => [self::STATUS_RESOLVED, self::STATUS_REJECTED],
            self::STATUS_RESOLVED => [],
            self::STATUS_REJECTED => [],
        ];
    }

    public function canTransitionTo(string $nextStatus): bool
    {
        return in_array($nextStatus, self::allowedTransitions()[$this->status] ?? [], true);
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_QUEUED,
            self::STATUS_ON_PROGRESS,
            self::STATUS_RESOLVED,
            self::STATUS_REJECTED,
        ];
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(AgencyBranch::class, 'agency_branch_id');
    }

    public function steps(): HasMany
    {
        return $this->hasMany(Step::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(AssignmentPhoto::class);
    }
}
