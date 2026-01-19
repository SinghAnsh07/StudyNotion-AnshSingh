const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

// Import Category model
const Category = require("../models/Category");

const categories = [
    {
        name: "Web Development",
        description: "Learn to build modern websites and web applications using the latest technologies like React, Node.js, and more."
    },
    {
        name: "Mobile Development",
        description: "Master mobile app development for iOS and Android using React Native, Flutter, Swift, and Kotlin."
    },
    {
        name: "Data Science",
        description: "Explore data analysis, machine learning, and AI with Python, R, and popular frameworks like TensorFlow and PyTorch."
    },
    {
        name: "Programming Languages",
        description: "Learn programming fundamentals and advanced concepts in languages like Python, Java, C++, JavaScript, and more."
    },
    {
        name: "Cloud Computing",
        description: "Master cloud platforms like AWS, Azure, and Google Cloud. Learn DevOps, containerization, and cloud architecture."
    },
    {
        name: "Cybersecurity",
        description: "Learn ethical hacking, network security, cryptography, and how to protect systems from cyber threats."
    },
    {
        name: "Database Management",
        description: "Master SQL and NoSQL databases including MySQL, PostgreSQL, MongoDB, and Redis."
    },
    {
        name: "UI/UX Design",
        description: "Learn user interface and user experience design principles, tools like Figma, and create stunning digital experiences."
    },
    {
        name: "Artificial Intelligence",
        description: "Dive into AI, machine learning, deep learning, and neural networks to build intelligent systems."
    },
    {
        name: "Blockchain",
        description: "Understand blockchain technology, smart contracts, and cryptocurrency development with Ethereum and Solidity."
    },
    {
        name: "Game Development",
        description: "Create games using Unity, Unreal Engine, and learn game design principles and 3D modeling."
    },
    {
        name: "Digital Marketing",
        description: "Master SEO, social media marketing, content marketing, and analytics to grow your online presence."
    }
];

const seedCategories = async () => {
    try {
        console.log("🔌 Connecting to database...");

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("✅ Connected to database successfully!");
        console.log("📚 Creating categories...\n");

        // Insert all categories
        const createdCategories = await Category.insertMany(categories);

        console.log(`✨ Successfully created ${createdCategories.length} categories:\n`);

        createdCategories.forEach((category, index) => {
            console.log(`   ${index + 1}. ${category.name}`);
            console.log(`      📝 ${category.description}`);
            console.log(`      🆔 ID: ${category._id}\n`);
        });

        console.log("🎉 Categories seeded successfully!\n");

        // Close the connection
        await mongoose.connection.close();
        console.log("🔌 Database connection closed.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error seeding categories:", error);
        process.exit(1);
    }
};

// Run the seeding
seedCategories();
