const { initiateStkPush } = require("../services/mpesa");
const prisma = require("../config/prisma");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");

// Trigger STK Push (Initiate payment)
exports.payWithMpesa = async (req, res) => {
    try {
        const { userId, courseId, phoneNumber, amount } = req.body;

        // Format phone number to start with 254...
        let formattedPhone = phoneNumber.replace(/^0/, "254").replace(/^\+/, "");

        const stkResponse = await initiateStkPush({
            phoneNumber: formattedPhone,
            amount,
            accountReference: `Course-${courseId}`,
            transactionDesc: "StudyNotion Course Payment",
        });

        if (stkResponse.ResponseCode === "0") {
            // Save initial payment record with status Pending
            await prisma.payment.create({
                data: {
                    checkoutRequestID: stkResponse.CheckoutRequestID,
                    merchantRequestID: stkResponse.MerchantRequestID,
                    amount: parseFloat(amount),
                    phoneNumber: formattedPhone,
                    status: "Pending",
                    userId,
                    courseId,
                },
            });

            return res.status(200).json({
                success: true,
                message: "STK push initiated successfully. Check your phone.",
                checkoutRequestID: stkResponse.CheckoutRequestID,
            });
        } else {
            return res.status(400).json({ success: false, message: "Failed to initiate M-Pesa payment." });
        }
    } catch (error) {
        console.error("M-Pesa Init Error:", error.response?.data || error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Handle Safaricom Callback Webhook
exports.mpesaCallback = async (req, res) => {
    try {
        const callbackData = req.body.Body?.stkCallback;
        if (!callbackData) {
            return res.status(400).json({ message: "Invalid callback structure" });
        }

        console.log("Received M-Pesa Callback:", JSON.stringify(callbackData, null, 2));

        const checkoutRequestID = callbackData.CheckoutRequestID;
        const resultCode = callbackData.ResultCode;
        const resultDesc = callbackData.ResultDesc;

        const payment = await prisma.payment.findUnique({
            where: { checkoutRequestID },
            include: { user: true, course: true },
        });
        console.log("Payment Record Found:", payment);

        if (!payment) {
            return res.status(404).json({ message: "Payment transaction not found." });
        }

        if (resultCode === 0) {
            // Successful Transaction
            const metadataItems = callbackData.CallbackMetadata?.Item || [];
            let mpesaReceiptNumber = "";

            metadataItems.forEach((item) => {
                if (item.Name === "MpesaReceiptNumber") {
                    mpesaReceiptNumber = item.Value;
                }
            });

            // Update payment status and automatically enroll student into the course
            await prisma.$transaction([
                prisma.payment.update({
                    where: { checkoutRequestID },
                    data: {
                        status: "Completed",
                        mpesaReceiptNumber,
                        resultDesc,
                    },
                }),
                prisma.course.update({
                    where: { id: payment.courseId },
                    data: {
                        enrolledStudents: {
                            connect: { id: payment.userId },
                        },
                    },
                }),
            ]);

            // Send Email Notifications (Enrollment + Payment Success)
            try {
                await mailSender(
                    payment.user.email,
                    `Successfully Enrolled into ${payment.course.courseName}`,
                    courseEnrollmentEmail(payment.course.courseName, payment.user.firstName)
                );

                await mailSender(
                    payment.user.email,
                    `Payment Received - StudyNotion`,
                    paymentSuccessEmail(
                        payment.user.firstName,
                        payment.amount,
                        mpesaReceiptNumber,
                        checkoutRequestID
                    )
                );
            } catch (emailError) {
                console.error("Error sending M-Pesa notification emails:", emailError);
            }

        } else {
            // Cancelled or Failed Transaction
            await prisma.payment.update({
                where: { checkoutRequestID },
                data: {
                    status: resultCode === 1032 ? "Cancelled" : "Failed",
                    resultDesc,
                },
            });
        }

        return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    } catch (error) {
        console.error("Callback Error:", error);
        return res.status(500).json({ ResultCode: 1, ResultDesc: "Internal Server Error" });
    }
};