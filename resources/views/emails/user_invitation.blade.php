<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invitation to Join {{ $organizationName }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f6f9;
            margin: 0;
            padding: 0;
            color: #333333;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }
        .header {
            background-color: #1e293b;
            color: #ffffff;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .body-content {
            padding: 32px 24px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #0f172a;
        }
        .text {
            font-size: 15px;
            line-height: 1.6;
            color: #475569;
            margin-bottom: 24px;
        }
        .btn-wrapper {
            text-align: center;
            margin: 32px 0;
        }
        .btn {
            background-color: #2563eb;
            color: #ffffff !important;
            padding: 14px 28px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            border-radius: 6px;
            display: inline-block;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }
        .fallback {
            font-size: 12px;
            color: #94a3b8;
            word-break: break-all;
            background-color: #f8fafc;
            padding: 12px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
        }
        .footer {
            background-color: #f8fafc;
            padding: 16px 24px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ $organizationName }}</h1>
        </div>
        <div class="body-content">
            <div class="greeting">Hello {{ $user->name }},</div>
            <div class="text">
                You have been invited to join <strong>{{ $organizationName }}</strong> on the Sanitary Wares & Tiles ERP system.
                <br><br>
                Please click the button below to accept your invitation and set up your secure account password.
            </div>
            
            <div class="btn-wrapper">
                <a href="{{ $invitationLink }}" class="btn" target="_blank">Accept Invitation & Set Password</a>
            </div>

            <div class="text" style="margin-bottom: 8px; font-size: 13px;">
                If the button above does not work, copy and paste the following URL into your web browser:
            </div>
            <div class="fallback">
                {{ $invitationLink }}
            </div>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} {{ $organizationName }}. All rights reserved.
        </div>
    </div>
</body>
</html>
