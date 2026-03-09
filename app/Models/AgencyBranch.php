<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AgencyBranch extends Model
{
    use HasFactory;

    protected $fillable = [
        'agency_id',
        'name',
        'address',
        'latitude',
        'longitude',
        'is_active',
        'coverage_radius_km',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'agency_branch_user')
            ->withPivot(['is_primary_branch'])
            ->withTimestamps();
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }
}
