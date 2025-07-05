import React, { useState, useEffect } from 'react';
import { Category, CreateCategoryRequest, UpdateCategoryRequest, CategoryType } from '../types/category';

interface CategoryFormProps {
  category?: Category;
  parentCategories?: Category[];
  onSubmit: (data: CreateCategoryRequest | UpdateCategoryRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  parentCategories = [],
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    description: '',
    type: 'expense',
    color: '#3B82F6',
    icon: '📁',
    parent_id: undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description,
        type: category.type,
        color: category.color,
        icon: category.icon,
        parent_id: category.parent_id
      });
    }
  }, [category]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.color) {
      newErrors.color = 'Cor é obrigatória';
    }

    if (!formData.icon) {
      newErrors.icon = 'Ícone é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof CreateCategoryRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const iconOptions = [
    '🏠', '💰', '🍽️', '🚗', '🛒', '🎮', '📚', '🏥', '💊', '👕', '🎬', '✈️',
    '🏖️', '🎵', '📱', '💻', '⚡', '💧', '🔥', '🌱', '🎨', '🏃', '🧘', '📺'
  ];

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
    '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  const filteredParentCategories = parentCategories.filter(
    (cat) => cat.type === formData.type
  );

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-start justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">{category ? 'Editar Categoria' : 'Nova Categoria'}</h2>
      </div>
      <div className="flex flex-col gap-6 mb-8 md:flex-row md:gap-4">
        {/* Nome */}
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="name" className="block text-base font-medium text-gray-700 mb-2">Nome</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            className="w-full px-5 py-3 rounded-xl border border-gray-200 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Ex: Alimentação, Salário, etc."
            required
          />
        </div>
        {/* Tipo */}
        <div className="w-[160px] min-w-[120px]">
          <label htmlFor="type" className="block text-base font-medium text-gray-700 mb-2">Tipo</label>
          <select
            id="type"
            value={formData.type}
            onChange={e => handleInputChange('type', e.target.value as CategoryType)}
            className="w-full px-5 py-3 rounded-xl border border-gray-200 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </div>
        {/* Cor */}
        <div className="flex items-end gap-2 w-[120px] min-w-[100px]">
          <div className="flex flex-col w-full">
            <label htmlFor="color" className="block text-base font-medium text-gray-700 mb-2">Cor</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="color"
                value={formData.color}
                onChange={e => handleInputChange('color', e.target.value)}
                className="w-10 h-10 p-0 border-0 bg-transparent cursor-pointer rounded-xl"
                style={{ background: 'none' }}
              />
              <input
                type="text"
                value={formData.color}
                onChange={e => handleInputChange('color', e.target.value)}
                className="w-20 px-3 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
                maxLength={7}
              />
            </div>
          </div>
        </div>
        {/* Subcategoria */}
        <div className="w-[220px] min-w-[160px]">
          <label htmlFor="parent_id" className="block text-base font-medium text-gray-700 mb-2">Subcategoria de</label>
          <select
            id="parent_id"
            value={formData.parent_id || ''}
            onChange={e => handleInputChange('parent_id', e.target.value)}
            className="w-full px-5 py-3 rounded-xl border border-gray-200 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Nenhuma</option>
            {filteredParentCategories.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {category ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm; 