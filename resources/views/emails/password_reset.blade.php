<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset Request</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 30px; }
        .card { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eef2f5; }
        .header h2 { color: #4f46e5; margin: 0; font-size: 24px; }
        .content { padding: 24px 0; color: #374151; font-size: 15px; line-height: 1.6; }
        .code-box { background: #eef2ff; border: 1px dashed #6366f1; border-radius: 8px; text-align: center; padding: 16px; margin: 20px 0; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #4f46e5; }
        .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px; border-top: 1px solid #eef2f5; padding-top: 16px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h2>{{ $appName }}</h2>
        </div>
        <div class="content">
            <p>Hello <strong>{{ $user->name }}</strong>,</p>
            <p>We received a request to reset your password for your ERP account.</p>
            <p>Use the password reset token / code below to reset your password:</p>
            <div class="code-box">
                {{ $token }}
            </div>
            <p>If you did not request a password reset, please ignore this email or contact your administrator if you have security concerns.</p>
            <p>This code will expire in 60 minutes.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} {{ $appName }}. All rights reserved.
        </div>
    </div>
</body>
</html>
