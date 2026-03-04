<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoutingRule extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'emergency_type_id',
        'agency_id',
        'priority',
        'is_primary',
        'area',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
        ];
    }

    public function emergencyType()
    {
        return $this->belongsTo(EmergencyType::class);
    }

    public function agency()
    {
        return $this->belongsTo(Agency::class);
    }
}
