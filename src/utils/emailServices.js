import { SENDER_NAME } from '../config/constants.js'
import asyncHandler from './asyncHandler.js'
import axios from 'axios'
// npm install axios

const senderMail = process.env.MADGEAR_EMAIL
const brevoURI = 'https://api.brevo.com/v3/smtp/email'
const API_KEY = process.env.BREVO_API_KEY

const sendVerificationLink = asyncHandler( async function(receipentEmail, name, verificationLink){
    const data = {
        sender: {
            email: senderMail,
            name: SENDER_NAME
        },
        to: [{
            email: receipentEmail,
            name
        }],
        subject: `Account Verification`,
        htmlContent: `
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
                        <p>Click on the button below to verify your account:</p>
                        <a href="${verificationLink}">Verify Account</a>
                        <div class="footer">
                            <p>If you did not request this, please ignore this email.</p>
                        </div>
                    </div>
                </body>
            </html>
        `
    }

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'api-key': API_KEY
        }
    }
    
    const response = await axios.post(brevoURI, data, config)
    return response
})

export default sendVerificationLink
