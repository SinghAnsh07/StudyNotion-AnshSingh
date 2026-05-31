const prisma = require("../config/prisma");

// Helper to format course to match Mongoose populated structure
const formatCourse = (course) => {
	if (!course) return null;
	const formatted = {
		...course,
		_id: course.id, // Mongoose compatibility
		courseContent: (course.sections || []).map(s => {
			const formattedSection = {
				...s,
				_id: s.id, // Mongoose compatibility
				subSection: (s.subSections || []).map(sub => ({
					...sub,
					_id: sub.id // Mongoose compatibility
				}))
			};
			delete formattedSection.subSections;
			return formattedSection;
		})
	};
	delete formatted.sections;
	return formatted;
};

// CREATE a new section
exports.createSection = async (req, res) => {
	try {
		// Extract the required properties from the request body
		const { sectionName, courseId } = req.body;

		// Validate the input
		if (!sectionName || !courseId) {
			return res.status(400).json({
				success: false,
				message: "Missing required properties",
			});
		}

		// Create a new section
		await prisma.section.create({
			data: {
				sectionName,
				courseId,
			}
		});

		// Fetch the updated course with sections and subSections
		const updatedCourse = await prisma.course.findUnique({
			where: { id: courseId },
			include: {
				sections: {
					include: {
						subSections: true
					}
				}
			}
		});

		// Return the updated course object in the response
		res.status(200).json({
			success: true,
			message: "Section created successfully",
			updatedCourse: formatCourse(updatedCourse),
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
};

// UPDATE a section
exports.updateSection = async (req, res) => {
	try {
		const { sectionName, sectionId, courseId } = req.body;
		
		const section = await prisma.section.update({
			where: { id: sectionId },
			data: { sectionName }
		});

		const course = await prisma.course.findUnique({
			where: { id: courseId },
			include: {
				sections: {
					include: {
						subSections: true
					}
				}
			}
		});

		res.status(200).json({
			success: true,
			message: section,
			data: formatCourse(course),
		});
	} catch (error) {
		console.error("Error updating section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
};

// DELETE a section
exports.deleteSection = async (req, res) => {
	try {
		const { sectionId, courseId } = req.body;

		const section = await prisma.section.findUnique({
			where: { id: sectionId }
		});

		if (!section) {
			return res.status(404).json({
				success: false,
				message: "Section not Found",
			});
		}

		// Delete section (cascade delete will handle subSections in PostgreSQL)
		await prisma.section.delete({
			where: { id: sectionId }
		});

		// Find the updated course and return
		const course = await prisma.course.findUnique({
			where: { id: courseId },
			include: {
				sections: {
					include: {
						subSections: true
					}
				}
			}
		});

		res.status(200).json({
			success: true,
			message: "Section deleted",
			data: formatCourse(course)
		});
	} catch (error) {
		console.error("Error deleting section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
};