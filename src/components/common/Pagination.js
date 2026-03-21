import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      if (end === totalPages) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="pagination-container" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)',
      background: 'rgba(255,255,255,0.02)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px'
    }}>
      <div className="pagination-info" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Showing <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{startIdx}</span> to <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{endIdx}</span> of <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{totalItems}</span> results
      </div>

      <div className="pagination-controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)', color: 'var(--text-primary)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1,
            display: 'flex', alignItems: 'center', transition: 'all 0.2s'
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {getPageNumbers().map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={{
              minWidth: '36px', height: '36px', borderRadius: '8px',
              border: '1px solid', borderColor: currentPage === page ? 'var(--accent-primary)' : 'var(--border-color)',
              background: currentPage === page ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: currentPage === page ? 'white' : 'var(--text-primary)',
              fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {page}
          </button>
        ))}

        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)', color: 'var(--text-primary)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1,
            display: 'flex', alignItems: 'center', transition: 'all 0.2s'
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
