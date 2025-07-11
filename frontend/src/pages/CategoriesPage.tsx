import React, { useState, useEffect } from 'react';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types/category';
import { categoryService } from '../services/api';
import CategoryList from '../components/CategoryList';
import CategoryForm from '../components/CategoryForm';
import Layout from '../components/Layout';
import { useToast } from '../contexts/ToastContext';
import { useSidebar } from '../contexts/SidebarContext';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | undefined>();
  const [showInactive, setShowInactive] = useState(false);
  const { showSuccess, showError } = useToast();
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  useEffect(() => {
    if (!categoryToDelete) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDeleteCategory();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [categoryToDelete]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const allCats = await categoryService.getAllCategories();
      setCategories(allCats);
    } catch (err) {
      showError('Erro ao carregar categorias. Verifique se o backend está rodando.');
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (data: CreateCategoryRequest) => {
    try {
      const message = await categoryService.createCategory(data);
      showSuccess(message);
      setShowForm(false);
      setEditingCategory(undefined);
      await loadCategories();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Erro ao criar categoria');
      console.error('Erro ao criar categoria:', err);
    }
  };

  const handleUpdateCategory = async (data: UpdateCategoryRequest) => {
    if (!editingCategory) return;
    try {
      const message = await categoryService.updateCategory(editingCategory.id, data);
      showSuccess(message);
      setShowForm(false);
      setEditingCategory(undefined);
      await loadCategories();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Erro ao atualizar categoria');
      console.error('Erro ao atualizar categoria:', err);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    setCategoryToDelete(category);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setCategoryToDelete(null);
      const message = await categoryService.deleteCategory(categoryToDelete.id);
      showSuccess(message);
      await loadCategories();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Erro ao excluir categoria');
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
    <Layout>
      {/* Bloco fixo no topo, alinhado ao conteúdo principal */}
      <div
        className={`fixed top-0 bg-white shadow z-50 px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex flex-col transition-all duration-300 ${
          isCollapsed 
            ? 'left-20 w-[calc(100vw-5rem)]' 
            : 'left-64 w-[calc(100vw-16rem)]'
        }`}
        style={{ minHeight: 110 }}
      >
        <div className="flex items-center justify-between mb-6">
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
              className="px-6 py-3 rounded-xl text-lg font-medium transition-colors duration-150 bg-[#f1f3fe] text-[#6366f1] hover:bg-indigo-100 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              + Nova Categoria
            </button>
          </div>
        </div>
      </div>
      {/* Espaço para não sobrepor o conteúdo */}
      <div className="h-[110px]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
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
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
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
                  className="px-6 py-3 rounded-xl text-lg font-medium transition-colors duration-150 bg-[#f1f3fe] text-[#6366f1] hover:bg-indigo-100 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-700"
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