import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const pageSizeOptions = [10, 25, 50, 100];

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-4 py-3 border-t border-gray-200">
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-700">
          Mostrando <span className="font-medium">{startItem}</span> até{' '}
          <span className="font-medium">{endItem}</span> de{' '}
          <span className="font-medium">{totalItems}</span> resultados
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-gray-600">
            Por página:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-gray-300 text-gray-700 text-sm py-1.5 pl-3 pr-8 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                page === currentPage
                  ? 'bg-blue-50 text-blue-600 border border-blue-300'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination; 