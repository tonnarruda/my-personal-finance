import React from 'react';
import { Category, CategoryWithSubcategories } from '../types/category';

interface CategoryListProps {
  categories: CategoryWithSubcategories[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onAddSubcategory: (parentCategory: Category) => void;
  isLoading?: boolean;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onEdit,
  onDelete,
  onAddSubcategory,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Nenhuma categoria encontrada.</p>
      </div>
    );
  }

  const CategoryItem: React.FC<{ category: Category; isSubcategory?: boolean }> = ({ category, isSubcategory = false }) => (
  <div
    className={`flex items-center bg-white border border-gray-100 rounded-xl shadow-sm mb-3 transition
      ${isSubcategory
        ? 'ml-10 bg-gray-50 py-2 px-4 min-h-[36px]'
        : 'py-4 px-6 min-h-[56px]'}
    `}
  >
    <div
      className={`flex-shrink-0 ${isSubcategory ? 'w-7 h-7' : 'w-10 h-10'} rounded-full flex items-center justify-center mr-4`}
      style={{ backgroundColor: category.color }}
    />
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-gray-900 text-base truncate">{category.name}</div>
    </div>
    <div className="flex items-center gap-2 ml-4">
      <button
        onClick={() => onEdit(category)}
        className="p-2 text-blue-500 hover:text-blue-700"
        title="Editar categoria"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        onClick={() => onDelete(category)}
        className="p-2 text-red-500 hover:text-red-700"
        title="Excluir categoria"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
);

  return (
    <div>
      {categories.map((categoryWithSubs) => (
        <div key={categoryWithSubs.id}>
          <CategoryItem category={categoryWithSubs} />
          {categoryWithSubs.subcategories && categoryWithSubs.subcategories.length > 0 && (
            <div>
              {categoryWithSubs.subcategories.map((subcategory) => (
                <CategoryItem key={subcategory.id} category={subcategory} isSubcategory />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CategoryList; 