import { useState } from 'react';
import { AlertCircle, Cloud, CloudOff, Download, Upload, Loader, CheckCircle, X } from 'lucide-react';
import { Product } from '../App';
import { getFilePath, pullFromGitHub, pushToGitHub } from '../config/github';

type GitHubSyncProps = {
  productName: string;
  productData: Product;
  onClose: () => void;
  onDataPulled: (product: Product) => void;
};

export function GitHubSync({ productName, productData, onClose, onDataPulled }: GitHubSyncProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showPushModal, setShowPushModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [commitReason, setCommitReason] = useState('');

  const handlePush = async () => {
    setStatus('loading');
    setMessage('Push en cours...');

    try {
      await pushToGitHub(productName, productData, userName, commitReason);

      setStatus('success');
      setMessage(`Roadmap "${productName}" synchronisée avec succès sur GitHub !`);
      setShowPushModal(false);
      setUserName('');
      setCommitReason('');
    } catch (error) {
      setStatus('error');
      setMessage(`Erreur: ${error instanceof Error ? error.message : 'Échec du push'}. Vérifiez votre configuration GitHub.`);
    }
  };

  const handlePushButtonClick = () => {
    setShowPushModal(true);
    setStatus('idle');
  };

  const handleConfirmPush = () => {
    if (userName.trim() && commitReason.trim()) {
      handlePush();
    }
  };

  const handlePull = async () => {
    setStatus('loading');
    setMessage('Pull en cours...');

    try {
      const pulledData: Product = await pullFromGitHub(productName);

      onDataPulled(pulledData);

      setStatus('success');
      setMessage(`Roadmap "${productName}" récupérée avec succès depuis GitHub !`);
    } catch (error) {
      setStatus('error');
      setMessage(`Erreur: ${error instanceof Error ? error.message : 'Échec du pull'}. Vérifiez votre configuration GitHub.`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-gray-900">Synchronisation GitHub</h2>
            <p className="text-gray-500 text-sm mt-1">Fichier: {getFilePath(productName)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={handlePushButtonClick}
              disabled={status === 'loading'}
              className="flex flex-col items-center gap-3 p-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl hover:bg-indigo-100 hover:border-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-8 h-8 text-indigo-600" />
              <div className="text-center">
                <h3 className="text-gray-900 mb-1">Push vers GitHub</h3>
                <p className="text-gray-600 text-sm">Envoyer les données locales</p>
              </div>
            </button>

            <button
              onClick={handlePull}
              disabled={status === 'loading'}
              className="flex flex-col items-center gap-3 p-6 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-8 h-8 text-green-600" />
              <div className="text-center">
                <h3 className="text-gray-900 mb-1">Pull depuis GitHub</h3>
                <p className="text-gray-600 text-sm">Récupérer les données distantes</p>
              </div>
            </button>
          </div>

          {status !== 'idle' && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg ${
                status === 'loading'
                  ? 'bg-blue-50 border border-blue-200'
                  : status === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {status === 'loading' && <Loader className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />}
              {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
              {status === 'error' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
              <p
                className={`text-sm ${
                  status === 'loading'
                    ? 'text-blue-900'
                    : status === 'success'
                    ? 'text-green-900'
                    : 'text-red-900'
                }`}
              >
                {message}
              </p>
            </div>
          )}
        </div>
      </div>

      {showPushModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-gray-900">Confirmer le push</h2>
              <button
                onClick={() => setShowPushModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="userName">
                  Nom d'utilisateur
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  id="userName"
                  type="text"
                  placeholder="Entrez votre nom"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="commitReason">
                  Motif du commit
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  id="commitReason"
                  type="text"
                  placeholder="Ex: Ajout de nouvelles initiatives"
                  value={commitReason}
                  onChange={(e) => setCommitReason(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleConfirmPush()}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPushModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmPush}
                  disabled={!userName.trim() || !commitReason.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}