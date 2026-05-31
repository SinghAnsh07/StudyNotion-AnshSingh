const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

// Import all models
const User = require("../models/User");
const Profile = require("../models/Profile");
const Course = require("../models/Course");
const Category = require("../models/Category");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const CourseProgress = require("../models/CourseProgress");
const RatingAndReview = require("../models/RatingAndReview");
const OTP = require("../models/OTP");

const clearDatabase = async () => {
    try {
        console.log("🔌 Connecting to database...");

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("✅ Connected to database successfully!");
        console.log("🗑️  Starting database cleanup...\n");

        // Clear all collections
        const collections = [
            { name: "Users", model: User },
            { name: "Profiles", model: Profile },
            { name: "Courses", model: Course },
            { name: "Categories", model: Category },
            { name: "Sections", model: Section },
            { name: "SubSections", model: SubSection },
            { name: "CourseProgress", model: CourseProgress },
            { name: "RatingAndReviews", model: RatingAndReview },
            { name: "OTPs", model: OTP },
        ];

        for (const collection of collections) {
            const result = await collection.model.deleteMany({});
            console.log(`   ✓ Cleared ${collection.name}: ${result.deletedCount} documents deleted`);
        }

        console.log("\n✨ Database cleared successfully!");
        console.log("🎉 You can now sign up fresh and test the app!\n");

        // Close the connection
        await mongoose.connection.close();
        console.log("🔌 Database connection closed.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error clearing database:", error);
        process.exit(1);
    }
};

// Run the cleanup
clearDatabase();
