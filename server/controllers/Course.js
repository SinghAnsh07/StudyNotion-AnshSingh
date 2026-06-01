const prisma = require("../config/prisma");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");

// Relational include block for deep populate replacement
const courseIncludeBlock = {
	instructor: {
		include: { profile: true }
	},
	category: true,
	ratingsAndReviews: true,
	sections: {
		include: {
			subSections: true
		}
	},
	enrolledStudents: true
};

// Helper to format course to match Mongoose populated structure for the frontend
const formatCourseDetails = (course) => {
	if (!course) return null;
	const formatted = {
		...course,
		_id: course.id, // Mongoose compatibility
		ratingAndReviews: course.ratingsAndReviews || [],
		instructor: course.instructor ? {
			...course.instructor,
			_id: course.instructor.id, // Mongoose compatibility
			additionalDetails: course.instructor.profile ? {
				...course.instructor.profile,
				_id: course.instructor.profile.id // Mongoose compatibility
			} : null
		} : null,
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
		}),
		studentsEnrolled: (course.enrolledStudents || []).map(std => std.id || std),
		studentsEnroled: (course.enrolledStudents || []).map(std => std.id || std)
	};
	if (formatted.instructor) {
		delete formatted.instructor.profile;
		delete formatted.instructor.password;
	}
	delete formatted.sections;
	delete formatted.enrolledStudents;
	delete formatted.ratingsAndReviews;
	return formatted;
};

// Function to create a new course
exports.createCourse = async (req, res) => {
	try {
		// Get user ID from request object
		const userId = req.user.id;

		// Get all required fields from request body
		let {
			courseName,
			courseDescription,
			whatYouWillLearn,
			price,
			tag: _tag,
			category,
			status,
			instructions: _instructions,
		} = req.body;
		
		// Get thumbnail image from request files
		const thumbnail = req.files.thumbnailImage;

		// Convert the tag and instructions from stringified Array to Array
		const tag = JSON.parse(_tag);
		const instructions = JSON.parse(_instructions);

		console.log("tag", tag);
		console.log("instructions", instructions);

		// Check if any of the required fields are missing
		if (
			!courseName ||
			!courseDescription ||
			!whatYouWillLearn ||
			!price ||
			!tag.length ||
			!thumbnail ||
			!category ||
			!instructions.length
		) {
			return res.status(400).json({
				success: false,
				message: "All Fields are Mandatory",
			});
		}
		
		if (!status || status === undefined) {
			status = "Draft";
		}

		// Check if the user is an instructor
		const instructorDetails = await prisma.user.findFirst({
			where: { id: userId, accountType: "Instructor" }
		});

		if (!instructorDetails) {
			return res.status(404).json({
				success: false,
				message: "Instructor Details Not Found",
			});
		}

		// Check if the category given is valid
		const categoryDetails = await prisma.category.findUnique({
			where: { id: category }
		});
		if (!categoryDetails) {
			return res.status(404).json({
				success: false,
				message: "Category Details Not Found",
			});
		}

		// Upload the Thumbnail to Cloudinary
		const thumbnailImage = await uploadImageToCloudinary(
			thumbnail,
			process.env.FOLDER_NAME
		);
		console.log(thumbnailImage);

		// Create a new course
		const newCourse = await prisma.course.create({
			data: {
				courseName,
				courseDescription,
				instructorId: userId,
				whatYouWillLearn: whatYouWillLearn,
				price: parseFloat(price),
				tag,
				categoryId: category,
				thumbnail: thumbnailImage.secure_url,
				status: status,
				instructions,
			}
		});

		// Note: The User and Category relations are automatically fully established via 
		// foreign keys (instructorId, categoryId). We don't need manual array pushes in SQL.

		return res.status(200).json({
			success: true,
			data: newCourse,
			message: "Course Created Successfully",
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: "Failed to create course",
			error: error.message,
		});
	}
};

exports.editCourse = async (req, res) => {
	try {
		const { courseId } = req.body;
		const updates = req.body;

		console.log("EDIT REQ BODY:", req.body);

		const course = await prisma.course.findUnique({
			where: { id: courseId }
		});
		if (!course) {
			return res.status(404).json({ success: false, error: "Course not found" });
		}

		// Handle thumbnail image update if present
		let updatedThumbnailUrl = course.thumbnail;
		if (req.files && req.files.thumbnailImage) {
			console.log("Thumbnail update in progress...");
			const thumbnail = req.files.thumbnailImage;
			const thumbnailImage = await uploadImageToCloudinary(
				thumbnail,
				process.env.FOLDER_NAME
			);
			updatedThumbnailUrl = thumbnailImage.secure_url;
		}

		// Prepare updates
		const dataToUpdate = {
			thumbnail: updatedThumbnailUrl
		};

		for (const key of Object.keys(updates)) {
			if (key === "tag" || key === "instructions") {
				dataToUpdate[key] =
					typeof updates[key] === "string"
						? JSON.parse(updates[key])
						: updates[key];
			} else if (key === "category") {
				dataToUpdate.categoryId = updates[key];
			} else if (key !== "courseId" && key !== "thumbnailImage") {
				if (key === "price") {
					dataToUpdate[key] = parseFloat(updates[key]);
				} else {
					dataToUpdate[key] = updates[key];
				}
			}
		}

		const updatedCourse = await prisma.course.update({
			where: { id: courseId },
			data: dataToUpdate,
			include: courseIncludeBlock
		});

		res.json({
			success: true,
			message: "Course updated successfully",
			data: formatCourseDetails(updatedCourse),
		});
	} catch (error) {
		console.error("EDIT COURSE CONTROLLER ERROR:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
};

// Get Course List
exports.getAllCourses = async (req, res) => {
	try {
		const allCourses = await prisma.course.findMany({
			where: { status: "Published" },
			include: {
				instructor: true,
				ratingsAndReviews: true,
				enrolledStudents: true,
			}
		});

		return res.status(200).json({
			success: true,
			data: allCourses.map(c => formatCourseDetails(c)),
		});
	} catch (error) {
		console.log(error);
		return res.status(404).json({
			success: false,
			message: `Can't Fetch Course Data`,
			error: error.message,
		});
	}
};

// Get One Single Course Details
exports.getCourseDetails = async (req, res) => {
	try {
		const { courseId } = req.body;
		const courseDetails = await prisma.course.findUnique({
			where: { id: courseId },
			include: {
				instructor: {
					include: { profile: true }
				},
				category: true,
				ratingsAndReviews: true,
				sections: {
					include: {
						subSections: true
					}
				}
			}
		});

		if (!courseDetails) {
			return res.status(400).json({
				success: false,
				message: `Could not find course with id: ${courseId}`,
			});
		}

		let totalDurationInSeconds = 0;
		courseDetails.sections.forEach((content) => {
			content.subSections.forEach((subSection) => {
				const timeDurationInSeconds = parseInt(subSection.timeDuration) || 0;
				totalDurationInSeconds += timeDurationInSeconds;
			});
		});

		const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

		// Hide videoUrls in public details if expected by Mongoose controller
		const detailsForResponse = JSON.parse(JSON.stringify(courseDetails));
		detailsForResponse.sections.forEach((content) => {
			content.subSections.forEach((subSection) => {
				delete subSection.videoUrl;
			});
		});

		return res.status(200).json({
			success: true,
			data: {
				courseDetails: formatCourseDetails(detailsForResponse),
				totalDuration,
			},
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

exports.getFullCourseDetails = async (req, res) => {
	try {
		const { courseId } = req.body;
		const userId = req.user.id;
		
		const courseDetails = await prisma.course.findUnique({
			where: { id: courseId },
			include: courseIncludeBlock
		});

		let courseProgressCount = await prisma.courseProgress.findFirst({
			where: {
				courseId: courseId,
				userId: userId,
			},
			include: {
				completedVideos: true
			}
		});

		console.log("courseProgressCount : ", courseProgressCount);

		if (!courseDetails) {
			return res.status(400).json({
				success: false,
				message: `Could not find course with id: ${courseId}`,
			});
		}

		let totalDurationInSeconds = 0;
		courseDetails.sections.forEach((content) => {
			content.subSections.forEach((subSection) => {
				const timeDurationInSeconds = parseInt(subSection.timeDuration) || 0;
				totalDurationInSeconds += timeDurationInSeconds;
			});
		});

		const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

		return res.status(200).json({
			success: true,
			data: {
				courseDetails: formatCourseDetails(courseDetails),
				totalDuration,
				completedVideos: courseProgressCount ? courseProgressCount.completedVideos.map(v => v.id) : [],
			},
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
	try {
		const instructorId = req.user.id;

		const instructorCourses = await prisma.course.findMany({
			where: {
				instructorId: instructorId,
			},
			include: {
				enrolledStudents: true
			},
			orderBy: {
				createdAt: "desc"
			}
		});

		res.status(200).json({
			success: true,
			data: instructorCourses.map(c => formatCourseDetails(c)),
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: "Failed to retrieve instructor courses",
			error: error.message,
		});
	}
};

// Delete the Course
exports.deleteCourse = async (req, res) => {
	try {
		const { courseId } = req.body;

		// Find the course
		const course = await prisma.course.findUnique({
			where: { id: courseId }
		});
		if (!course) {
			return res.status(404).json({ message: "Course not found" });
		}

		// Cascade delete in PostgreSQL handles unenrolling students, 
		// deleting progress tracker records, deleting sections, subsections, etc.
		await prisma.course.delete({
			where: { id: courseId }
		});

		return res.status(200).json({
			success: true,
			message: "Course deleted successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};