const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Category = require("../models/Category");
const Course = require("../models/Course");

async function fix() {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ Connected");

    // Step 1: Remove the duplicate 12 categories added by second seed run
    const allCats = await Category.find({}).sort({ _id: 1 });
    console.log("\nTotal categories before cleanup:", allCats.length);

    // Keep only unique category names — keep the first occurrence (older IDs)
    const seen = new Set();
    const toDelete = [];
    for (const cat of allCats) {
        if (seen.has(cat.name)) {
            toDelete.push(cat._id);
        } else {
            seen.add(cat.name);
        }
    }
    if (toDelete.length > 0) {
        const del = await Category.deleteMany({ _id: { $in: toDelete } });
        console.log("🗑️  Removed", del.deletedCount, "duplicate categories");
    }

    // Step 2: Fix course <-> category back-reference
    const courses = await Course.find({});
    console.log("\nCourses found:", courses.length);

    for (const course of courses) {
        if (!course.category) continue;
        // Add course to its category's courses array if not already there
        const updated = await Category.findByIdAndUpdate(
            course.category,
            { $addToSet: { courses: course._id } },
            { new: true }
        );
        if (updated) {
            console.log("✅ Linked course to category:", updated.name, "| courses count:", updated.courses.length);
        } else {
            console.log("⚠️  Category not found for course:", course._id);
        }
    }

    // Step 3: Final state
    const finalCats = await Category.find({ "courses.0": { $exists: true } });
    console.log("\n📋 Categories with courses:", finalCats.length);
    finalCats.forEach(c => console.log("  -", c.name, "| courses:", c.courses.length));

    await mongoose.connection.close();
    console.log("\n🎉 Done! Refresh your browser.");
}

fix().catch(e => { console.error("❌", e.message); process.exit(1); });
