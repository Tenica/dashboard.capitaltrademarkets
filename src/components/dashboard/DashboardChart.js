import React, { useContext } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ThemeContext } from '../../context/ThemeContext';

const data = [
  { name: 'Jul', userProfit: 4000, adminRevenue: 24000 },
  { name: 'Aug', userProfit: 3000, adminRevenue: 32000 },
  { name: 'Sep', userProfit: 6000, adminRevenue: 45000 },
  { name: 'Oct', userProfit: 8000, adminRevenue: 52000 },
  { name: 'Nov', userProfit: 12000, adminRevenue: 60000 },
  { name: 'Dec', userProfit: 15000, adminRevenue: 75000 },
  { name: 'Jan', userProfit: 18000, adminRevenue: 90000 },
];

const DashboardChart = ({ isAdmin }) => {
  const { theme } = useContext(ThemeContext);
  const dataKey = isAdmin ? 'adminRevenue' : 'userProfit';
  const color = theme === 'dark' ? '#f59e0b' : '#6366f1';
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor }} tickFormatter={(val) => `$${val/1000}k`} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              color: theme === 'dark' ? '#fff' : '#000',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
export default DashboardChart;
