const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Initialize Prisma with Adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	try {
		console.log("🌱 Starting database seeding...");

		// 1. Clear existing data in correct relational order (cascade-like deletion via transaction)
		console.log("🗑️ Clearing existing database records...");
		await prisma.ratingAndReview.deleteMany({});
		await prisma.courseProgress.deleteMany({});
		await prisma.subSection.deleteMany({});
		await prisma.section.deleteMany({});
		await prisma.course.deleteMany({});
		await prisma.category.deleteMany({});
		await prisma.profile.deleteMany({});
		await prisma.oTP.deleteMany({});
		await prisma.user.deleteMany({});
		console.log("✅ Database cleared.");

		// Default Password for all seed users
		const rawPassword = "password123";
		const hashedPassword = await bcrypt.hash(rawPassword, 10);

		// 2. Create 3 default Categories
		console.log("📂 Creating Categories...");
		const categories = [];
		const catNames = [
			{ name: "Web Development", desc: "Learn frontend, backend, and full stack web development technologies." },
			{ name: "Mobile App Development", desc: "Build iOS and Android apps using React Native, Flutter, and Swift." },
			{ name: "UI/UX Design", desc: "Master Figma, wireframing, user research, and modern UI design principles." }
		];

		for (const cat of catNames) {
			const c = await prisma.category.create({
				data: {
					name: cat.name,
					description: cat.desc
				}
			});
			categories.push(c);
		}
		console.log("✅ Categories created.");

		// 3. Create 10 Instructors (Teachers)
		console.log("👨‍🏫 Creating 10 Instructors...");
		const instructors = [];
		for (let i = 1; i <= 10; i++) {
			const email = `teacher${i}@studynotion.com`;
			const firstName = `Teacher`;
			const lastName = `${i}`;
			
			const instructor = await prisma.user.create({
				data: {
					firstName,
					lastName,
					email,
					password: hashedPassword,
					accountType: "Instructor",
					approved: true,
					image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
					profile: {
						create: {
							gender: i % 2 === 0 ? "Male" : "Female",
							about: `I am professional instructor number ${i} specialized in technology.`,
							contactNumber: `987654321${i - 1}`
						}
					}
				}
			});
			instructors.push(instructor);
		}
		console.log("✅ Instructors created.");

		// 4. Create Courses (each instructor gets 1 course)
		console.log("📚 Creating Courses with Sections & Lectures...");
		const courses = [];
		const courseTopics = [
			{ name: "React Starter Pack", price: 499, categoryIndex: 0 },
			{ name: "Advanced Node.js Guide", price: 799, categoryIndex: 0 },
			{ name: "Flutter Crash Course", price: 699, categoryIndex: 1 },
			{ name: "Swift UI Essentials", price: 899, categoryIndex: 1 },
			{ name: "Mastering Figma Pro", price: 399, categoryIndex: 2 },
			{ name: "Modern Web Styling", price: 299, categoryIndex: 0 },
			{ name: "Docker & CI/CD Masterclass", price: 999, categoryIndex: 0 },
			{ name: "Kotlin Native Development", price: 599, categoryIndex: 1 },
			{ name: "Figma UI Kit Creation", price: 199, categoryIndex: 2 },
			{ name: "Full Stack Design System", price: 1199, categoryIndex: 2 }
		];

		for (let i = 0; i < 10; i++) {
			const topic = courseTopics[i];
			const instructor = instructors[i];
			const category = categories[topic.categoryIndex];

			const course = await prisma.course.create({
				data: {
					courseName: topic.name,
					courseDescription: `Complete roadmap and hands-on guide for learning ${topic.name}. Perfect for beginners and advanced students alike.`,
					whatYouWillLearn: `Gain comprehensive understanding of ${topic.name}, build hands-on portfolio projects, and acquire professional industry-level practices.`,
					price: parseFloat(topic.price),
					thumbnail: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600`,
					tag: [topic.name.split(" ")[0], "Programming", "Learn"],
					instructions: ["Watch all video lectures", "Complete the practice quizzes", "Submit the capstone project"],
					status: "Published",
					instructorId: instructor.id,
					categoryId: category.id,
					sections: {
						create: [
							{
								sectionName: "Module 1: Getting Started",
								subSections: {
									create: [
										{
											title: "1.1 Introduction Lecture",
											timeDuration: "120",
											description: `Welcome to ${topic.name}! This lecture introduces the core roadmap.`,
											videoUrl: "https://res.cloudinary.com/demo/video/upload/v1619438258/sample_video.mp4"
										},
										{
											title: "1.2 Setup Environment",
											timeDuration: "350",
											description: "Step-by-step setup guides for all tools and configurations.",
											videoUrl: "https://res.cloudinary.com/demo/video/upload/v1619438258/sample_video.mp4"
										}
									]
								}
							},
							{
								sectionName: "Module 2: Core Concepts",
								subSections: {
									create: [
										{
											title: "2.1 Deep Dive Lecture",
											timeDuration: "500",
											description: "Explore advanced design patterns and coding syntax.",
											videoUrl: "https://res.cloudinary.com/demo/video/upload/v1619438258/sample_video.mp4"
										}
									]
								}
							}
						]
					}
				}
			});
			courses.push(course);
		}
		console.log("✅ Courses, Sections, and Subsections created.");

		// 5. Create 10 Students
		console.log("🧑‍🎓 Creating 10 Students...");
		const students = [];
		for (let i = 1; i <= 10; i++) {
			const email = `student${i}@studynotion.com`;
			const firstName = `Student`;
			const lastName = `${i}`;

			const student = await prisma.user.create({
				data: {
					firstName,
					lastName,
					email,
					password: hashedPassword,
					accountType: "Student",
					image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
					profile: {
						create: {
							gender: i % 2 === 0 ? "Female" : "Male",
							about: `I am a student learner number ${i} eager to learn new tech skills.`,
							contactNumber: `912345678${i - 1}`
						}
					}
				}
			});
			students.push(student);
		}
		console.log("✅ Students created.");

		// 6. Enroll Students in Courses
		console.log("🔗 Enrolling Students into Courses...");
		for (let i = 0; i < 10; i++) {
			const student = students[i];
			// Enroll student i into course i, course (i+1)%10, and course (i+2)%10 to create varied test states
			const courseIndices = [i, (i + 1) % 10, (i + 2) % 10];
			
			for (const courseIdx of courseIndices) {
				const course = courses[courseIdx];
				await prisma.course.update({
					where: { id: course.id },
					data: {
						enrolledStudents: {
							connect: { id: student.id }
						}
					}
				});
			}
		}
		console.log("✅ Students enrolled.");
		console.log("\n🎉 Database Seeding Completed Successfully!");
		console.log("====================================================");
		console.log("LOGIN CREDENTIALS TO VERIFY:");
		console.log("All accounts share the default password: password123\n");
		console.log("TEACHERS (Instructors):");
		for (let i = 1; i <= 10; i++) {
			console.log(`- Email: teacher${i}@studynotion.com`);
		}
		console.log("\nSTUDENTS:");
		for (let i = 1; i <= 10; i++) {
			console.log(`- Email: student${i}@studynotion.com`);
		}
		console.log("====================================================");
		
		await prisma.$disconnect();
		process.exit(0);

	} catch (error) {
		console.error("❌ Error during database seeding:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
}

main();
