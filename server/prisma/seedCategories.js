const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Setup the pool connection using DATABASE_URL from .env
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
        console.log("🔌 Connecting to PostgreSQL via Prisma Adapter...");
        console.log("URL Status:", process.env.DATABASE_URL ? "Found" : "NOT FOUND - check .env for DATABASE_URL");

        console.log("📚 Creating categories...\n");

        const result = await prisma.category.createMany({
            data: categories,
            skipDuplicates: true, 
        });

        console.log(`✨ Successfully processed category inserts. (Count added/checked: ${result.count})\n`);

        const allCategories = await prisma.category.findMany();
        allCategories.forEach((category, index) => {
            console.log(`   ${index + 1}. ${category.name}`);
            console.log(`      🆔 ID: ${category.id}\n`);
        });

        console.log("🎉 Categories seeded successfully!");
        await prisma.$disconnect();
        await pool.end();
        console.log("🔌 Database connection closed.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error seeding categories:", error.message);
        await prisma.$disconnect();
        await pool.end();
        process.exit(1);
    }
};

seedCategories();