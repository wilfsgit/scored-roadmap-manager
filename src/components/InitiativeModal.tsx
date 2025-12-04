import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Initiative } from '../App';

type InitiativeModalProps = {
  initiative: Initiative | null;
  onClose: () => void;
  onSave: (initiative: Omit<Initiative, 'id'>) => void;
  onDelete?: (id: string) => void;
};

export function InitiativeModal({ initiative, onClose, onSave, onDelete }: InitiativeModalProps) {
  const [title, setTitle] = useState('');
  const [score, setScore] = useState(10);
  const [objective, setObjective] = useState('');
  const [color, setColor] = useState('#DBEAFE'); // Bleu clair par défaut
  const [isMilestone, setIsMilestone] = useState(false);

  useEffect(() => {
    if (initiative) {
      setTitle(initiative.title);
      setScore(initiative.score);
      setObjective(initiative.objective);
      setColor(initiative.color || '#DBEAFE');
      setIsMilestone(initiative.isMilestone || false);
    }
  }, [initiative]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pour un milestone, objective n'est pas requis
    if (title.trim() && (isMilestone || objective.trim())) {
      onSave({
        title: title.trim(),
        score: Number(score),
        objective: objective.trim(),
        x: initiative?.x || 0,
        width: initiative?.width || 200,
        color: color,
        isMilestone: isMilestone,
      });
      onClose();
    }
  };

  const handleDelete = () => {
    if (initiative && onDelete) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette initiative ?')) {
        onDelete(initiative.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-gray-900">
            {initiative ? 'Modifier l\'initiative' : 'Nouvelle initiative'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Demande de prise en charge par vague"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isMilestone"
              checked={isMilestone}
              onChange={(e) => setIsMilestone(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
            <label htmlFor="isMilestone" className="text-gray-700">
              Jalon (événement représenté par une étoile)
            </label>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Score (0-25)</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="25"
                step="0.1"
                value={score}
                onChange={(e) => setScore(parseFloat(e.target.value))}
                className="flex-1"
                disabled={isMilestone}
              />
              <input
                type="number"
                min="0"
                max="25"
                step="0.1"
                value={score}
                onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isMilestone}
              />
            </div>
            {isMilestone && <p className="text-sm text-gray-500 mt-1">Score non applicable pour les jalons</p>}
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Objectif</label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Gérer l'augmentation des demandes"
              required={!isMilestone}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={isMilestone}
            />
            {isMilestone && <p className="text-sm text-gray-500 mt-1">Objectif non applicable pour les jalons</p>}
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Couleur</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
              />
              <span className="text-gray-600 text-sm">{color}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {initiative && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {initiative ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}