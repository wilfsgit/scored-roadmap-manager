import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { SECRET_CONFIG } from '../config/secret';

type PasswordPageProps = {
  onAuthenticated: () => void;
};

export function PasswordPage({ onAuthenticated }: PasswordPageProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Check if already authenticated in sessionStorage
  useEffect(() => {
    const storedHash = sessionStorage.getItem('roadmap-auth-token');
    // Verify that the stored hash matches the expected password hash
    if (storedHash && storedHash === SECRET_CONFIG.password) {
      onAuthenticated();
    }
  }, [onAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hash the entered password with SHA-1 and compare with stored hash
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // DEBUG: Log the generated hash
      console.log('🔍 Password entered:', password);
      console.log('🔐 Generated SHA-1 hash:', hashedPassword);
      console.log('📝 Stored hash:', SECRET_CONFIG.password);
      console.log('✅ Match?', hashedPassword === SECRET_CONFIG.password);
      
      if (hashedPassword === SECRET_CONFIG.password) {
        // Success
        sessionStorage.setItem('roadmap-auth-token', hashedPassword);
        onAuthenticated();
      } else {
        // Error
        setError('Mot de passe incorrect');
        setIsShaking(true);
        setPassword('');
        
        // Remove shake animation after it completes
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch (error) {
      console.error('Error hashing password:', error);
      setError('Erreur lors de la vérification');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[0px] shadow-2xl p-8">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 p-4 rounded-2xl">
              <Lock className="w-12 h-12 text-indigo-600" />
            </div>
          </div>

          

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className={`w-full px-4 py-3 pr-12 border  focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  } ${isShaking ? 'animate-shake' : ''}`}
                  placeholder="Entrez votre mot de passe"
                  autoFocus
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-3 flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-[1px] hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!password}
            >
              Se connecter
            </button>
          </form>

          
        </div>
      </div>

      {/* Custom shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
}