import { LOGIN_PAGE } from '../config/constants.js'

const generateVerificationResponse = () => {
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
                        <h1>Account Verified Successfully</h1>
                        <p>Please log in using your username and password.</p>
                        <p class="redirect">Redirecting to the login page in 5 seconds... If not, <a href="${LOGIN_PAGE}">click here</a>.</p>
                    </div>
                </body>
                </html>
             `
    }

    // name success response
    // title and body and redirect to login page
export default generateVerificationResponse;