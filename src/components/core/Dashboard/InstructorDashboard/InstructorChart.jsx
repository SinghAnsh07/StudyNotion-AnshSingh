import { useState } from "react"
import { Chart, ArcElement, Tooltip, Legend } from "chart.js"
import { Pie } from "react-chartjs-2"

Chart.register(ArcElement, Tooltip, Legend)

export default function InstructorChart({ courses }) {
  const [currChart, setCurrChart] = useState("students")

  const generateGradientColors = () => {
    const baseColors = [
      "#FF6384", "#36A2EB", "#FFCE56", "#8E44AD", "#27AE60",
      "#E67E22", "#1ABC9C", "#E74C3C", "#3498DB", "#F1C40F"
    ]
    return baseColors.slice(0, courses.length)
  }

  const chartData = (type) => ({
    labels: courses.map((course) => course.courseName),
    datasets: [
      {
        label: type === "students" ? "Students Enrolled" : "Revenue (₹)",
        data: courses.map((course) =>
          type === "students" ? course.totalStudentsEnrolled : course.totalAmountGenerated
        ),
        backgroundColor: generateGradientColors(),
        borderColor: "#111827",
        borderWidth: 3,
        hoverOffset: 15,
        hoverBorderColor: "#ffffff",
      },
    ],
  })

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#f0f0f0",
          font: { size: 12 },
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#fff",
        bodyColor: "#d1d5db",
        borderColor: "#6b7280",
        borderWidth: 1,
        padding: 10,
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  }

  return (
    <div className="flex flex-col flex-1 rounded-xl bg-richblack-800 p-6 shadow-xl">
      <h2 className="text-lg font-bold text-richblack-5 mb-3">📊 Visual Insights</h2>

      <div className="flex gap-3 mb-5">
        <button
          className={`px-4 py-1 rounded-md transition ${currChart === "students"
              ? "bg-yellow-50 text-black font-bold"
              : "bg-richblack-700 text-yellow-400 hover:bg-richblack-600"
            }`}
          onClick={() => setCurrChart("students")}
        >
          👥 Students
        </button>
        <button
          className={`px-4 py-1 rounded-md transition ${currChart === "income"
              ? "bg-yellow-50 text-black font-bold"
              : "bg-richblack-700 text-yellow-400 hover:bg-richblack-600"
            }`}
          onClick={() => setCurrChart("income")}
        >
          💰 Income
        </button>
      </div>

      <div className="relative h-[350px] w-full transition-transform duration-300 hover:scale-[1.02]">
        <Pie data={chartData(currChart)} options={options} />
      </div>
    </div>
  )
}
