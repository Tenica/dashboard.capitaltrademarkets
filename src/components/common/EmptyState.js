import React from 'react';
import { ShieldAlert, Inbox, Search, History } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = Inbox, 
  title = "No Data Records", 
  message = "There's nothing to show here yet.",
  action = null 
}) => {
  return (
    <div className="empty-state-card glass" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4.5rem 2rem',
      textAlign: 'center',
      borderRadius: '20px',
      margin: '0 auto',
      width: '100%',
      maxWidth: '100%',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        color: 'var(--text-secondary)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <Icon size={32} strokeWidth={1.5} />
      </div>
      
      <h3 style={{ 
        fontSize: '1.2rem', 
        fontWeight: '700', 
        color: 'var(--text-primary)',
        marginBottom: '0.5rem'
      }}>
        {title}
      </h3>
      
      <p style={{ 
        fontSize: '0.9rem', 
        color: 'var(--text-secondary)',
        maxWidth: '300px',
        lineHeight: '1.6',
        marginBottom: action ? '2rem' : '0'
      }}>
        {message}
      </p>

      {action && (
        <button 
          onClick={action.onClick}
          className="btn btn-primary"
          style={{ 
            padding: '0.75rem 1.5rem', 
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          {action.label}
        </button>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default EmptyState;
