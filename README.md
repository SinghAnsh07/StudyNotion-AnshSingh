<div align="center">

# 📚 Study Notion

### *Empowering Education Through Technology*

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**A modern, responsive online learning platform designed to deliver an intuitive and seamless experience for students, educators, and administrators.**

[🐛 Report Bug](https://github.com/SinghAnsh07/StudyNotion-AnshSingh/issues) • [✨ Request Feature](https://github.com/SinghAnsh07/StudyNotion-AnshSingh/issues)

</div>

---

## 🌟 Overview

**Study Notion** is a comprehensive e-learning platform that bridges the gap between educators and learners. Built with cutting-edge technologies, it provides a robust, scalable, and user-friendly environment for online education.

### ✨ Key Features

<table>
<tr>
<td width="50%">

#### 🎓 **Interactive Learning**
Smooth navigation and an engaging interface designed to enhance the student learning experience.

#### 📚 **Course Management**
Powerful tools for creating, managing, and accessing courses with ease.

#### 📊 **Personalized Dashboard**
Track progress, monitor performance, and manage your learning journey.

</td>
<td width="50%">

#### 🌐 **Responsive Design**
Fully optimized for all devices - desktop, tablet, and mobile.

#### ⚡ **High Performance**
Built with modern web technologies ensuring fast load times and scalability.

#### 🔒 **Secure & Reliable**
Industry-standard security with JWT authentication and encrypted passwords.

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

### **Frontend**
```
⚛️  React.js          - UI Library
🎨  Tailwind CSS      - Utility-first CSS Framework
🧩  Shadcn UI         - Re-usable Component Library
```

### **Backend**
```
🟢  Node.js           - JavaScript Runtime
🚂  Express.js        - Web Application Framework
🍃  MongoDB           - NoSQL Database
📦  Mongoose          - MongoDB Object Modeling
```

### **Additional Services & Tools**
```
☁️  Cloudinary        - Media Storage & Optimization
💳  Stripe            - Payment Processing
🔐  JWT               - Authentication & Authorization
🔒  Bcrypt.js         - Password Hashing
📧  Nodemailer        - Email Service
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.x or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)

### � Installation

1️⃣ **Clone the repository**
```bash
git clone https://github.com/SinghAnsh07/StudyNotion-AnshSingh.git
cd StudyNotion-AnshSingh
```

2️⃣ **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

3️⃣ **Configure environment variables**

Create `.env` files in the following locations:

**Root `.env` (Frontend)**
```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

**`server/.env` (Backend)**
```env
PORT=4000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
MAIL_HOST=smtp.gmail.com
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_email_password
```

4️⃣ **Run the development servers**
```bash
# Run both frontend and backend concurrently
npm run dev
```

The application will be available at:
- **Frontend:** `http://localhost:5173`
- **Backend:** `http://localhost:4000`

---

## 📂 Project Structure

```
StudyNotion-AnshSingh/
├── 📁 public/              # Static assets
├── 📁 src/                 # Frontend source code
│   ├── 📁 components/      # React components
│   ├── 📁 pages/           # Page components
│   ├── 📁 services/        # API services
│   ├── 📁 utils/           # Utility functions
│   └── 📄 App.jsx          # Main App component
├── 📁 server/              # Backend source code
│   ├── 📁 controllers/     # Route controllers
│   ├── 📁 models/          # Database models
│   ├── 📁 routes/          # API routes
│   ├── 📁 middleware/      # Custom middleware
│   └── 📄 index.js         # Server entry point
├── 📄 package.json         # Frontend dependencies
└── 📄 README.md            # You are here!
```

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License.

---

## 👨‍💻 Author

**Ansh Singh**

- GitHub: [@SinghAnsh07](https://github.com/SinghAnsh07)
- LinkedIn: [Connect with me](https://www.linkedin.com/in/anshsingh07/)

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Made with ❤️ by Ansh Singh**

</div>