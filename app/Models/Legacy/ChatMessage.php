<?php

namespace App\Models\Legacy;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'sender_id',
        'message',
        'is_ai',
        'youtube_metadata',
    ];

    protected function casts(): array
    {
        return [
            'is_ai' => 'boolean',
            'youtube_metadata' => 'array',
        ];
    }

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}

