import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Product } from '../App';

type ProductEditorModalProps = {
  products: Product[];
  onClose: () => void;
  onUpdateProducts: (products: Product[]) => void;
};

export function ProductEditorModal({ products, onClose, onUpdateProducts }: ProductEditorModalProps) {
  const [newProductName, setNewProductName] = useState('');

  const handleAddProduct = () => {
    if (newProductName.trim() && !products.find(p => p.name === newProductName.trim())) {
      onUpdateProducts([...products, { name: newProductName.trim(), initiatives: [] }]);
      setNewProductName('');
    }
  };

  const handleDeleteProduct = (productName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${productName}" ?`)) {
      onUpdateProducts(products.filter(p => p.name !== productName));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-gray-900">Gérer les produits</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Ajouter un produit</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddProduct()}
                placeholder="Nom du produit"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddProduct}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Produits existants</label>
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-gray-900">{product.name}</p>
                    <p className="text-gray-500">{product.initiatives.length} initiative{product.initiatives.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(product.name)}
                    className="text-red-500 hover:text-red-700 transition-colors p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              {products.length === 0 && (
                <p className="text-gray-400 text-center py-8">Aucun produit pour le moment</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
