import React, { useEffect, useState } from "react"
import ReactStars from "react-rating-stars-component"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import "swiper/css/free-mode"
import "swiper/css/pagination"
import { Autoplay, FreeMode, Pagination } from "swiper/modules"
import { FaStar } from "react-icons/fa"
import { apiConnector } from "../../services/apiconnector"
import { ratingsEndpoints } from "../../services/apis"

function ReviewSlider() {
  const [reviews, setReviews] = useState([])
  const truncateWords = 20

  useEffect(() => {
    ; (async () => {
      const { data } = await apiConnector(
        "GET",
        ratingsEndpoints.REVIEWS_DETAILS_API
      )
      if (data?.success) {
        setReviews(data?.data)
      }
    })()
  }, [])

  return (
    <div className="my-10 w-full px-4 text-white">
      <h2 className="mb-6 text-center text-3xl font-bold text-yellow-100">
        What Learners Say 💬
      </h2>

      <Swiper
        slidesPerView={1}
        spaceBetween={20}
        breakpoints={{
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 4 },
        }}
        loop={true}
        freeMode={true}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        modules={[FreeMode, Pagination, Autoplay]}
        className="w-full"
      >
        {reviews.map((review, index) => (
          <SwiperSlide key={index}>
            <div className="flex h-full flex-col justify-between gap-4 rounded-lg border border-richblack-700 bg-richblack-800 p-5 shadow-md transition-transform duration-300 hover:scale-[1.02]">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <img
                  src={
                    review?.user?.image
                      ? review.user.image
                      : `https://api.dicebear.com/5.x/initials/svg?seed=${review?.user?.firstName} ${review?.user?.lastName}`
                  }
                  alt="user"
                  className="h-10 w-10 rounded-full object-cover border border-yellow-200"
                />
                <div>
                  <h3 className="font-semibold text-richblack-5">
                    {review.user?.firstName} {review.user?.lastName}
                  </h3>
                  <p className="text-xs text-richblack-300">
                    {review.course?.courseName}
                  </p>
                </div>
              </div>

              {/* Review Text */}
              <p className="text-sm text-richblack-100 line-clamp-4">
                {review?.review.split(" ").length > truncateWords
                  ? review?.review.split(" ").slice(0, truncateWords).join(" ") + "..."
                  : review?.review}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-yellow-100">
                  {review.rating.toFixed(1)}
                </span>
                <ReactStars
                  count={5}
                  value={review.rating}
                  size={20}
                  edit={false}
                  activeColor="#facc15"
                  emptyIcon={<FaStar />}
                  fullIcon={<FaStar />}
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default ReviewSlider
