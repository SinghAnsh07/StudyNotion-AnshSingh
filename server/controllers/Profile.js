const prisma = require("../config/prisma");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");

// Helper to format user details to match Mongoose populated structure
const formatUserDetails = (user) => {
	if (!user) return null;
	const formatted = {
		...user,
		_id: user.id, // Mongoose compatibility
		additionalDetails: user.profile ? {
			...user.profile,
			_id: user.profile.id // Mongoose compatibility
		} : null
	};
	delete formatted.profile;
	delete formatted.password;
	return formatted;
};

// Method for updating a profile
exports.updateProfile = async (req, res) => {
	try {
		const {
			firstName = "",
			lastName = "",
			dateOfBirth = "",
			about = "",
			contactNumber = "",
			gender = "",
		} = req.body;
		const id = req.user.id;

		// Update both user details and profile details in one query
		const updatedUserDetails = await prisma.user.update({
			where: { id: id },
			data: {
				firstName,
				lastName,
				profile: {
					update: {
						dateOfBirth,
						about,
						contactNumber,
						gender
					}
				}
			},
			include: {
				profile: true
			}
		});

		return res.json({
			success: true,
			message: "Profile updated successfully",
			updatedUserDetails: formatUserDetails(updatedUserDetails),
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};

exports.deleteAccount = async (req, res) => {
	try {
		const id = req.user.id;
		console.log(id);

		const user = await prisma.user.findUnique({
			where: { id: id }
		});
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Cascade delete in PostgreSQL handles associated profile, 
		// courseProgress, enrollments etc. automatically because of schema declarations.
		await prisma.user.delete({
			where: { id: id }
		});

		res.status(200).json({
			success: true,
			message: "User deleted successfully",
		});
	} catch (error) {
		console.log(error);
		res
			.status(500)
			.json({ success: false, message: "User Cannot be deleted successfully" });
	}
};

exports.getAllUserDetails = async (req, res) => {
	try {
		const id = req.user.id;
		const userDetails = await prisma.user.findUnique({
			where: { id: id },
			include: { profile: true }
		});

		console.log(userDetails);
		res.status(200).json({
			success: true,
			message: "User Data fetched successfully",
			data: formatUserDetails(userDetails),
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

exports.updateDisplayPicture = async (req, res) => {
	try {
		const displayPicture = req.files.displayPicture;
		const userId = req.user.id;
		
		const image = await uploadImageToCloudinary(
			displayPicture,
			process.env.FOLDER_NAME,
			1000,
			1000
		);
		console.log(image);

		const updatedProfile = await prisma.user.update({
			where: { id: userId },
			data: { image: image.secure_url },
			include: { profile: true }
		});

		res.send({
			success: true,
			message: `Image Updated successfully`,
			data: formatUserDetails(updatedProfile),
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

exports.getEnrolledCourses = async (req, res) => {
	try {
		const userId = req.user.id;
		
		const userDetails = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				enrolledCourses: {
					include: {
						ratingsAndReviews: true,
						sections: {
							include: {
								subSections: true
							}
						}
					}
				}
			}
		});

		if (!userDetails) {
			return res.status(400).json({
				success: false,
				message: `Could not find user with id: ${userId}`,
			});
		}

		const courses = userDetails.enrolledCourses || [];
		const formattedCourses = [];

		for (let i = 0; i < courses.length; i++) {
			const course = courses[i];
			let totalDurationInSeconds = 0;
			let subsectionLength = 0;

			// Format sections mapping
			const courseContent = (course.sections || []).map(s => {
				const formattedSec = {
					...s,
					_id: s.id, // Mongoose compatibility
					subSection: (s.subSections || []).map(sub => ({
						...sub,
						_id: sub.id // Mongoose compatibility
					}))
				};
				delete formattedSec.subSections;
				return formattedSec;
			});

			// Calculate durations and counts
			for (let j = 0; j < courseContent.length; j++) {
				const section = courseContent[j];
				totalDurationInSeconds += section.subSection.reduce((acc, curr) => acc + (parseInt(curr.timeDuration) || 0), 0);
				subsectionLength += section.subSection.length;
			}

			const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

			// Fetch course progress
			const courseProgress = await prisma.courseProgress.findFirst({
				where: {
					courseId: course.id,
					userId: userId,
				},
				include: {
					completedVideos: true
				}
			});

			const courseProgressCount = courseProgress?.completedVideos.length || 0;
			let progressPercentage = 0;
			if (subsectionLength === 0) {
				progressPercentage = 100;
			} else {
				const multiplier = Math.pow(10, 2);
				progressPercentage = Math.round((courseProgressCount / subsectionLength) * 100 * multiplier) / multiplier;
			}

			const courseObj = {
				...course,
				_id: course.id, // Include _id fallback for frontend Swiper / course display
				ratingAndReviews: course.ratingsAndReviews || [],
				courseContent,
				totalDuration,
				progressPercentage
			};
			delete courseObj.sections;
			delete courseObj.ratingsAndReviews;
			formattedCourses.push(courseObj);
		}

		return res.status(200).json({
			success: true,
			data: formattedCourses,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

exports.instructorDashboard = async (req, res) => {
	try {
		const courseDetails = await prisma.course.findMany({
			where: { instructorId: req.user.id },
			include: {
				enrolledStudents: true
			}
		});

		const courseData = courseDetails.map((course) => {
			const totalStudentsEnrolled = course.enrolledStudents?.length || 0;
			const totalAmountGenerated = totalStudentsEnrolled * (course.price || 0);

			return {
				id: course.id,
				_id: course.id, // Mongoose compatibility
				courseName: course.courseName,
				courseDescription: course.courseDescription,
				totalStudentsEnrolled,
				totalAmountGenerated,
			};
		});

		res.status(200).json({
			success: true,
			courses: courseData,
		});
	} catch (error) {
		console.error("INSTRUCTOR DASHBOARD ERROR:", error);
		res.status(500).json({
			success: false,
			message: "Server Error: Unable to fetch instructor dashboard data",
		});
	}
};