# 🚀 iChats: Fully Secured Real-Time Chat Application

**iChats** is a modern, full-stack chat application built with a strong focus on user privacy, data security, and seamless real-time communication. This project demonstrates best practices in authentication, backend security, and modern web development architecture.

## 🌟 Features & Design Goals

| Category | Feature | Status |
| :--- | :--- | :--- |
| **Authentication** | Secure Password Hashing (**Bcrypt**). | ✅ Implemented |
| **Authentication** | Stateless Authentication (**JSON Web Tokens - JWT**). | ✅ Complete |
| **Hacker Prevention** | **Rate Limiting** on Auth Endpoints (Brute Force Protection). | ✅ Complete |
| **Hacker Prevention** | Input Sanitization & **XSS/Injection Prevention**. | ✅ Complete |
| **Security** | Secure Route Middleware (JWT Verification). | ✅ Complete |
| **Security** | Detailed Server-Side Validation & Error Handling (Mongoose). | ✅ Implemented |
| **Real-Time** | Live Chat Messaging (**Socket.IO**). | ✅ Complete |
| **Future Security Goal** | **End-to-End Encryption (E2EE)** for chat messages. | 🛠️ In Progress |
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
| **Security** | **Bcrypt**, **jsonwebtoken (JWT)**, **express-rate-limit** | Password hashing, stateless session management, and brute force protection. |
| **Real-time** | **Socket.IO** | Bi-directional communication for live chat functionality. |

***

## 🔑 Key Security Implementation Details

This project was built with a security-first mindset.

1.  **Password Hashing:** Passwords are never stored in plaintext. The `bcrypt` hashing is implemented using Mongoose's `pre('save')` middleware hook in the User schema.
2.  **Authentication Flow:** User sessions are managed using **JWTs**. The token is generated on successful login and stored securely client-side.
3.  **JWT Verification:** A custom Express middleware function validates the JWT's signature and expiration on all protected API routes, ensuring only authenticated users can access sensitive resources.
4.  **Rate Limiting:** Authentication endpoints are protected with rate limiting to prevent brute force attacks, limiting the number of requests from a single IP address.
5.  **XSS & Injection Prevention:** All user inputs are sanitized and validated to prevent cross-site scripting (XSS) attacks and SQL/NoSQL injection attempts.
6.  **Real-Time Security:** Socket.IO connections are authenticated using JWT tokens to ensure only authorized users can participate in chat sessions.

***

## 🎯 Current Development Focus

### Completed Features
- ✅ Full JWT authentication system with secure token generation and validation
- ✅ Rate limiting on authentication endpoints to prevent abuse
- ✅ Real-time chat messaging with Socket.IO
- ✅ Input sanitization and XSS/injection prevention
- ✅ Comprehensive security middleware architecture

### In Progress
- 🛠️ **End-to-End Encryption (E2EE):** Implementing client-side encryption for messages to ensure that only the sender and recipient can read message contents, with zero-knowledge architecture.

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
2.  Create a `.env` file in the backend directory with the following variables:
    ```env
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_secret_key
    PORT=3000
    ```
3.  Start the Express server.
    ```bash
    npm run dev
    ```
    (The server will run on `http://localhost:3000`).

### 2. Frontend Setup (`/frontend` folder)

1.  Navigate to the `frontend` directory and install dependencies.
    ```bash
    cd ../frontend/iChats
    npm install
    ```
2.  Start the Vite development server.
    ```bash
    npm run dev
    ```
    (The application will be accessible at `http://localhost:5173`).

***

## 🔒 Security Best Practices Implemented

- **Bcrypt Password Hashing:** Industry-standard password security with configurable salt rounds
- **JWT Token Management:** Secure, stateless authentication with expiration handling
- **Rate Limiting:** Protection against brute force and DDoS attacks
- **Input Validation:** Comprehensive server-side validation using Mongoose schemas
- **XSS Prevention:** Sanitization of all user inputs before processing
- **CORS Configuration:** Properly configured cross-origin resource sharing
- **Secure Headers:** Implementation of security-focused HTTP headers

***

## 🤝 Contribution & Community

This project is actively seeking feedback and contributions, particularly in the implementation of **End-to-End Encryption (E2EE)** and additional security features.

If you are interested in security, real-time development, or contributing to the feature roadmap, please feel free to:

1.  **Fork** the repository.
2.  **Open an Issue** to report bugs or suggest new features.
3.  **Submit a Pull Request** with improvements.

### Areas Open for Contribution
- End-to-End Encryption implementation
- Additional authentication methods (OAuth, 2FA)
- Message deletion and editing features
- File sharing capabilities
- Group chat functionality
- UI/UX improvements

*Thank you for checking out iChats! Your feedback is highly valued.*

---
**Author:** [Ronin-yashu](https://github.com/Ronin-yashu)  
**License:** [currently in progress]
