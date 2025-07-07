import React, { useState, useEffect, useRef } from 'react';
import { Category, CreateCategoryRequest, UpdateCategoryRequest, CategoryType } from '../types/category';
import Select from 'react-select';

interface CategoryFormProps {
  category?: Category;
  parentCategories?: Category[];
  onSubmit: (data: CreateCategoryRequest | UpdateCategoryRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
  parentCategory?: Category;
}

const typeOptions = [
  {
    value: 'income',
    label: 'Receita',
    icon: (
      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
    ),
  },
  {
    value: 'expense',
    label: 'Despesa',
    icon: (
      <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
    ),
  },
];

const PREDEFINED_COLORS = [
  // 4 verdes
  '#22c55e', '#16a34a', '#4ade80', '#166534',
  // 4 azuis
  '#3b82f6', '#2563eb', '#60a5fa', '#1e40af',
  // 4 vermelhos
  '#ef4444', '#dc2626', '#f87171', '#991b1b',
  // 4 amarelos
  '#facc15', '#eab308', '#fde047', '#ca8a04',
  // 4 roxos
  '#a78bfa', '#8b5cf6', '#c4b5fd', '#6d28d9',
  // 4 laranjas
  '#fb923c', '#f97316', '#fdba74', '#c2410c',
  // 3 cinzas
  '#6b7280', '#9ca3af', '#d1d5db',
  // 3 rosas
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
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    description: '',
    type: parentCategory ? parentCategory.type : 'expense',
    color: parentCategory ? parentCategory.color : '#3B82F6',
    icon: '📁',
    parent_id: parentCategory ? parentCategory.id : undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

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
    } else if (parentCategory) {
      setFormData(prev => ({
        ...prev,
        type: parentCategory.type,
        color: parentCategory.color,
        parent_id: parentCategory.id
      }));
    }
  }, [category, parentCategory]);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [category, parentCategory]);

  useEffect(() => {
    if (errors.name && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [errors.name]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    if (!formData.color) {
      newErrors.color = 'Cor é obrigatória';
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
    if (field === 'type') {
      setFormData(prev => ({
        ...prev,
        type: value as CategoryType,
        color: '#3B82F6',
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
        setFormData(prev => ({ ...prev, parent_id: undefined, color: '#3B82F6'}));
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
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">{category ? 'Editar Categoria' : parentCategory ? `Nova Subcategoria de ${parentCategory.name}` : 'Nova Categoria'}</h2>
      </div>
      {/* Seleção de tipo */}
      <div className="mb-6">
        <label className="block text-base font-medium text-gray-700 mb-2">Selecione o tipo</label>
        <div className="flex gap-4">
          {typeOptions.map(option => (
            <button
              type="button"
              key={option.value}
              onClick={() => handleInputChange('type', option.value as CategoryType)}
              className={`flex-1 flex items-center justify-center px-8 py-4 rounded-xl border text-lg font-semibold transition-all
                ${formData.type === option.value
                  ? option.value === 'income'
                    ? 'bg-green-50 border-green-200 text-green-700 ring-2 ring-green-200'
                    : 'bg-red-50 border-red-400 text-red-600 ring-2 ring-red-200'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
                ${parentCategory ? 'opacity-50 pointer-events-none select-none' : ''}
              `}
              disabled={!!parentCategory}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {/* Nome */}
      <div className="mb-6">
        <label htmlFor="name" className="block text-base font-medium text-gray-700 mb-2">Nome</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={e => handleInputChange('name', e.target.value)}
          className={`w-full px-5 py-4 rounded-xl border text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
          placeholder="Ex: Alimentação, Salário, etc."
          ref={nameInputRef}
        />
        {errors.name && (
          <span className="text-red-600 text-sm mt-1 block">Campo obrigatório</span>
        )}
      </div>
      {/* Subcategoria e Cor */}
      <div className="flex flex-col gap-4 mb-10">
        <div className="w-full">
          <label htmlFor="parent_id" className="block text-base font-medium text-gray-700 mb-2">Subcategoria de</label>
          {parentCategory ? (
            <input
              type="text"
              value={parentCategory.name}
              disabled
              className="w-full px-5 py-4 rounded-xl border border-gray-200 text-base bg-gray-100 text-gray-500"
            />
          ) : (
            <select
              id="parent_id"
              value={formData.parent_id || ''}
              onChange={e => handleInputChange('parent_id', e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-gray-200 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Nenhuma</option>
              {filteredParentCategories.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="w-full">
          <label htmlFor="color" className="block text-base font-medium text-gray-700 mb-2">Cor</label>
          <div className={`flex flex-col gap-2 ${formData.parent_id || parentCategory ? 'opacity-50 pointer-events-none select-none' : ''}`}>
            <div className="grid grid-cols-10 gap-5 mb-2">
              {PREDEFINED_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all focus:outline-none ${
                    formData.color === color ? 'ring-2 ring-gray-400 border-gray-400' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color, cursor: formData.parent_id || parentCategory ? 'not-allowed' : 'pointer' }}
                  onClick={() => !(formData.parent_id || parentCategory) && handleInputChange('color', color)}
                  aria-label={`Selecionar cor ${color}`}
                  disabled={!!formData.parent_id || !!parentCategory}
                >
                  {formData.color === color && (
                    <svg className="w-6 h-6" fill="none" stroke="black" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-8 py-4 bg-[#f1f3fe] text-[#6366f1]  text-xl font-bold rounded-xl shadow hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {category ? 'Salvar' : parentCategory ? 'Adicionar Subcategoria' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm; 