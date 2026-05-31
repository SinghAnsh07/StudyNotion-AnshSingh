const prisma = require("../config/prisma");

// createRating
exports.createRating = async (req, res) => {
	try {
		// get user id
		const userId = req.user.id;
		// fetch data from req body
		const { rating, review, courseId } = req.body;

		// check if user is enrolled or not
		const isEnrolled = await prisma.course.findFirst({
			where: {
				id: courseId,
				enrolledStudents: {
					some: { id: userId }
				}
			}
		});

		if (!isEnrolled) {
			return res.status(404).json({
				success: false,
				message: 'Student is not enrolled in the course',
			});
		}

		// check if user already reviewed the course (using relation compound unique constraint)
		const alreadyReviewed = await prisma.ratingAndReview.findUnique({
			where: {
				userId_courseId: {
					userId: userId,
					courseId: courseId
				}
			}
		});

		if (alreadyReviewed) {
			return res.status(403).json({
				success: false,
				message: 'Course is already reviewed by the user',
			});
		}

		// create rating and review
		const ratingReview = await prisma.ratingAndReview.create({
			data: {
				rating: parseInt(rating),
				review,
				courseId: courseId,
				userId: userId,
			}
		});

		// return response
		return res.status(200).json({
			success: true,
			message: "Rating and Review created Successfully",
			ratingReview,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// getAverageRating
exports.getAverageRating = async (req, res) => {
	try {
		// get course ID
		const courseId = req.body.courseId;

		// calculate avg rating using Prisma aggregation
		const result = await prisma.ratingAndReview.aggregate({
			where: {
				courseId: courseId
			},
			_avg: {
				rating: true
			}
		});

		// return rating
		if (result._avg.rating !== null) {
			return res.status(200).json({
				success: true,
				averageRating: result._avg.rating,
			});
		}

		// if no rating/Review exist
		return res.status(200).json({
			success: true,
			message: 'Average Rating is 0, no ratings given till now',
			averageRating: 0,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// getAllRatingAndReviews
exports.getAllRating = async (req, res) => {
	try {
		const allReviews = await prisma.ratingAndReview.findMany({
			orderBy: {
				rating: "desc"
			},
			include: {
				user: {
					select: {
						firstName: true,
						lastName: true,
						email: true,
						image: true,
					}
				},
				course: {
					select: {
						courseName: true
					}
				}
			}
		});

		return res.status(200).json({
			success: true,
			message: "All reviews fetched successfully",
			data: allReviews,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};