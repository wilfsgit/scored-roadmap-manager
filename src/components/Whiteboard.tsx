import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Download, Upload, ZoomIn, ZoomOut } from 'lucide-react';
import { Initiative, AppData } from '../App';
import { InitiativeCard } from './InitiativeCard';
import { InitiativeModal } from './InitiativeModal';
import { GitHubSync } from './GitHubSync';

type WhiteboardProps = {
  productName: string;
  initiatives: Initiative[];
  onUpdateInitiatives: (initiatives: Initiative[]) => void;
  onBack: () => void;
  allData: AppData;
};

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc', 'Later'];
const SCORE_MAX = 25;
const BASE_MONTH_WIDTH = 250; // Largeur de base
const BASE_SCORE_HEIGHT = 40; // Hauteur de base
const MONTH_WIDTH_STEP = 50; // Changement par niveau de zoom
const SCORE_HEIGHT_STEP = 5; // Changement par niveau de zoom

export function Whiteboard({ productName, initiatives, onUpdateInitiatives, onBack, allData }: WhiteboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(0); // 0 = 100%, -1 = zoom out, +1 = zoom in
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const whiteboardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate dimensions based on zoom level
  const MONTH_WIDTH = BASE_MONTH_WIDTH + (zoomLevel * MONTH_WIDTH_STEP);
  const SCORE_HEIGHT = BASE_SCORE_HEIGHT + (zoomLevel * SCORE_HEIGHT_STEP);
  const LATER_WIDTH = MONTH_WIDTH * 1.2; // Proportional to month width
  const zoomPercent = Math.round(100 + (zoomLevel * 20)); // Each level = 20%

  const handleAddInitiative = (initiative: Omit<Initiative, 'id'>) => {
    const newInitiative: Initiative = {
      ...initiative,
      id: Date.now().toString(),
      x: initiative.x || 0,
      width: initiative.width || 200,
    };
    onUpdateInitiatives([...initiatives, newInitiative]);
  };

  const handleUpdateInitiative = (id: string, updates: Partial<Initiative>) => {
    onUpdateInitiatives(
      initiatives.map(i => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  const handleDeleteInitiative = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette initiative ?')) {
      onUpdateInitiatives(initiatives.filter(i => i.id !== id));
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedCard(id);
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
  };



  const openEditModal = (initiative: Initiative) => {
    setEditingInitiative(initiative);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInitiative(null);
  };

  const saveEditedInitiative = (initiative: Omit<Initiative, 'id'>) => {
    if (editingInitiative) {
      handleUpdateInitiative(editingInitiative.id, initiative);
    } else {
      handleAddInitiative(initiative);
    }
  };

  const handlePanStart = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const currentRef = containerRef.current;
      if (currentRef) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-gray-900">{productName}</h1>
              <p className="text-gray-500">{initiatives.length} initiative{initiatives.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSyncOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <Download className="w-4 h-4" />
              GitHub Sync
            </button>
          </div>
        </div>
      </div>

      {/* Whiteboard */}
      <div 
        ref={containerRef}
        className="p-6 overflow-auto"
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div
          ref={whiteboardRef}
          className="relative bg-gray-50 rounded-2xl p-8 min-h-[700px]"
          style={{ 
            width: 'fit-content', 
            minWidth: '100%',
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* Y-axis (Score) */}
          <div className="absolute left-2 top-16 bottom-8 flex flex-col justify-between">
            {Array.from({ length: 6 }, (_, i) => SCORE_MAX - i * 5).map((score) => (
              <div key={score} className="text-gray-500 text-right pr-2" style={{ fontSize: '12px' }}>
                {score}
              </div>
            ))}
          </div>

          {/* X-axis (Months) */}
          <div className="ml-12 mb-4">
            <div className="flex">
              {MONTHS.map((month, index) => (
                <div
                  key={index}
                  className="text-center text-gray-700"
                  style={{ width: `${index === 12 ? LATER_WIDTH : MONTH_WIDTH}px`, fontSize: '14px' }}
                >
                  {month}
                </div>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="ml-12 relative" style={{ height: `${SCORE_MAX * SCORE_HEIGHT}px`, width: `${MONTH_WIDTH * 12 + LATER_WIDTH}px` }}>
            {/* Horizontal grid lines */}
            {Array.from({ length: 6 }, (_, i) => i * 5).map((score) => (
              <div
                key={score}
                className="absolute left-0 right-0 border-t border-dashed border-gray-300"
                style={{ bottom: `${score * SCORE_HEIGHT}px` }}
              />
            ))}

            {/* Vertical grid lines */}
            {MONTHS.map((_, index) => {
              const leftPos = index < 12 ? index * MONTH_WIDTH : MONTH_WIDTH * 12;
              return (
                <div
                  key={index}
                  className="absolute top-0 bottom-0 border-l border-dashed border-gray-300"
                  style={{ left: `${leftPos}px` }}
                />
              );
            })}

            {/* Initiative Cards */}
            {initiatives.map((initiative) => (
              <InitiativeCard
                key={initiative.id}
                initiative={initiative}
                onEdit={openEditModal}
                onDelete={handleDeleteInitiative}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onPositionChange={(x, score, width) => handleUpdateInitiative(initiative.id, { x, score, width })}
                scoreHeight={SCORE_HEIGHT}
                isDragging={draggedCard === initiative.id}
                zoomScale={zoomPercent / 100}
                gridHeight={SCORE_MAX * SCORE_HEIGHT}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Zoom Control Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg border border-gray-200 px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => setZoomLevel(Math.max(-3, zoomLevel - 1))}
          className="text-gray-600 hover:text-indigo-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={zoomLevel <= -3}
          aria-label="Zoom arrière"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-gray-700 min-w-[60px] text-center font-medium">
          {zoomPercent}%
        </span>
        <button
          onClick={() => setZoomLevel(Math.min(5, zoomLevel + 1))}
          className="text-gray-600 hover:text-indigo-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={zoomLevel >= 5}
          aria-label="Zoom avant"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all duration-200 hover:scale-110"
        aria-label="Ajouter une initiative"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Initiative Modal */}
      {isModalOpen && (
        <InitiativeModal
          initiative={editingInitiative}
          onClose={closeModal}
          onSave={saveEditedInitiative}
          onDelete={handleDeleteInitiative}
        />
      )}

      {/* GitHub Sync Modal */}
      {isSyncOpen && (
        <GitHubSync
          productName={productName}
          productData={{ name: productName, initiatives }}
          onClose={() => setIsSyncOpen(false)}
          onDataPulled={(pulledProduct) => {
            // Update initiatives when pulled from GitHub
            onUpdateInitiatives(pulledProduct.initiatives);
          }}
        />
      )}
    </div>
  );
}