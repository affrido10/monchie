
import React, { useEffect, useRef, useState } from 'react';
import { Note } from '../types';

interface GraphViewProps {
  notes: Note[];
  onNoteSelect: (id: string) => void;
  onClose: () => void;
}

interface Node {
  id: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Link {
  source: string;
  target: string;
}

const GraphView: React.FC<GraphViewProps> = ({ notes, onNoteSelect, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use refs to store simulation state across re-renders to prevent "jitter" on state updates
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Link[]>([]);
  const hoveredNodeIdRef = useRef<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Initialize nodes and links only when notes list actually changes
  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Preserve existing positions if possible, or create new ones
    const newNodes: Node[] = notes.map(n => {
      const existing = nodesRef.current.find(en => en.id === n.id);
      if (existing) return existing;

      return {
        id: n.id,
        title: n.title,
        x: width / 2 + (Math.random() - 0.5) * width * 0.5,
        y: height / 2 + (Math.random() - 0.5) * height * 0.5,
        vx: 0,
        vy: 0,
        radius: 8 + (notes.filter(other => other.content.includes(`[[${n.title}]]`)).length * 5)
      };
    });

    const newLinks: Link[] = [];
    notes.forEach(note => {
      const matches = note.content.match(/\[\[(.*?)\]\]/g);
      if (matches) {
        matches.forEach(match => {
          const targetTitle = match.slice(2, -2);
          const targetNote = notes.find(n => n.title.toLowerCase() === targetTitle.toLowerCase());
          if (targetNote) {
            newLinks.push({ source: note.id, target: targetNote.id });
          }
        });
      }
    });

    nodesRef.current = newNodes;
    linksRef.current = newLinks;
  }, [notes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationFrameId: number;

    const update = () => {
      const width = canvas.width = window.innerWidth;
      const height = canvas.height = window.innerHeight;
      const nodes = nodesRef.current;
      const links = linksRef.current;

      // Force Directed Simulation
      nodes.forEach(node => {
        // Center attraction (gravity)
        node.vx += (width / 2 - node.x) * 0.00015;
        node.vy += (height / 2 - node.y) * 0.00015;

        // Node repulsion (anti-gravity)
        nodes.forEach(other => {
          if (node === other) return;
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 1;
          
          if (dist < 400) {
            const force = (400 - dist) * 0.00008;
            node.vx -= (dx / dist) * force;
            node.vy -= (dy / dist) * force;
          }
        });

        // Link constraints (springs)
        links.forEach(link => {
          const s = nodes.find(n => n.id === link.source);
          const t = nodes.find(n => n.id === link.target);
          if (s && t && (node.id === s.id || node.id === t.id)) {
            const dx = t.x - s.x;
            const dy = t.y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const strength = 0.0001;
            const desiredDist = 180;
            const diff = (dist - desiredDist) * strength;
            
            if (node.id === s.id) {
              node.vx += dx * diff;
              node.vy += dy * diff;
            } else {
              node.vx -= dx * diff;
              node.vy -= dy * diff;
            }
          }
        });

        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.94; // Friction
        node.vy *= 0.94;

        // Boundary bounce
        if (node.x < 50) node.vx += 0.5;
        if (node.x > width - 50) node.vx -= 0.5;
        if (node.y < 50) node.vy += 0.5;
        if (node.y > height - 50) node.vy -= 0.5;
      });

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Draw links
      ctx.lineWidth = 1.5;
      links.forEach(link => {
        const s = nodes.find(n => n.id === link.source);
        const t = nodes.find(n => n.id === link.target);
        if (s && t) {
          const isRelatedToHover = hoveredNodeIdRef.current === s.id || hoveredNodeIdRef.current === t.id;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
          ctx.strokeStyle = isRelatedToHover 
            ? 'rgba(168, 85, 247, 0.4)' 
            : 'rgba(168, 85, 247, 0.08)';
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        const isHovered = hoveredNodeIdRef.current === node.id;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + (isHovered ? 6 : 0), 0, Math.PI * 2);
        
        if (isHovered) {
          ctx.fillStyle = '#a855f7';
          ctx.shadowBlur = 30;
          ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
        } else {
          ctx.fillStyle = '#52525b';
          ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw labels
        if (isHovered || node.radius > 12) {
          const fontSize = isHovered ? 14 : 10;
          ctx.font = `${isHovered ? 'bold' : 'medium'} ${fontSize}px Inter`;
          ctx.fillStyle = isHovered ? '#fff' : 'rgba(255, 255, 255, 0.5)';
          ctx.textAlign = 'center';
          ctx.fillText(node.title, node.x, node.y - node.radius - (isHovered ? 15 : 10));
        }
      });

      animationFrameId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Empty dependency array keeps the loop stable

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hovered = nodesRef.current.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius + 15;
    });

    const newId = hovered ? hovered.id : null;
    if (newId !== hoveredNodeIdRef.current) {
      hoveredNodeIdRef.current = newId;
      setHoveredNodeId(newId); // Still update state for React UI if needed
    }
  };

  const handleClick = () => {
    if (hoveredNodeIdRef.current) {
      onNoteSelect(hoveredNodeIdRef.current);
      onClose();
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-3xl flex flex-col items-center animate-in fade-in duration-700">
      <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
        <h2 className="text-3xl font-serif font-bold text-white mb-2 tracking-tight">Knowledge Topography</h2>
        <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-500 font-black">Interactive Neural Map of Thoughts</p>
      </div>
      
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-4 text-zinc-500 hover:text-white transition-all hover:scale-110 z-[160] bg-white/5 rounded-full backdrop-blur-md border border-white/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <canvas 
        ref={canvasRef} 
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="w-full h-full cursor-crosshair" 
      />
      
      <div className="absolute bottom-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4 duration-1000">
        <div className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-bold px-10 py-4 border border-white/5 bg-white/5 rounded-full backdrop-blur-2xl shadow-2xl">
          Hover to illuminate connections • Click to dive deep into a thought
        </div>
      </div>
    </div>
  );
};

export default GraphView;
