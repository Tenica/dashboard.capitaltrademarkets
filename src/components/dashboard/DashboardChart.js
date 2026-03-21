import React, { useContext } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ThemeContext } from '../../context/ThemeContext';

const DashboardChart = ({ isAdmin, chartData = [] }) => {
  const { theme } = useContext(ThemeContext);
  
  // Use either adminRevenue or userProfit based on what the backend provides, 
  // or just use 'value' if it's normalized as I did in my history controller.
  const dataKey = chartData.length > 0 && chartData[0].value !== undefined ? 'value' : (isAdmin ? 'adminRevenue' : 'userProfit');
  const color = theme === 'dark' ? '#f59e0b' : '#6366f1';
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <div style={{ width: '100%', height: 300 }}>
      {chartData.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: textColor, fontSize: '0.9rem' }}>
          No data records for this period.
        </div>
      ) : (
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor }} dy={10} fontSize={12} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor }} tickFormatter={(val) => `$${Number(val).toLocaleString()}`} fontSize={11} width={80} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                border: `1px solid ${gridColor}`,
                borderRadius: '12px',
                color: theme === 'dark' ? '#fff' : '#000',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                fontSize: '0.85rem'
              }}
              formatter={(val) => [`$${Number(val).toLocaleString()}`, isAdmin ? 'Platform AUM' : 'Total Equity']}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
export default DashboardChart;
