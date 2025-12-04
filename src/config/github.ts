import { Product } from '../App';
import { GITHUB_CONFIG } from './secret';

// Sanitize product name for file system
export const sanitizeProductName = (productName: string): string => {
  return productName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
};

// Get file path for a product
export const getFilePath = (productName: string): string => {
  const sanitizedName = sanitizeProductName(productName);
  return `scored-roadmaps/${sanitizedName}.json`;
};

// Get list of all products from GitHub (reads the directory)
export const listProductsFromGitHub = async (): Promise<string[]> => {
  const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/scored-roadmaps?ref=${GITHUB_CONFIG.branch}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      // Directory doesn't exist yet
      return [];
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const files = await response.json();
  
  // Extract product names from .json files
  const productNames = files
    .filter((file: any) => file.type === 'file' && file.name.endsWith('.json'))
    .map((file: any) => {
      // Convert filename back to product name (reverse sanitization)
      const nameWithoutExt = file.name.replace('.json', '');
      // Capitalize first letter of each word and replace dashes with spaces
      return nameWithoutExt
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    });

  return productNames;
};

// Pull product data from GitHub
export const pullFromGitHub = async (productName: string): Promise<Product> => {
  const filePath = getFilePath(productName);
  const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}?ref=${GITHUB_CONFIG.branch}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Le fichier "${productName}" n'existe pas encore sur GitHub.`);
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const fileData = await response.json();
  
  // Decode base64 with proper UTF-8 handling for accents
  const binaryString = atob(fileData.content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const content = new TextDecoder('utf-8').decode(bytes);
  
  return JSON.parse(content);
};

// Push product data to GitHub
export const pushToGitHub = async (
  productName: string,
  productData: Product,
  userName: string,
  commitReason: string
): Promise<void> => {
  const filePath = getFilePath(productName);
  const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}`;
  
  // First, try to get the file to get its SHA (required for updates)
  let sha: string | undefined;
  try {
    const getResponse = await fetch(`${apiUrl}?ref=${GITHUB_CONFIG.branch}`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    } else if (getResponse.status === 404) {
      sha = undefined;
    } else if (getResponse.status === 401 || getResponse.status === 403) {
      throw new Error('Erreur d\'authentification GitHub. Vérifiez votre token.');
    }
  } catch (error) {
    if (error instanceof Error && (error.message.includes('authentification') || error.message.includes('authentication'))) {
      throw error;
    }
  }

  // Push the data
  const content = encodeBase64UTF8(JSON.stringify(productData, null, 2));
  const commitMessage = `${userName} - ${productName} - ${commitReason}`;
  const body: any = {
    message: commitMessage,
    content,
    branch: GITHUB_CONFIG.branch,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`GitHub API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
  }
};

// Helper function to encode to base64 with UTF-8 support (for emojis and special characters)
function encodeBase64UTF8(str: string): string {
  // Convert string to UTF-8 bytes, then to base64
  const utf8Bytes = new TextEncoder().encode(str);
  const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
  return btoa(binaryString);
}