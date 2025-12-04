import { useState } from 'react';
import { Plus, FolderKanban, Loader } from 'lucide-react';
import { Product } from '../App';
import { ProductEditorModal } from './ProductEditorModal';

type ProductSelectorProps = {
  products: Product[];
  onSelectProduct: (productName: string) => void;
  onUpdateProducts: (products: Product[]) => void;
  isLoadingFromGitHub?: boolean;
};

export function ProductSelector({ products, onSelectProduct, onUpdateProducts, isLoadingFromGitHub }: ProductSelectorProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-gray-900 mb-2">CBA Products</h1>
          <p className="text-gray-600">
            {isLoadingFromGitHub ? (
              <span className="inline-flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Synchronisation avec GitHub...
              </span>
            ) : (
              'Sélectionnez un produit pour visualiser sa roadmap'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <button
              key={product.name}
              onClick={() => onSelectProduct(product.name)}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 p-3 rounded-xl group-hover:bg-indigo-200 transition-colors">
                  <FolderKanban className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-500">
                    {product.initiatives.length} initiative{product.initiatives.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </button>
          ))}

          {products.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Aucun produit</p>
              <p className="text-gray-400">Cliquez sur le bouton + pour créer votre premier produit</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsEditorOpen(true)}
        className="fixed bottom-8 right-8 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all duration-200 hover:scale-110"
        aria-label="Gérer les produits"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Product Editor Modal */}
      {isEditorOpen && (
        <ProductEditorModal
          products={products}
          onClose={() => setIsEditorOpen(false)}
          onUpdateProducts={onUpdateProducts}
        />
      )}
    </div>
  );
}