const prisma = require("../config/prisma");

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

// Helper to format course for Mongoose compatibility in Catalog views
const formatCatalogCourse = (course) => {
	if (!course) return null;
	return {
		...course,
		_id: course.id, // Mongoose compatibility
		studentsEnrolled: (course.enrolledStudents || []).map(std => std.id || std),
		studentsEnroled: (course.enrolledStudents || []).map(std => std.id || std)
	};
};

// Helper to format category for Mongoose compatibility
const formatCatalogCategory = (category) => {
	if (!category) return null;
	return {
		...category,
		_id: category.id, // Mongoose compatibility
		courses: (category.courses || []).map(c => formatCatalogCourse(c))
	};
};

exports.createCategory = async (req, res) => {
	try {
		const { name, description } = req.body;
		if (!name) {
			return res
				.status(400)
				.json({ success: false, message: "All fields are required" });
		}
		const categoryDetails = await prisma.category.create({
			data: {
				name: name,
				description: description,
			}
		});
		console.log(categoryDetails);
		return res.status(200).json({
			success: true,
			message: "Category Created Successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

exports.showAllCategories = async (req, res) => {
	try {
		console.log("INSIDE SHOW ALL CATEGORIES");
		const allCategories = await prisma.category.findMany({});
		const formatted = allCategories.map(cat => ({
			...cat,
			_id: cat.id // Mongoose compatibility
		}));
		res.status(200).json({
			success: true,
			data: formatted,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// categoryPageDetails 
exports.categoryPageDetails = async (req, res) => {
	try {
		const { categoryId } = req.body;
		console.log("PRINTING CATEGORY ID: ", categoryId);

		// Get courses for the specified category
		const selectedCategory = await prisma.category.findUnique({
			where: { id: categoryId },
			include: {
				courses: {
					where: { status: "Published" },
					include: {
						ratingsAndReviews: true,
						instructor: true,
						enrolledStudents: true,
					}
				}
			}
		});

		// Handle the case when the category is not found
		if (!selectedCategory) {
			console.log("Category not found.");
			return res
				.status(404)
				.json({ success: false, message: "Category not found" });
		}

		// Get courses for other categories
		const categoriesExceptSelected = await prisma.category.findMany({
			where: {
				id: { not: categoryId }
			}
		});

		let differentCategory = null;
		if (categoriesExceptSelected.length > 0) {
			const randomCategory = categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)];
			differentCategory = await prisma.category.findUnique({
				where: { id: randomCategory.id },
				include: {
					courses: {
						where: { status: "Published" },
						include: {
							instructor: true,
							enrolledStudents: true,
						}
					}
				}
			});
		}

		// Get top-selling courses across all categories
		const allCourses = await prisma.course.findMany({
			where: { status: "Published" },
			include: {
				instructor: true,
				enrolledStudents: true,
			}
		});

		// Sort by number of enrolled students (best proxy for "sold")
		const mostSellingCourses = allCourses
			.sort((a, b) => b.enrolledStudents.length - a.enrolledStudents.length)
			.slice(0, 10);

		res.status(200).json({
			success: true,
			data: {
				selectedCategory: formatCatalogCategory(selectedCategory),
				differentCategory: formatCatalogCategory(differentCategory),
				mostSellingCourses: mostSellingCourses.map(c => formatCatalogCourse(c)),
			},
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
};