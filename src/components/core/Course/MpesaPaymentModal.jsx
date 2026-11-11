import React, { useState } from "react"
import { RxCross2 } from "react-icons/rx"
import { MdPhoneAndroid } from "react-icons/md" // Replaced SiMpesa
import { toast } from "react-hot-toast"

export default function MpesaPaymentModal({ course, onClose, onConfirm }) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate Kenyan phone number format (e.g. 07XXXXXXXX or 01XXXXXXXX)
    const phoneRegex = /^(?:254|\+254|0)?([17][0-9]{8})$/
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("Please enter a valid Safaricom phone number (e.g., 0712345678)")
      return
    }

    // Format phone number to 2547XXXXXXXX backend standard
    let formattedPhone = phoneNumber.replace(/^0/, "254").replace(/^\+/, "")

    setLoading(true)
    await onConfirm(formattedPhone)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-white bg-opacity-10 backdrop-blur-sm">
      <div className="w-11/12 max-w-[450px] rounded-lg border border-richblack-400 bg-richblack-800 p-6 text-richblack-5 shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-richblack-700 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-green-600 text-white text-xl font-bold">
              <MdPhoneAndroid />
            </div>
            <div>
              <p className="text-xl font-semibold text-richblack-5">Lipa na M-Pesa</p>
              <p className="text-xs text-richblack-300">Instant STK Push Checkout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-richblack-300 hover:text-richblack-5 transition-colors"
          >
            <RxCross2 size={24} />
          </button>
        </div>

        {/* Course Summary */}
        <div className="my-4 rounded-md bg-richblack-900 p-4 border border-richblack-700">
          <p className="text-sm font-medium text-richblack-300">Course:</p>
          <p className="text-base font-semibold text-richblack-5 truncate">{course?.courseName}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-richblack-300">Total Amount:</span>
            <span className="text-lg font-bold text-yellow-50">Ksh. {course?.price}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-richblack-5">
              M-Pesa Phone Number <sup className="text-pink-200">*</sup>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 0712345678"
              required
              className="w-full rounded-md bg-richblack-900 p-3 text-richblack-5 border border-richblack-700 outline-none focus:border-yellow-50 transition-all"
            />
            <p className="mt-1 text-xs text-richblack-400">
              An STK push prompt will be sent to this phone to enter your PIN.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex items-center justify-end gap-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer rounded-md bg-richblack-700 px-5 py-2 font-semibold text-richblack-200 hover:bg-richblack-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center rounded-md bg-yellow-50 px-6 py-2 font-semibold text-richblack-900 hover:bg-yellow-100 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-richblack-900 border-t-transparent" />
              ) : (
                "Pay Now"
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}