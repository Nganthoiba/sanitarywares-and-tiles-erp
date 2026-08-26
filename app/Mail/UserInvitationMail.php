<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class UserInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $invitationLink;
    public $organizationName;

    /**
     * Create a new message instance.
     *
     * @param  mixed  $user
     * @param  string  $invitationLink
     * @param  string  $organizationName
     * @return void
     */
    public function __construct($user, string $invitationLink, string $organizationName = 'Sanitary Wares & Tiles ERP')
    {
        $this->user = $user;
        $this->invitationLink = $invitationLink;
        $this->organizationName = $organizationName;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Invitation to join ' . $this->organizationName)
                    ->view('emails.user_invitation');
    }
}
