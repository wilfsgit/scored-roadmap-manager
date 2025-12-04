import { useState, useRef, useEffect } from 'react';
import { Edit2, GripVertical, Star } from 'lucide-react';
import { Initiative } from '../App';

type InitiativeCardProps = {
  initiative: Initiative;
  onEdit: (initiative: Initiative) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onPositionChange: (x: number, score: number, width: number) => void;
  scoreHeight: number;
  isDragging: boolean;
  zoomScale: number;
  gridHeight: number;
};

export function InitiativeCard({
  initiative,
  onEdit,
  onDragStart,
  onDragEnd,
  onPositionChange,
  scoreHeight,
  isDragging,
  zoomScale,
  gridHeight,
}: InitiativeCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 200 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, width: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Calculate position based on x and score
    const x = initiative.x || 0;
    // Center the card vertically on the score value (subtract half the estimated card height)
    const cardHeightEstimate = 90 * zoomScale; // Approximate card height scaled by zoom
    const y = (25 - initiative.score) * scoreHeight - (cardHeightEstimate / 2);
    const width = initiative.width || 200;
    setPosition({ x, y });
    setSize({ width });
  }, [initiative.x, initiative.score, initiative.width, scoreHeight, zoomScale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    // Don't start dragging if clicking on resize handle
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
    
    // Prevent pan when clicking on card
    e.stopPropagation();
    
    setDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    onDragStart(initiative.id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setResizing(true);
    setResizeStart({
      x: e.clientX,
      width: size.width,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition({ x: newX, y: newY });
      } else if (resizing) {
        const deltaX = e.clientX - resizeStart.x;
        const newWidth = Math.max(150, resizeStart.width + deltaX);
        setSize({ width: newWidth });
      }
    };

    const handleMouseUp = () => {
      if (dragging) {
        setDragging(false);
        onDragEnd();

        // Calculate score from position (accounting for vertical centering)
        const cardHeightEstimate = 90 * zoomScale;
        const adjustedY = position.y + (cardHeightEstimate / 2);
        const score = Math.max(0, Math.min(25, 25 - Math.round(adjustedY / scoreHeight)));

        onPositionChange(Math.max(0, position.x), score, size.width);
      } else if (resizing) {
        setResizing(false);
        // Save the new width
        const cardHeightEstimate = 90 * zoomScale;
        const adjustedY = position.y + (cardHeightEstimate / 2);
        const score = Math.max(0, Math.min(25, 25 - Math.round(adjustedY / scoreHeight)));
        onPositionChange(position.x, score, size.width);
      }
    };

    if (dragging || resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, resizing, dragStart, resizeStart, position, size, scoreHeight, onDragEnd, onPositionChange, zoomScale]);

  // Calculate scaled dimensions and font sizes
  const scaledMinWidth = Math.max(50, 50 * zoomScale);
  const scaledPadding = Math.max(2, 12 * zoomScale);
  const titleFontSize = Math.max(8, 12 * zoomScale);
  const scoreFontSize = Math.max(8, 10 * zoomScale);
  const objectiveFontSize = Math.max(8, 11 * zoomScale);
  const iconSize = Math.max(12, 16 * zoomScale);

  // Generate gradient colors from base color
  const baseColor = initiative.color || '#DBEAFE'; // Bleu clair par défaut
  
  // Function to adjust color luminosity (HSL-based for better visual results)
  const adjustColorLuminosity = (hex: string, luminosityChange: number) => {
    // Convert hex to RGB
    const num = parseInt(hex.replace('#', ''), 16);
    let r = (num >> 16) / 255;
    let g = ((num >> 8) & 0x00FF) / 255;
    let b = (num & 0x0000FF) / 255;

    // Convert RGB to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    // Adjust luminosity
    l = Math.max(0, Math.min(1, l + luminosityChange));

    // Convert HSL back to RGB
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    // Convert back to hex
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const darkColor = adjustColorLuminosity(baseColor, -0.08);
  const borderColor = adjustColorLuminosity(baseColor, -0.15);
  const scoreBackgroundColor = adjustColorLuminosity(baseColor, -0.12); // Couleur pour le fond du score
  const resizeHandleColor = adjustColorLuminosity(baseColor, -0.20); // Couleur pour la poignée de resize

  // Si c'est un milestone, afficher une étoile
  if (initiative.isMilestone) {
    const starSize = 40 * zoomScale; // Réduit de 60 à 40
    
    return (
      <div
        ref={cardRef}
        className={`absolute cursor-move group ${
          isDragging ? 'opacity-50' : ''
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${starSize}px`,
          height: `${starSize}px`,
          transform: dragging ? 'scale(1.1)' : 'scale(1)',
          zIndex: dragging ? 1000 : 1,
        }}
        onMouseDown={handleMouseDown}
        title={initiative.title}
      >
        <Star
          fill={baseColor}
          stroke={borderColor}
          strokeWidth={2}
          style={{
            width: '100%',
            height: '100%',
            filter: 'drop-shadow(3px 3px 4px rgba(0,0,0,0.2))',
          }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(initiative);
          }}
          className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-700 hover:text-gray-900 bg-white rounded-full p-1"
          style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Edit2 style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
        </button>
        
        {/* Ligne verticale pointillée au survol */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none border-l-2 border-dashed"
          style={{ 
            top: `${starSize}px`,
            height: `${gridHeight - position.y - starSize / 2}px`,
            borderColor: borderColor,
            zIndex: 999,
          }}
        />
        
        {/* Tooltip au survol */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap"
          style={{ 
            top: `${starSize + 10}px`,
            zIndex: 1001,
          }}
        >
          {initiative.title}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      </div>
    );
  }

  // Affichage normal (post-it)
  return (
    <div
      ref={cardRef}
      className={`absolute shadow-lg cursor-move group ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width * zoomScale}px`,
        minWidth: `${scaledMinWidth}px`,
        transform: dragging || resizing ? 'scale(1.02)' : 'scale(1)',
        zIndex: dragging || resizing ? 1000 : 1,
        padding: `${scaledPadding}px`,
        background: `linear-gradient(to bottom, ${baseColor}, ${darkColor})`,
        borderTop: `4px solid ${borderColor}`,
        boxShadow: '3px 3px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)',
        borderRight: '1px solid rgba(0,0,0,0.05)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="relative" style={{ marginBottom: `${scaledPadding / 2}px` }}>
        <h3 
          className="text-gray-800 line-clamp-2 break-words text-center"
          style={{ 
            fontSize: `${titleFontSize}px`,
            paddingLeft: `${scaledPadding * 2}px`,
            paddingRight: `${scaledPadding * 2}px`,
            fontFamily: 'Arial, sans-serif',
            
          }}
        >
          {initiative.title}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(initiative);
          }}
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-700 hover:text-gray-900"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Edit2 style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
        </button>
      </div>
      <div className="text-center" style={{ marginBottom: `${scaledPadding / 2}px` }}>
        <span 
          className="inline-block bg-yellow-400 text-gray-800"
          style={{
            fontSize: `${scoreFontSize}px`,
            padding: `${scaledPadding / 3}px ${scaledPadding / 2}px`,
            fontWeight: 'bold',
            backgroundColor: scoreBackgroundColor,
          }}
        >
          {initiative.score}
        </span>
      </div>
      <p 
        className="text-gray-700 line-clamp-2 break-words text-center"
        style={{ 
          fontSize: `${objectiveFontSize}px`,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
        }}
      >
        {initiative.objective}
      </p>
      
      {/* Resize Handle */}
      <div
        className="resize-handle absolute right-0 top-0 bottom-0 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ width: `${Math.max(1, 8 * zoomScale)}px` }}
        onMouseDown={handleResizeMouseDown}
      >
        <div 
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-yellow-600" 
          style={{
            width: `${Math.max(1, 4 * zoomScale)}px`,
            height: `${Math.max(16, 32 * zoomScale)}px`,
            backgroundColor: resizeHandleColor,
          }}
        />
      </div>
    </div>
  );
}