import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Button } from './ui';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  // Adjust range to always show 5 pages or less
  if (endPage - startPage < 4) {
    if (startPage === 1) {
      endPage = Math.min(totalPages, 5);
    } else if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - 4);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6 sm:mt-8 flex-wrap p-2 sm:p-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-0 sm:gap-1 px-3 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm font-semibold hover:shadow-md transition-all border-2"
      >
        <FaChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      {startPage > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            className="w-8 h-8 sm:w-10 sm:h-10 p-0 text-xs sm:text-sm font-bold border-2 hover:shadow-md transition-all"
          >
            1
          </Button>
          {startPage > 2 && <span className="text-[#6B7280] text-xs px-1">⋯</span>}
        </>
      )}

      {pageNumbers.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 sm:w-10 sm:h-10 p-0 text-xs sm:text-sm font-bold transition-all ${
            page === currentPage 
              ? 'shadow-lg hover:shadow-xl' 
              : 'border-2 hover:shadow-md'
          }`}
        >
          {page}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-[#6B7280] text-xs px-1">⋯</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className="w-8 h-8 sm:w-10 sm:h-10 p-0 text-xs sm:text-sm font-bold border-2 hover:shadow-md transition-all"
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-0 sm:gap-1 px-3 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm font-semibold hover:shadow-md transition-all border-2"
      >
        <span className="hidden sm:inline">Next</span>
        <FaChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    </div>
  );
};

export default Pagination;
