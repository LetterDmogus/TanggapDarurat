<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'agency_id',
        'status',
        'description',
        'admin_verification',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'admin_verification' => 'boolean',
            'date' => 'datetime',
        ];
    }
}
