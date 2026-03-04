<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'emergency_type_id',
        'user_id',
        'location_id',
        'status',
        'description',
        'longitude',
        'latitude',
        'metadata',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'date' => 'datetime',
        ];
    }
}
