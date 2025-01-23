const generateVerificationEmail = (name, title, body, verificationLink) => {
    // Verify Account-title
    // body-Click on the button below to verify your account:
    return `
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f9f9f9;
                            color: #333;
                            padding: 20px;
                            margin: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            background: #ffffff;
                            border-radius: 10px;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                            padding: 20px;
                            text-align: center;
                        }
                        h2 {
                            color: #4CAF50;
                        }
                        p {
                            line-height: 1.6;
                        }
                        a {
                            display: inline-block;
                            margin-top: 20px;
                            padding: 10px 20px;
                            font-size: 16px;
                            color: #ffffff;
                            background: #4CAF50;
                            text-decoration: none;
                            border-radius: 5px;
                            transition: background-color 0.3s ease;
                        }
                        a:hover {
                            background: #45a049;
                        }
                        .footer {
                            margin-top: 20px;
                            font-size: 14px;
                            color: #777;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Hello ${name},</h2>
                        <p>${body}</p>
                        <a href="${verificationLink}">${title}</a>
                        <div class="footer">
                            <p>This link will expires in 1hr.</p>
                            <p>If you did not request this, please ignore this email.</p>
                        </div>
                    </div>
                </body>
            </html>
        `
}

export default generateVerificationEmail