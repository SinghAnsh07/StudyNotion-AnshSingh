const { instance } = require("../config/razorpay");
const prisma = require("../config/prisma");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const crypto = require("crypto");

// Initiate the razorpay order
exports.capturePayment = async (req, res) => {
	const { courses } = req.body;
	const userId = req.user.id;

	if (!courses || courses.length === 0) {
		return res.json({ success: false, message: "Please provide Course Id" });
	}

	let totalAmount = 0;

	for (const course_id of courses) {
		try {
			const course = await prisma.course.findUnique({
				where: { id: course_id }
			});
			if (!course) {
				return res.status(200).json({ success: false, message: "Could not find the course" });
			}

			// Check if student is already enrolled
			const isEnrolled = await prisma.course.findFirst({
				where: {
					id: course_id,
					enrolledStudents: {
						some: { id: userId }
					}
				}
			});

			if (isEnrolled) {
				return res.status(200).json({ success: false, message: "Student is already Enrolled" });
			}

			totalAmount += course.price;
		} catch (error) {
			console.log(error);
			return res.status(500).json({ success: false, message: error.message });
		}
	}

	const currency = "INR";
	const options = {
		amount: Math.round(totalAmount * 100),
		currency,
		receipt: Math.random(Date.now()).toString(),
	};

	try {
		const paymentResponse = await instance.orders.create(options);
		res.json({
			success: true,
			message: paymentResponse,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: "Could not Initiate Order" });
	}
};

// Verify the payment
exports.verifyPayment = async (req, res) => {
	const razorpay_order_id = req.body?.razorpay_order_id;
	const razorpay_payment_id = req.body?.razorpay_payment_id;
	const razorpay_signature = req.body?.razorpay_signature;
	const courses = req.body?.courses;
	const userId = req.user.id;

	if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || !userId) {
		return res.status(200).json({ success: false, message: "Payment Failed" });
	}

	let body = razorpay_order_id + "|" + razorpay_payment_id;
	const expectedSignature = crypto
		.createHmac("sha256", process.env.RAZORPAY_SECRET)
		.update(body.toString())
		.digest("hex");

	if (expectedSignature === razorpay_signature) {
		// Enroll the student
		await enrollStudents(courses, userId, res);
		return res.status(200).json({ success: true, message: "Payment Verified" });
	}
	return res.status(200).json({ success: "false", message: "Payment Failed" });
};

const enrollStudents = async (courses, userId, res) => {
	if (!courses || !userId) {
		return res.status(400).json({ success: false, message: "Please Provide data for Courses or UserId" });
	}

	for (const courseId of courses) {
		try {
			// Find the course and enroll the student in it by updating the relation
			const enrolledCourse = await prisma.course.update({
				where: { id: courseId },
				data: {
					enrolledStudents: {
						connect: { id: userId }
					}
				}
			});

			if (!enrolledCourse) {
				return res.status(500).json({ success: false, message: "Course not Found" });
			}

			// Find the student details to send email
			const enrolledStudent = await prisma.user.findUnique({
				where: { id: userId }
			});

			// Send enrollment email
			await mailSender(
				enrolledStudent.email,
				`Successfully Enrolled into ${enrolledCourse.courseName}`,
				courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`)
			);
		} catch (error) {
			console.log(error);
			return res.status(500).json({ success: false, message: error.message });
		}
	}
};

exports.sendPaymentSuccessEmail = async (req, res) => {
	const { orderId, paymentId, amount } = req.body;
	const userId = req.user.id;

	if (!orderId || !paymentId || !amount || !userId) {
		return res.status(400).json({ success: false, message: "Please provide all the fields" });
	}

	try {
		const enrolledStudent = await prisma.user.findUnique({
			where: { id: userId }
		});
		
		await mailSender(
			enrolledStudent.email,
			`Payment Recieved`,
			paymentSuccessEmail(`${enrolledStudent.firstName}`, amount / 100, orderId, paymentId)
		);
	} catch (error) {
		console.log("error in sending mail", error);
		return res.status(500).json({ success: false, message: "Could not send email" });
	}
};