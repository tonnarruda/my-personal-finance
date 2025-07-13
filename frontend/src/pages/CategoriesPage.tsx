import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import CategoryForm from '../components/CategoryForm';
import { categoryService } from '../services/api';
import { Category } from '../types/category';
import { useToast } from '../contexts/ToastContext';
import { useSidebar } from '../contexts/SidebarContext';

const CategoriesPage: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchCategories = useCallback(async () => {
    try {
      const incomeCategories = await categoryService.getCategoriesWithSubcategories('income');
      const expenseCategories = await categoryService.getCategoriesWithSubcategories('expense');
      setCategories([...incomeCategories, ...expenseCategories]);
    } catch (err) {
      setCategories([]);
      showError('Erro ao buscar categorias.');
    }
  }, [showError]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenForm = (category: Category | null = null) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, data);
        showSuccess('Categoria atualizada com sucesso!');
      } else {
        await categoryService.createCategory(data);
        showSuccess('Categoria criada com sucesso!');
      }
      handleCloseForm();
      fetchCategories();
    } catch (err) {
      showError('Erro ao salvar categoria.');
    }
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    if (categoryToDelete.subcategories && categoryToDelete.subcategories.length > 0) {
      showError('Não é possível excluir uma categoria que possui subcategorias.');
      setCategoryToDelete(null);
      return;
    }

    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      showSuccess('Categoria excluída com sucesso!');
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      showError('Erro ao excluir categoria.');
    }
  };

  const renderCategory = (category: Category, isSubcategory = false) => (
    <div key={category.id} className={`bg-white p-4 rounded-lg shadow-sm ${isSubcategory ? 'ml-8' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></span>
          <span className="font-semibold">{category.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleOpenForm(category)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
          </button>
          <button onClick={() => handleDelete(category)} className="p-1 text-red-600 hover:bg-red-50 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m-7-7h10" /></svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className={`p-4 sm:p-6 lg:p-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900">Categorias</h1>
            <p className="mt-2 text-lg text-gray-600">Organize suas transações em categorias e subcategorias.</p>
          </div>
          <button
            onClick={() => handleOpenForm()}
            className="px-6 py-3 rounded-xl text-lg font-medium transition-colors duration-150 bg-[#f1f3fe] text-[#6366f1] hover:bg-indigo-100 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-700"
          >
            + Adicionar Categoria
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-green-400 pb-2">Receitas</h2>
            <div className="space-y-4">
              {categories.filter(c => c.type === 'income').map(category => (
                <div key={category.id}>
                  {renderCategory(category)}
                  {category.subcategories && category.subcategories.map(sub => renderCategory(sub, true))}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-red-400 pb-2">Despesas</h2>
            <div className="space-y-4">
              {categories.filter(c => c.type === 'expense').map(category => (
                <div key={category.id}>
                  {renderCategory(category)}
                  {category.subcategories && category.subcategories.map(sub => renderCategory(sub, true))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {showForm && (
          <div className={`fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4 ${!isCollapsed ? 'lg:pl-64' : 'lg:pl-20'}`}>
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative">
              <button onClick={handleCloseForm} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <CategoryForm category={editingCategory || undefined} onSubmit={handleSubmit} onCancel={handleCloseForm} />
            </div>
          </div>
        )}

        {categoryToDelete && (
          <div className={`fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4 ${!isCollapsed ? 'lg:pl-64' : 'lg:pl-20'}`}>
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confirmar exclusão</h3>
              <p className="text-gray-600 mb-6">Tem certeza que deseja excluir a categoria "{categoryToDelete.name}"?</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setCategoryToDelete(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CategoriesPage; 