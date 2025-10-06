# 🚀 iChats: Fully Secured Real-Time Chat Application

**iChats** is a modern, full-stack chat application built with a strong focus on user privacy, data security, and seamless real-time communication. This project demonstrates best practices in authentication, backend security, and modern web development architecture.

## 🌟 Features & Design Goals

| Category | Feature | Status |
| :--- | :--- | :--- |
| **Authentication** | Secure Password Hashing (**Bcrypt**). | ✅ Implemented |
| **Authentication** | Stateless Authentication (**JSON Web Tokens - JWT**). | 🛠️ In Progress |
| **Hacker Prevention** | **Rate Limiting** on Auth Endpoints (Brute Force Protection). | 🛠️ In Progress |
| **Hacker Prevention** | Input Sanitization & **XSS/Injection Prevention**. | 🛠️ In Progress |
| **Security** | Secure Route Middleware (JWT Verification). | 🛠️ In Progress |
| **Security** | Detailed Server-Side Validation & Error Handling (Mongoose). | ✅ Implemented |
| **Real-Time** | Live Chat Messaging (**Socket.IO**). | 🛠️ In Progress |
| **Future Security Goal** | **End-to-End Encryption (E2EE)** for chat messages. | 💡 Planned |
| **Architecture**| Separate Frontend (Vite/React) and Backend (Express). | ✅ Implemented |
| **Privacy** | User Choice for Account Recovery (Phone Number or Hyper-Secure). | ✅ Implemented |

***

## 🏗️ Technical Stack

This project utilizes a modern MERN stack ecosystem, optimized with VITE for fast development:

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | **Vite** (for fast build/dev), **React**, **Tailwind CSS** | User Interface, Form Handling (`react-hook-form`), Client-side Logic. |
| **Backend** | **Node.js**, **Express.js** | RESTful API, Routing, Authentication Logic, Security Middleware. |
| **Database** | **MongoDB** (via Mongoose) | Flexible, non-relational data persistence. |
| **Security** | **Bcrypt**, **jsonwebtoken (JWT)** | Password hashing and stateless session management. |
| **Real-time** | **Socket.IO** | Bi-directional communication for live chat functionality. |

***

## 🔑 Key Security Implementation Details

This project was built with a security-first mindset.

1.  **Password Hashing:** Passwords are never stored in plaintext. The `bcrypt` hashing is implemented using Mongoose's `pre('save')` middleware hook in the User schema.
2.  **Authentication Flow:** User sessions are managed using **JWTs**. The token is generated on successful login and stored client-side.
3.  **Auth Middleware:** A custom Express middleware function is being implemented to intercept requests, validate the JWT's signature and expiration, and secure all protected API routes.

***

## ⚙️ Installation and Setup

Follow these steps to get the project running on your local machine.

### Prerequisites

* Node.js (v18+)
* MongoDB running locally or a MongoDB Atlas connection string.

### 1. Backend Setup (`/backend` folder)

1.  Navigate to the `backend` directory and install dependencies.
    ```bash
    cd backend
    npm install
    ```
2.  Start the Express server.
    ```bash
    node server.js
    ```
    (The server will run on `http://localhost:3000`).

### 2. Frontend Setup (`/frontend` folder)

1.  Navigate to the `frontend` directory and install dependencies.
    ```bash
    cd ../frontend
    npm install
    ```
2.  Start the Vite development server.
    ```bash
    npm run dev
    ```
    (The application will be accessible at `http://localhost:5173`).

***

## 🤝 Contribution & Community

This project is actively seeking feedback and contributions, particularly in the implementation of **Socket.IO, JWT routing security, and the planning for E2EE**.

If you are interested in security, real-time development, or contributing to the feature roadmap, please feel free to:

1.  **Fork** the repository.
2.  **Open an Issue** to report bugs or suggest new features.
3.  **Submit a Pull Request** with improvements.

*Thank you for checking out iChats! Your feedback is highly valued.*

---
**Author:** [Ronin-yashu/https://github.com/Ronin-yashu]
**License:** [currently in progress]
