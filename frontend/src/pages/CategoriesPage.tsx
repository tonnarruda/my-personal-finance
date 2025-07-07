import React, { useState, useEffect } from 'react';
import { Category, CategoryWithSubcategories, CreateCategoryRequest, UpdateCategoryRequest } from '../types/category';
import { categoryService } from '../services/api';
import CategoryList from '../components/CategoryList';
import CategoryForm from '../components/CategoryForm';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | undefined>();
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  // ESC para fechar o modal
  useEffect(() => {
    if (!(showForm || editingCategory)) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelForm();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showForm, editingCategory]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError('');
      const allCats = await categoryService.getAllCategories();
      setCategories(allCats);
    } catch (err) {
      setError('Erro ao carregar categorias. Verifique se o backend está rodando.');
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (data: CreateCategoryRequest) => {
    try {
      setError('');
      setSuccess('');
      const message = await categoryService.createCategory(data);
      setSuccess(message);
      setShowForm(false);
      setEditingCategory(undefined);
      await loadCategories();
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar categoria');
      console.error('Erro ao criar categoria:', err);
    }
  };

  const handleUpdateCategory = async (data: UpdateCategoryRequest) => {
    if (!editingCategory) return;
    try {
      setError('');
      setSuccess('');
      const message = await categoryService.updateCategory(editingCategory.id, data);
      setSuccess(message);
      setShowForm(false);
      setEditingCategory(undefined);
      await loadCategories();
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar categoria');
      console.error('Erro ao atualizar categoria:', err);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    setCategoryToDelete(category);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setError('');
      setSuccess('');
      setCategoryToDelete(null);
      const message = await categoryService.deleteCategory(categoryToDelete.id);
      setSuccess(message);
      await loadCategories();
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao excluir categoria');
      console.error('Erro ao excluir categoria:', err);
    }
  };

  const cancelDeleteCategory = () => {
    setCategoryToDelete(null);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleAddSubcategory = (parentCategory: Category) => {
    setEditingCategory(undefined);
    setParentCategory(parentCategory);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCategory(undefined);
    setParentCategory(undefined);
  };

  const handleSubmit = (data: CreateCategoryRequest | UpdateCategoryRequest) => {
    if (editingCategory) {
      handleUpdateCategory(data as UpdateCategoryRequest);
    } else {
      let submitData = data as CreateCategoryRequest;
      if (parentCategory) {
        submitData = {
          ...submitData,
          parent_id: parentCategory.id,
          type: parentCategory.type,
          color: parentCategory.color,
        };
      }
      handleCreateCategory(submitData);
      setParentCategory(undefined);
    }
  };

  // Filtros de categorias
  const incomeCategories = categories.filter(cat => cat.type === 'income' && !cat.parent_id && (showInactive || cat.is_active));
  const expenseCategories = categories.filter(cat => cat.type === 'expense' && !cat.parent_id && (showInactive || cat.is_active));

  const incomeCategoriesWithSubs = incomeCategories.map(cat => ({
    ...cat,
    subcategories: categories.filter(sub => sub.parent_id === cat.id && (showInactive || sub.is_active))
  }));
  const expenseCategoriesWithSubs = expenseCategories.map(cat => ({
    ...cat,
    subcategories: categories.filter(sub => sub.parent_id === cat.id && (showInactive || sub.is_active))
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Categorias</h1>
            <p className="mt-2 text-lg text-gray-600">Gerencie as categorias de suas transações</p>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={() => setShowInactive(v => !v)}
                className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-2 text-base text-gray-700">Exibir categorias inativas</span>
            </label>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingCategory(undefined);
              }}
              className="px-6 py-3 rounded-xl text-lg font-medium transition-colors duration-150
               bg-[#f1f3fe] text-[#6366f1] 
               hover:bg-indigo-100 hover:text-indigo-800
               focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              + Nova Categoria
            </button>
          </div>
        </div>
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Coluna Receita */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Receita</h2>
            <CategoryList
              categories={incomeCategoriesWithSubs}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
              onAddSubcategory={handleAddSubcategory}
              isLoading={isLoading}
            />
          </div>
          {/* Coluna Despesa */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Despesa</h2>
            <CategoryList
              categories={expenseCategoriesWithSubs}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
              onAddSubcategory={handleAddSubcategory}
              isLoading={isLoading}
            />
          </div>
        </div>
        {/* Formulário lateral/modal */}
        {(showForm || editingCategory) && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-3xl md:max-w-4xl relative">
              <button
                onClick={handleCancelForm}
                className="absolute top-6 right-8 text-gray-400 hover:text-gray-600 text-3xl"
                title="Fechar"
              >
                &times;
              </button>
              <CategoryForm
                category={editingCategory}
                parentCategories={categories.filter(cat => !cat.parent_id && cat.is_active)}
                onSubmit={handleSubmit}
                onCancel={handleCancelForm}
                isLoading={isLoading}
                parentCategory={parentCategory}
              />
            </div>
          </div>
        )}
        {/* Modal de confirmação de exclusão */}
        {categoryToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
              <h2 className="text-xl font-bold mb-4">Excluir categoria</h2>
              <p className="mb-6">Tem certeza que deseja excluir a categoria <span className="font-semibold">{categoryToDelete.name}</span>?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={cancelDeleteCategory}
                  className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteCategory}
                  className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage; 