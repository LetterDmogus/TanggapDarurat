<?php

namespace App\Models\Legacy;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiAnalysis extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'summary',
        'first_aid_instructions',
        'youtube_links',
        'raw_response',
    ];

    protected function casts(): array
    {
        return [
            'youtube_links' => 'array',
            'raw_response' => 'array',
        ];
    }

    public function report()
    {
        return $this->belongsTo(Report::class);
    }
}

