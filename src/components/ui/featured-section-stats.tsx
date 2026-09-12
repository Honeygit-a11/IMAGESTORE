"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";

export interface StatItem {
  value: string;
  label: string;
}

export interface StorageBarItem {
  name: string;
  mb: number;
  fill?: string;
}

export interface FeaturedSectionStatsProps {
  id?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  stats?: StatItem[];
  barData?: StorageBarItem[];
}

export default function FeaturedSectionStats({
  id,
  className = "",
  title = "Your storage, clearly explained.",
  subtitle = "500 MB shared across your workspaces, including recoverable files in Trash.",
  stats = [
    { value: "350 MB", label: "Total Storage Used (70%)" },
    { value: "280 MB", label: "Active Workspace Images" },
    { value: "70 MB", label: "Trash (30-day retention)" },
    { value: "150 MB", label: "Available for Uploads" },
  ],
  barData = [
    { name: "Total Storage Used", mb: 350, fill: "#3b82f6" },
    { name: "Active Workspace Images", mb: 280, fill: "#2563eb" },
    { name: "Trash", mb: 70, fill: "#f59e0b" },
    { name: "Available for Uploads", mb: 150, fill: "#10b981" },
  ],
}: FeaturedSectionStatsProps = {}) {
  return (
    <section id={id} className={`w-full max-w-6xl mx-auto text-left py-8 sm:py-12 lg:py-16 ${className}`}>
      <div className="px-4">
        <h3 className="text-lg sm:text-xl lg:text-4xl font-medium text-gray-900 dark:text-white mb-8 text-center max-w-4xl mx-auto">
          {title}{" "}
          <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base lg:text-4xl">
            {subtitle}
          </span>
        </h3>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-4">
          {stats.map((stat, idx) => (
            <div key={idx}>
              <p className="text-3xl font-medium text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-gray-500 dark:text-gray-400 text-md">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Storage Bar Chart */}
      <div className="w-full h-72 sm:h-80 mt-6 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={barData}
            margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(113, 113, 122, 0.15)"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 12 }}
              interval={0}
            />
            <YAxis
              domain={[0, 500]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 12 }}
              unit=" MB"
            />
            <Tooltip
              cursor={{ fill: "rgba(113, 113, 122, 0.08)" }}
              formatter={(val: any) => [`${val} MB`, "Allocation"]}
              contentStyle={{
                backgroundColor: "rgba(24, 24, 27, 0.95)",
                borderColor: "rgba(63, 63, 70, 0.5)",
                borderRadius: "8px",
                color: "#ffffff",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
              }}
            />
            <Bar dataKey="mb" radius={[8, 8, 0, 0]} maxBarSize={64}>
              {barData.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={entry.fill || "#3b82f6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
