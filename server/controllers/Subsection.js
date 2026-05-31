const prisma = require("../config/prisma");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// Helper to format section to match Mongoose populated structure
const formatSection = (section) => {
	if (!section) return null;
	const formatted = {
		...section,
		_id: section.id, // Mongoose compatibility
		subSection: (section.subSections || []).map(sub => ({
			...sub,
			_id: sub.id // Mongoose compatibility
		}))
	};
	delete formatted.subSections;
	return formatted;
};

// Create a new sub-section for a given section
exports.createSubSection = async (req, res) => {
	try {
		// Extract necessary information from the request body
		const { sectionId, title, description } = req.body;
		const video = req.files.video;

		// Check if all necessary fields are provided
		if (!sectionId || !title || !description || !video) {
			return res
				.status(404)
				.json({ success: false, message: "All Fields are Required" });
		}
		console.log(video);

		// Upload the video file to Cloudinary
		const uploadDetails = await uploadImageToCloudinary(
			video,
			process.env.FOLDER_NAME
		);
		console.log(uploadDetails);

		// Create a new sub-section
		await prisma.subSection.create({
			data: {
				title: title,
				timeDuration: `${uploadDetails.duration}`,
				description: description,
				videoUrl: uploadDetails.secure_url,
				sectionId: sectionId,
			}
		});

		// Update and fetch the corresponding section with the newly created sub-section
		const updatedSection = await prisma.section.findUnique({
			where: { id: sectionId },
			include: {
				subSections: true
			}
		});

		// Return the updated section in the response
		return res.status(200).json({
			success: true,
			data: formatSection(updatedSection)
		});
	} catch (error) {
		console.error("Error creating new sub-section:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
};

exports.updateSubSection = async (req, res) => {
	try {
		const { sectionId, subSectionId, title, description } = req.body;
		const subSection = await prisma.subSection.findUnique({
			where: { id: subSectionId }
		});

		if (!subSection) {
			return res.status(404).json({
				success: false,
				message: "SubSection not found",
			});
		}

		let videoUrl = subSection.videoUrl;
		let timeDuration = subSection.timeDuration;

		if (req.files && req.files.video !== undefined) {
			const video = req.files.video;
			const uploadDetails = await uploadImageToCloudinary(
				video,
				process.env.FOLDER_NAME
			);
			videoUrl = uploadDetails.secure_url;
			timeDuration = `${uploadDetails.duration}`;
		}

		await prisma.subSection.update({
			where: { id: subSectionId },
			data: {
				title: title !== undefined ? title : subSection.title,
				description: description !== undefined ? description : subSection.description,
				videoUrl: videoUrl,
				timeDuration: timeDuration
			}
		});

		const updatedSection = await prisma.section.findUnique({
			where: { id: sectionId },
			include: {
				subSections: true
			}
		});

		return res.json({
			success: true,
			data: formatSection(updatedSection),
			message: "Section updated successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: "An error occurred while updating the section",
		});
	}
};

exports.deleteSubSection = async (req, res) => {
	try {
		const { subSectionId, sectionId } = req.body;

		const subSection = await prisma.subSection.findUnique({
			where: { id: subSectionId }
		});

		if (!subSection) {
			return res
				.status(404)
				.json({ success: false, message: "SubSection not found" });
		}

		await prisma.subSection.delete({
			where: { id: subSectionId }
		});

		const updatedSection = await prisma.section.findUnique({
			where: { id: sectionId },
			include: {
				subSections: true
			}
		});

		return res.json({
			success: true,
			data: formatSection(updatedSection),
			message: "SubSection deleted successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: "An error occurred while deleting the SubSection",
		});
	}
};