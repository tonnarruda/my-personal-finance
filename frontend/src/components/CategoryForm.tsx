import React, { useState, useEffect } from 'react';
import { Category, CreateCategoryRequest, UpdateCategoryRequest, CategoryType } from '../types/category';
import ElegantSelect from './ElegantSelect';

interface CategoryFormProps {
  category?: Category;
  parentCategories?: Category[];
  onSubmit: (data: CreateCategoryRequest | UpdateCategoryRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
  parentCategory?: Category;
}

const typeOptions = [
  { value: 'income', label: 'Receita' },
  { value: 'expense', label: 'Despesa' },
];

const PREDEFINED_COLORS = [
  '#22c55e', '#16a34a', '#4ade80', '#166534',
  '#3b82f6', '#2563eb', '#60a5fa', '#1e40af',
  '#ef4444', '#dc2626', '#f87171', '#991b1b',
  '#facc15', '#eab308', '#fde047', '#ca8a04',
  '#a78bfa', '#8b5cf6', '#c4b5fd', '#6d28d9',
  '#fb923c', '#f97316', '#fdba74', '#c2410c',
  '#6b7280', '#9ca3af', '#d1d5db',
  '#f472b6', '#db2777', '#f9a8d4'
];

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  parentCategories = [],
  onSubmit,
  onCancel,
  isLoading = false,
  parentCategory
}) => {
  const [formData, setFormData] = useState<CreateCategoryRequest & { is_active?: boolean }>({
    name: '',
    description: '',
    type: parentCategory ? parentCategory.type : 'expense',
    color: parentCategory ? parentCategory.color : PREDEFINED_COLORS[0],
    icon: '📁',
    parent_id: parentCategory ? parentCategory.id : undefined,
    is_active: category ? category.is_active : true
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
        parent_id: category.parent_id,
        is_active: category.is_active
      });
    } else if (parentCategory) {
      setFormData(prev => ({
        ...prev,
        type: parentCategory.type,
        color: parentCategory.color,
        parent_id: parentCategory.id,
        is_active: true
      }));
    }
  }, [category, parentCategory]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.color) newErrors.color = 'Cor é obrigatória';
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
    if (field === 'type') {
      setFormData(prev => ({
        ...prev,
        type: value as CategoryType,
        color: PREDEFINED_COLORS[0],
        parent_id: undefined
      }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
      return;
    }
    if (field === 'parent_id') {
      if (value) {
        const parent = parentCategories.find(cat => cat.id === value);
        if (parent) {
          setFormData(prev => ({ ...prev, parent_id: value, color: parent.color }));
        } else {
          setFormData(prev => ({ ...prev, parent_id: value }));
        }
      } else {
        setFormData(prev => ({ ...prev, parent_id: undefined, color: PREDEFINED_COLORS[0]}));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const filteredParentCategories = parentCategories.filter(
    (cat) => cat.type === formData.type
  );

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {category ? 'Editar Categoria' : parentCategory ? `Nova Subcategoria de ${parentCategory.name}` : 'Nova Categoria'}
        </h2>
        <p className="text-lg text-gray-500">
          Preencha os dados para {category ? 'editar' : 'adicionar'} uma categoria.
        </p>
      </div>

      {/* Seleção de tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o tipo</label>
        <div className="flex gap-3">
          {typeOptions.map(option => (
            <button
              type="button"
              key={option.value}
              onClick={() => handleInputChange('type', option.value as CategoryType)}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg border text-sm font-semibold transition-all
                ${formData.type === option.value
                  ? option.value === 'income'
                    ? 'bg-green-50 border-green-200 text-green-700 ring-2 ring-green-200'
                    : 'bg-red-50 border-red-400 text-red-600 ring-2 ring-red-200'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
                ${parentCategory || category ? 'opacity-50 pointer-events-none' : ''}
              `}
              disabled={!!parentCategory || !!category}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nome */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => handleInputChange('name', e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
          placeholder="Ex: Alimentação, Salário, etc."
          autoFocus
        />
        {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
      </div>

      {/* Subcategoria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoria de</label>
        {parentCategory ? (
          <input
            type="text"
            value={parentCategory.name}
            disabled
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-100 text-gray-500"
          />
        ) : (
          <ElegantSelect
            value={formData.parent_id || ''}
            onChange={(value) => handleInputChange('parent_id', value)}
            options={[
              { value: '', label: 'Nenhuma' },
              ...filteredParentCategories.map((parent) => ({
                value: parent.id,
                label: parent.name
              }))
            ]}
          />
        )}
      </div>

      {/* Cor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
        <div className={`${formData.parent_id || parentCategory ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-10 gap-3">
            {PREDEFINED_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all focus:outline-none bg-white
                  ${formData.color === color ? 'ring-2 ring-gray-400 border-gray-400' : 'border-transparent'}`}
                style={{ backgroundColor: color, cursor: formData.parent_id || parentCategory ? 'not-allowed' : 'pointer' }}
                onClick={() => !(formData.parent_id || parentCategory) && handleInputChange('color', color)}
                aria-label={`Selecionar cor ${color}`}
                disabled={!!formData.parent_id || !!parentCategory}
              >
                {formData.color === color && (
                  <svg className="w-4 h-4" fill="none" stroke="black" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
        {errors.color && <div className="text-red-500 text-xs mt-1">{errors.color}</div>}
      </div>

      {/* Switch de ativação só na edição */}
      {category && (
        <div className="flex items-center gap-4">
          <label htmlFor="is_active" className="block text-sm font-medium text-gray-700">Status:</label>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
            className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none shadow-sm ${formData.is_active ? 'bg-[#22c55e]' : 'bg-gray-300'}`}
            id="is_active"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
          <span className={`text-sm font-medium ${formData.is_active ? 'text-green-600' : 'text-gray-500'}`}>
            {formData.is_active ? 'Categoria ativa' : 'Categoria inativa'}
          </span>
        </div>
      )}

      {/* Botões */}
      <div className="mt-6 space-y-3">
        <button
          type="submit"
          className="w-full py-4 rounded-xl text-lg font-bold bg-[#f1f3fe] text-[#6366f1] shadow hover:bg-indigo-100 transition disabled:opacity-50"
          disabled={isLoading}
        >
          {category ? 'Salvar' : parentCategory ? 'Adicionar Subcategoria' : 'Adicionar'}
        </button>
        <button
          type="button"
          className="w-full py-4 rounded-xl text-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default CategoryForm; 