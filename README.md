
# PRAVAH Prototype

This project is a React-based web application for Center Heads to manage student data, attendance, and operational logs. It includes a frontend built with Vite + React + TypeScript and a backend using Node.js + Express + MongoDB.

## Prerequisites

1.  **Node.js**: Install Node.js (v16 or higher) from [nodejs.org](https://nodejs.org/).
2.  **MongoDB**: Ensure you have MongoDB running locally or have a connection string for MongoDB Atlas.
3.  **Logo**: Place your logo image named `logo.png` in the `public/` folder of the frontend.

## Folder Structure

```
/
├── backend/          # Node.js Express API
├── public/           # Static assets (logo.png)
├── src/              # React Frontend code
├── index.html        # Entry HTML
├── package.json      # Frontend dependencies
├── vite.config.ts    # Frontend build config
└── ...
```

## Setup & Run Locally

### 1. Backend Setup

1.  Open a terminal and navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Backend Server:
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:5000`.

### 2. Frontend Setup

1.  Open a **new** terminal window and navigate to the **root** folder of the project:
    ```bash
    cd path/to/project
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Frontend Application:
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to `http://localhost:3000`.

## 🚀 Deployment (Make it Live)

To deploy this application to the web using Firebase Hosting with your API Key, follow these steps:

1.  **Install Firebase Tools**:
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login to Google**:
    ```bash
    firebase login
    ```

3.  **Initialize Project**:
    Run this command and select your Firebase project (or create a new one):
    ```bash
    firebase use --add
    ```

4.  **Deploy**:
    Run the deploy script which builds your app and uploads it:
    ```bash
    npm run deploy
    ```

Your app will be live at: `https://<your-project-id>.web.app`

**Note on Backend:**
This deployment hosts the **Frontend Only**. The app is currently configured to use `localStorage` (Mock Data), so it **will function correctly** on the web immediately. To use the Node.js backend live, you would need to deploy the `backend/` folder separately to a service like Heroku, Render, or Google Cloud Run.
