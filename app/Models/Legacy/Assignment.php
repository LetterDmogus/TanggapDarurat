<?php

namespace App\Models\Legacy;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'unit_id',
        'responder_id',
        'dispatched_at',
        'arrived_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'dispatched_at' => 'datetime',
            'arrived_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function unit()
    {
        return $this->belongsTo(EmergencyUnit::class, 'unit_id');
    }

    public function responder()
    {
        return $this->belongsTo(User::class, 'responder_id');
    }

    public function operationalCosts()
    {
        return $this->hasMany(OperationalCost::class);
    }
}

