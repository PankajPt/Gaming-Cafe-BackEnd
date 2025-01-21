import { LOGIN_PAGE } from '../config/constants.js'

const tokenExpiredResponse = () => {
    return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Account Verified</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f9;
                            margin: 0;
                            padding: 0;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            color: #333;
                        }
                        .container {
                            text-align: center;
                            background: #ffffff;
                            padding: 20px 30px;
                            border-radius: 10px;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #4CAF50;
                            font-size: 24px;
                        }
                        p {
                            font-size: 16px;
                            margin: 10px 0;
                        }
                        .redirect {
                            font-size: 14px;
                            color: #777;
                            margin-top: 20px;
                        }
                        a {
                            color: #4CAF50;
                            text-decoration: none;
                            font-weight: bold;
                        }
                        a:hover {
                            text-decoration: underline;
                        }
                    </style>
                    <script>
                        setTimeout(() => {
                            window.location.href = "${LOGIN_PAGE}";
                        }, 5000);
                    </script>
                </head>
                <body>
                    <div class="container">
                        <h1>Link Expired</h1>
                        <p>The verification link has expired. Please log in with your username and password to generate a new verification link and activate your account.</p>
                        <p class="redirect">You will be redirected to the login page in 5 seconds. If the redirection doesn't happen, <a href="${LOGIN_PAGE}">click here</a>.</p>
                    </div>
                </body>
                </html>
             `
    }

export default tokenExpiredResponse;