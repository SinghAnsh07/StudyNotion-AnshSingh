const prisma = require("../config/prisma");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

exports.resetPasswordToken = async (req, res) => {
	try {
		const email = req.body.email;
		const user = await prisma.user.findUnique({
			where: { email: email }
		});
		if (!user) {
			return res.json({
				success: false,
				message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
			});
		}
		const token = crypto.randomBytes(20).toString("hex");

		const updatedDetails = await prisma.user.update({
			where: { email: email },
			data: {
				token: token,
				resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour
			}
		});
		console.log("DETAILS", updatedDetails);

		const url = `${process.env.FRONTEND_URL || "http://localhost:3000"}/update-password/${token}`;

		await mailSender(
			email,
			"Password Reset",
			`Your Link for email verification is ${url}. Please click this url to reset your password.`
		);

		res.json({
			success: true,
			message:
				"Email Sent Successfully, Please Check Your Email to Continue Further",
		});
	} catch (error) {
		return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Sending the Reset Message`,
		});
	}
};

exports.resetPassword = async (req, res) => {
	try {
		const { password, confirmPassword, token } = req.body;

		if (confirmPassword !== password) {
			return res.json({
				success: false,
				message: "Password and Confirm Password Does not Match",
			});
		}

		const userDetails = await prisma.user.findFirst({
			where: { token: token }
		});
		if (!userDetails) {
			return res.json({
				success: false,
				message: "Token is Invalid",
			});
		}

		if (!userDetails.resetPasswordExpires || userDetails.resetPasswordExpires < new Date()) {
			return res.status(403).json({
				success: false,
				message: `Token is Expired, Please Regenerate Your Token`,
			});
		}

		const encryptedPassword = await bcrypt.hash(password, 10);
		await prisma.user.update({
			where: { id: userDetails.id },
			data: { password: encryptedPassword }
		});

		res.json({
			success: true,
			message: `Password Reset Successful`,
		});
	} catch (error) {
		return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Updating the Password`,
		});
	}
};