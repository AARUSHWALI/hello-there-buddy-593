
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface CandidateStatusProps {
  approvedCount: number;
  reviewCount: number;
  rejectedCount: number;
}

export default function CandidateStatus({
  approvedCount = 45,
  reviewCount = 30,
  rejectedCount = 25,
}: CandidateStatusProps) {
  const data = [
    { name: "Approved", value: approvedCount, color: "#9b87f5" },
    { name: "Under Review", value: reviewCount, color: "#4da3ff" },
    { name: "Rejected", value: rejectedCount, color: "#ff6b6b" },
  ];
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.15 ? (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
        <h2 className="text-xl font-bold text-gray-800">Candidate Status</h2>
      </div>
      <div className="p-5">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                innerRadius={40}
                dataKey="value"
                strokeWidth={5}
                stroke="#ffffff"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value}`, 'Count']}
                contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              />
              <Legend verticalAlign="bottom" align="center" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mt-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-500">{approvedCount}</div>
            <div className="text-gray-600">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">{reviewCount}</div>
            <div className="text-gray-600">Under Review</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500">{rejectedCount}</div>
            <div className="text-gray-600">Rejected</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-6 justify-center">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-sm text-gray-700 font-medium">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
