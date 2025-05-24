"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ExpenseCategoryType, ExpenseByCategoryChartProps } from './ExpenseByCategoryChart.types';

const DEFAULT_DATA: ExpenseCategoryType[] = [
  { name: 'Combustible', value: 450000, color: '#0ea5e9' },
  { name: 'Mantenimiento', value: 300000, color: '#6366f1' },
  { name: 'Viáticos', value: 180000, color: '#84cc16' },
  { name: 'Peajes', value: 150000, color: '#ec4899' },
  { name: 'Otros', value: 178450, color: '#f97316' },
];

const COLORS = ['#0ea5e9', '#6366f1', '#84cc16', '#ec4899', '#f97316'];

const formatNumber = (number: number) => {
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(number);
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm">{formatNumber(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export function ExpenseByCategoryChart({ 
  data = DEFAULT_DATA, 
  height = 300 
}: ExpenseByCategoryChartProps) {
  return (
    <div className="h-[300px] w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={90}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            formatter={(value: string, entry: any, index: number) => (
              <span className="text-sm">
                {value}: {formatNumber(data[index].value)}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 