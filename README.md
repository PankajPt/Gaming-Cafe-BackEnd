# Madgear Gaming Cafe - Backend

Madgear Gaming Cafe backend handles authentication, user management, event booking, and other API functionalities. Built using Node.js, Express, and MongoDB.

## Project Structure
```
extracted_backend/
    .gitignore
    app.js
    index.js
    package.json
    package-lock.json
    README.md
    src/
        config/
            [Configuration Files]
        controllers/
            [API Controllers]
        middleware/
            [Middleware Handlers]
        models/
            [Database Models]
        routes/
            [API Routes]
        templates/
            [Email Templates]
        utils/
            [Utility Functions]
```

# Madgear Gaming Cafe - Frontend Setup Guide

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/PankajPt/madgear.git
cd madgear
```

### 2️⃣ Install Dependencies
```bash
npm install
```

## 🎨 Setting Up Tailwind CSS

### 3️⃣ Install Tailwind CSS and Related Packages
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 4️⃣ Configure Tailwind Content Paths
Open `tailwind.config.js` and set the `content` property:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### 5️⃣ Add Tailwind Directives in CSS
In `src/index.css`, add:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 🛠️ Running the Project
```bash
npm run dev
```

## ❗ Troubleshooting
If Tailwind commands are not recognized:
```bash
rm -rf node_modules package-lock.json
tnpm cache clean --force
npm install
```

If styles are not applied, check:
- Tailwind is imported correctly in `index.css`
- The `content` paths in `tailwind.config.js` are correct
- Restart the development server after changes

---
This setup ensures Tailwind works correctly with your **Madgear Gaming Cafe** frontend. 🚀



## Environment Variables
Create a `.env` file in the root directory and add the required environment variables.

### Example `.env` File
Create a `.env.example` file with the following structure:
```
PORT=5000
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb+srv://your-db-url
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
RANDOM_KEY_SECRET=your_random_key
RANDOM_KEY_EXPIRY=3600
BREVO_API_KEY=your_brevo_api_key
CLOUDINARY_URL=your_cloudinary_url
MADGEAR_EMAIL=your@email.com
```
Ensure you update the actual `.env` file with real credentials before running the application.
Create a `.env` file in the root directory and add the required environment variables:
```
PORT=
CORS_ORIGIN=
MONGODB_URI=
ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=
CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_API_SECRET=
RANDOM_KEY_SECRET=
RAMDOM_KEY_EXPIRY=
BREVO_API_KEY=
CLOUDINARY_URL=
MADGEAR_EMAIL=
```

## Features
- User authentication & JWT-based authorization
- Event management & booking system
- Membership & subscription system
- Admin dashboard APIs

## Deployment
This project can be deployed using **Render**, **Vercel**, or **Docker**. Build and deploy with:
```sh
npm run start
```

## Contributing
Pull requests are welcome! Follow the project conventions and ensure all updates are tested.

## License
MIT License.
