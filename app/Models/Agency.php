<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Agency extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'type',
        'area',
        'contact',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function routingRules()
    {
        return $this->hasMany(RoutingRule::class);
    }

    public function branches()
    {
        return $this->hasMany(AgencyBranch::class);
    }
}
