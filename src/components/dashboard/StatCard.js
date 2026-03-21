import React from 'react';
import '../../styles/dashboard.css';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, colorClass }) => {
  return (
    <div className={`stat-card-new glass ${colorClass}`}>
      <div className="stat-content">
        <div>
          <h3 className="stat-title">{title}</h3>
          <p className="stat-value">{value}</p>
        </div>
        <div className={`stat-icon-wrapper`}>
          <Icon size={24} />
        </div>
      </div>
      {(trend || trendValue) && (
        <div className={`stat-trend ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
          <span className="trend-val">{trend === 'up' ? '↑' : '↓'} {trendValue}</span> vs last month
        </div>
      )}
    </div>
  );
};
export default StatCard;
