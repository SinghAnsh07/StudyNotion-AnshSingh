const prisma = require("../config/prisma");

exports.updateCourseProgress = async (req, res) => {
	try {
		const { courseId, subsectionId } = req.body;
		const userId = req.user.id;

		// Check if the subsection exists
		const subSection = await prisma.subSection.findUnique({
			where: { id: subsectionId }
		});
		if (!subSection) {
			return res.status(404).json({ success: false, message: "Invalid subsection ID" });
		}

		let courseProgress = await prisma.courseProgress.findFirst({
			where: {
				courseId: courseId,
				userId: userId,
			},
			include: {
				completedVideos: true
			}
		});

		if (!courseProgress) {
			// Automatically create course progress if it doesn't exist
			courseProgress = await prisma.courseProgress.create({
				data: {
					courseId: courseId,
					userId: userId,
				},
				include: {
					completedVideos: true
				}
			});
		}

		// Check if already completed
		const alreadyCompleted = courseProgress.completedVideos.some(v => v.id === subsectionId);
		if (alreadyCompleted) {
			return res.status(400).json({ success: false, message: "Lecture already completed" });
		}

		// Add the subsection connection
		await prisma.courseProgress.update({
			where: { id: courseProgress.id },
			data: {
				completedVideos: {
					connect: { id: subsectionId }
				}
			}
		});

		return res.status(200).json({
			success: true,
			message: "Lecture marked as completed",
		});
	} catch (error) {
		console.error("UPDATE_COURSE_PROGRESS ERROR:", error);
		return res.status(500).json({
			success: false,
			message: "Something went wrong while updating course progress",
		});
	}
};