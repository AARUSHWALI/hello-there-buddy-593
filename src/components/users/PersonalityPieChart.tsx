
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface PersonalityScores {
  extraversion: number;
  agreeableness: number;
  openness: number;
  neuroticism: number;
  conscientiousness: number;
}

interface PersonalityPieChartProps {
  scores: PersonalityScores;
}

export default function PersonalityPieChart({ scores }: PersonalityPieChartProps) {
  const data = [
    { name: "Extroversion", value: scores.extraversion, color: "#8B5CF6" }, // Purple
    { name: "Agreeableness", value: scores.agreeableness, color: "#10B981" }, // Green
    { name: "Openness", value: scores.openness, color: "#3B82F6" }, // Blue
    { name: "Neuroticism", value: scores.neuroticism, color: "#F59E0B" }, // Amber
    { name: "Conscientiousness", value: scores.conscientiousness, color: "#EC4899" }, // Pink
  ];

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `${value}%`} 
            contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            itemStyle={{ color: "#333" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
