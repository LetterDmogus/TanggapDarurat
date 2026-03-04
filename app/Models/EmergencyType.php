<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmergencyType extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'is_need_location',
        'form_schema',
    ];

    protected function casts(): array
    {
        return [
            'is_need_location' => 'boolean',
            'form_schema' => 'array',
        ];
    }

    public function routingRules()
    {
        return $this->hasMany(RoutingRule::class);
    }
}
