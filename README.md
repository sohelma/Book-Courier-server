BookCourier – Library to Home Delivery System

Project Purpose

BookCourier is a library-to-home book delivery system where users can browse books from nearby libraries, place orders, pay online, and track delivery status.
This project is designed to demonstrate full-stack MERN skills, authentication, role-based dashboards, and modern UI/UX.

Key Features
👤 Authentication (Firebase)

Email & Password Login

Google Social Login

Secure Private Routes

Profile Update with Image Upload

No email verification required

🏠 User Features

Browse all available books

View book details

Order books with modal form

Payment system (status-based)

Wishlist system

Review & Rating (only ordered users)

Order tracking (Pending → Shipped → Delivered)

Profile update with image

📊 Dashboard System

User Dashboard

My Orders

Wishlist

Payments / Invoices

Profile

Librarian Dashboard

Add Book

Manage Own Books

Order Management

Admin Dashboard

Manage Users

Manage All Books

Delete Books (with cascading orders)

🎨 UI / UX

Fully Responsive (Mobile / Tablet / Desktop)

Light & Dark Mode

Skeleton Loader (No spinner)

Modern 404 Page

Animated sections

Clean dashboard layout

Charts & Graphs for quick data visualization

🧠 Technology Stack
🔹 Client Side

React.js

React Router DOM

Tailwind CSS

Axios

Firebase Authentication

React Hot Toast

TanStack Query (optional)

Chart.js / Recharts (Dashboard)

🔹 Server Side

Node.js

Express.js

MongoDB

JWT Authentication

CORS

Dotenv

🔹 Database

MongoDB Atlas

🔐 Security

Firebase keys secured using environment variables

MongoDB credentials secured using dotenv

JWT token verification for protected API routes

Domain whitelisted in Firebase for production


Server .env
PORT=3000


📦 NPM Packages Used
Client

react

react-router-dom

axios

firebase

react-hot-toast

chart.js / react-chartjs-2

Server

express

mongodb

cors

dotenv

jsonwebtoken

🧪 Deployment

Client deployed on Vercel / Netlify

Server deployed on Render / Railway

MongoDB Atlas Cloud Database


Database
MONGODB Database: Book-Courier
Collection: Book
Collection: Banners
Collection: Order   


Flow chart
server/
│
├── index.js                 ← main server entry
│
├── config/
│   └── db.js                ← MongoDB connection (optional)
│
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── book.routes.js
│   ├── order.routes.js
│   ├── wishlist.routes.js
│   └── admin.routes.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── book.controller.js
│   ├── order.controller.js
│   ├── wishlist.controller.js
│   └── admin.controller.js
│
├── middlewares/
│   ├── verifyToken.js
│   ├── verifyAdmin.js
│   └── verifyLibrarian.js
│
├── models/
│   ├── User.js
│   ├── Book.js
│   └── Order.js
│
├── utils/
│   └── generateToken.js
│
└── .env
