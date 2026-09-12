<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $token;
    public $appName;

    /**
     * Create a new message instance.
     *
     * @param  mixed  $user
     * @param  string  $token
     * @param  string  $appName
     * @return void
     */
    public function __construct($user, string $token, string $appName = 'Sanitary Wares & Tiles ERP')
    {
        $this->user = $user;
        $this->token = $token;
        $this->appName = $appName;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Password Reset Request - ' . $this->appName)
                    ->view('emails.password_reset');
    }
}
