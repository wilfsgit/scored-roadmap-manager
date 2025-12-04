import { useState, useEffect } from 'react';
import { PasswordPage } from './components/PasswordPage';
import { ProductSelector } from './components/ProductSelector';
import { Whiteboard } from './components/Whiteboard';
import { pullFromGitHub, listProductsFromGitHub } from './config/github';

export type Initiative = {
  id: string;
  title: string;
  score: number;
  objective: string;
  x: number; // Position X en pixels (libre, pas de contrainte de mois)
  width: number; // Largeur de la carte en pixels
  color?: string; // Couleur de base du post-it (format hex, ex: #DBEAFE)
  isMilestone?: boolean; // Si true, affichée comme une étoile (jalon)
};

export type Product = {
  name: string;
  initiatives: Initiative[];
};

export type AppData = {
  products: Product[];
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<string | null>(null);
  const [data, setData] = useState<AppData>({ products: [] });
  const [isLoadingFromGitHub, setIsLoadingFromGitHub] = useState(false);

  // Load data from localStorage on mount, then sync with GitHub
  useEffect(() => {
    const loadData = async () => {
      // First, load from localStorage
      const savedData = localStorage.getItem('roadmap-data');
      if (savedData) {
        try {
          setData(JSON.parse(savedData));
        } catch (error) {
          console.error('Failed to load data from localStorage:', error);
        }
      }

      // Then, try to sync with GitHub to get the list of products
      setIsLoadingFromGitHub(true);
      try {
        console.log('Fetching product list from GitHub...');
        const productNames = await listProductsFromGitHub();
        
        if (productNames.length > 0) {
          console.log('Found products on GitHub:', productNames);
          
          // Load full data for each product
          const githubProducts: Product[] = [];
          for (const name of productNames) {
            try {
              console.log(`Loading data for ${name}...`);
              const productData = await pullFromGitHub(name);
              githubProducts.push(productData);
            } catch (error) {
              console.warn(`Failed to load ${name}, skipping:`, error);
              // If we can't load it, create an empty product
              githubProducts.push({ name, initiatives: [] });
            }
          }
          
          // Merge with local data (prefer GitHub data for existing products, add new ones)
          setData(prevData => {
            const localProductMap = new Map(prevData.products.map(p => [p.name, p]));
            const githubProductMap = new Map(githubProducts.map(p => [p.name, p]));
            
            // Combine: GitHub products take priority, then add local-only products
            const allProductNames = new Set([...githubProductMap.keys(), ...localProductMap.keys()]);
            const mergedProducts: Product[] = [];
            
            for (const name of allProductNames) {
              // Prefer GitHub data if available
              mergedProducts.push(githubProductMap.get(name) || localProductMap.get(name)!);
            }
            
            return { products: mergedProducts };
          });
          
          console.log('Product list and data synchronized with GitHub');
        } else {
          console.log('No products found on GitHub');
        }
      } catch (error) {
        console.warn('Failed to fetch product list from GitHub:', error);
      } finally {
        setIsLoadingFromGitHub(false);
      }
    };

    loadData();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('roadmap-data', JSON.stringify(data));
  }, [data]);

  const handleProductSelect = async (productName: string) => {
    // Set the current product immediately for UI responsiveness
    setCurrentProduct(productName);
    
    // Try to pull from GitHub in the background
    try {
      console.log(`Attempting to pull ${productName} from GitHub...`);
      const pulledProduct = await pullFromGitHub(productName);
      
      // Update the data with the pulled product
      setData(prevData => ({
        ...prevData,
        products: prevData.products.map(p =>
          p.name === productName ? pulledProduct : p
        )
      }));
      
      // Save to localStorage
      const sanitizedName = productName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      localStorage.setItem(`roadmap-product-${sanitizedName}`, JSON.stringify(pulledProduct));
      
      console.log(`Successfully pulled ${productName} from GitHub`);
    } catch (error) {
      // If pull fails (e.g., file doesn't exist yet), fall back to localStorage
      console.warn(`Failed to pull ${productName} from GitHub, using local data:`, error);
      
      const sanitizedName = productName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const savedProduct = localStorage.getItem(`roadmap-product-${sanitizedName}`);
      
      if (savedProduct) {
        try {
          const product: Product = JSON.parse(savedProduct);
          setData(prevData => ({
            ...prevData,
            products: prevData.products.map(p =>
              p.name === productName ? product : p
            )
          }));
        } catch (parseError) {
          console.error('Failed to parse local product data:', parseError);
        }
      }
    }
  };

  const handleBackToProducts = () => {
    setCurrentProduct(null);
  };

  const updateProductInitiatives = (productName: string, initiatives: Initiative[]) => {
    setData(prevData => {
      const updatedData = {
        ...prevData,
        products: prevData.products.map(p =>
          p.name === productName ? { ...p, initiatives } : p
        )
      };
      
      // Save individual product to localStorage with a unique key
      const product = updatedData.products.find(p => p.name === productName);
      if (product) {
        const sanitizedName = productName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        localStorage.setItem(`roadmap-product-${sanitizedName}`, JSON.stringify(product));
      }
      
      return updatedData;
    });
  };

  const currentProductData = data.products.find(p => p.name === currentProduct);

  // Show password page if not authenticated
  if (!isAuthenticated) {
    return <PasswordPage onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!currentProduct ? (
        <ProductSelector
          products={data.products}
          onSelectProduct={handleProductSelect}
          onUpdateProducts={(products) => setData({ products })}
          isLoadingFromGitHub={isLoadingFromGitHub}
        />
      ) : (
        <Whiteboard
          productName={currentProduct}
          initiatives={currentProductData?.initiatives || []}
          onUpdateInitiatives={(initiatives) => updateProductInitiatives(currentProduct, initiatives)}
          onBack={handleBackToProducts}
          allData={data}
        />
      )}
    </div>
  );
}