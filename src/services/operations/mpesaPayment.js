import { toast } from "react-hot-toast"
import { apiConnector } from "../apiconnector"
import { studentEndpoints } from "../apis"

const { COURSE_PAYMENT_API } = studentEndpoints

export async function buyCourseWithMpesa(token, paymentData, navigate, dispatch) {
  const toastId = toast.loading("Initiating M-Pesa STK Push...")
  try {
    const response = await apiConnector("POST", COURSE_PAYMENT_API, paymentData, {
      Authorization: `Bearer ${token}`,
    })

    console.log("MPESA_PAYMENT API RESPONSE............", response)

    if (!response.data.success) {
      throw new Error(response.data.message)
    }

    toast.success("STK Push sent successfully! Check your phone to enter your PIN.")
    
  } catch (error) {
    console.log("MPESA_PAYMENT API ERROR............", error)
    toast.error(error.response?.data?.message || "Could not initiate M-Pesa payment.")
  }
  toast.dismiss(toastId)
}