import { REDIRECTIONS } from '../config/constants.js'

const submitPasswordForm = () => {
    return `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background: linear-gradient(135deg, #4caf50, #81c784);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    color: #333;
                }
                .container {
                    background-color: #ffffff;
                    padding: 30px 40px;
                    border-radius: 10px;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    max-width: 400px;
                    width: 100%;
                }
                .container h2 {
                    color: #4caf50;
                    margin-bottom: 20px;
                }
                .form-group {
                    margin-bottom: 15px;
                    text-align: left;
                }
                .form-group label {
                    display: block;
                    font-size: 14px;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                .form-group input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.3s ease;
                }
                .form-group input:focus {
                    border-color: #4caf50;
                }
                .submit-btn {
                    background-color: #4caf50;
                    color: #ffffff;
                    border: none;
                    padding: 10px 20px;
                    font-size: 16px;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                    width: 100%;
                }
                .submit-btn:disabled {
                    background-color: #cccccc;
                    cursor: not-allowed;
                }
                .submit-btn:hover:not(:disabled) {
                    background-color: #45a049;
                }
                .message {
                    margin-top: 15px;
                    font-size: 14px;
                    color: #777;
                }
                .error {
                    color: red;
                    font-size: 14px;
                    margin-top: 5px;
                    text-align: left;
                }
            </style>
        </head>
    <body>
        <div class="container">
            <h2>Reset Your Password</h2>
            <form action="${REDIRECTIONS.BACKEND_BASE_URL}/users/update-passwd-mdb" method="POST">
                <div class="form-group">
                    <label for="new-password">New Password</label>
                    <input type="password" id="new-password" name="newPassword" placeholder="Enter your new password" required>
                </div>
                <div class="form-group">
                    <label for="confirm-password">Confirm Password</label>
                    <input type="password" id="confirm-password" name="confirmPassword" placeholder="Confirm your new password" required>
                    <div id="error-message" class="error"></div>
                </div>
                <button type="submit" class="submit-btn" id="submit-btn" disabled>Submit</button>
            </form>
            <div class="message">
                <p>Make sure your password is strong and secure.</p>
            </div>
        </div>
        <script>
            const newPassword = document.getElementById('new-password');
            const confirmPassword = document.getElementById('confirm-password');
            const submitBtn = document.getElementById('submit-btn');
            const errorMessage = document.getElementById('error-message');

            function validatePasswords() {
                if (newPassword.value === confirmPassword.value) {
                    errorMessage.textContent = '';
                    submitBtn.disabled = false;
                } else {
                    errorMessage.textContent = 'Passwords do not match.';
                    submitBtn.disabled = true;
                }
            }

            newPassword.addEventListener('input', validatePasswords);
            confirmPassword.addEventListener('input', validatePasswords);
        </script>
    </body>
    </html>
`
}

export default submitPasswordForm