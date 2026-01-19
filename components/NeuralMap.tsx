
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Memory, Entity, LifeStory, EntityType } from '../types';

interface NeuralMapProps {
  story: LifeStory;
}

const TYPE_COLORS: Record<string, string> = {
  MEMORY: '#1e293b',
  INTANGIBLE: '#6366f1',
  PERSON: '#6366f1',
  PLACE: '#2dd4bf',
  DREAM: '#fbbf24',
  PASSION: '#f43f5e',
  SKILL: '#a855f7',
  VISION: '#3b82f6',
  OBJECT: '#94a3b8',
  IDENTITY: '#4f46e5'
};

export const NeuralMap: React.FC<NeuralMapProps> = ({ story }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom logic
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const scaleFactor = 0.05;
    const direction = e.deltaY > 0 ? -1 : 1;
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(0.5, prev.scale + direction * scaleFactor), 4)
    }));
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, []);

  const nodes = useMemo(() => {
    const memoryNodes = story.memories.map((m, i) => ({
      id: m.id,
      label: m.narrative.substring(0, 35) + '...',
      fullLabel: m.narrative,
      type: m.type === 'INTANGIBLE' ? 'INTANGIBLE' : 'MEMORY',
      x: 400 + (Math.sin(i * 1.8) * (m.type === 'INTANGIBLE' ? 80 : 200 + i * 5)),
      y: 300 + (Math.cos(i * 1.8) * (m.type === 'INTANGIBLE' ? 60 : 150 + i * 3)),
      color: m.type === 'INTANGIBLE' ? TYPE_COLORS.INTANGIBLE : TYPE_COLORS.MEMORY,
      insight: m.aiInsight,
      isFamily: false
    }));

    const entityNodes = story.entities.map((e, i) => {
      const isFamily = ['Father', 'Mother', 'Grandfather', 'Grandmother', 'Sibling', 'Grandparent'].some(rel => e.relationship?.includes(rel));
      return {
        id: e.id,
        label: e.name,
        fullLabel: `${e.name} ${e.relationship ? `(${e.relationship})` : `(${e.type})`}`,
        type: e.type as string,
        x: 400 + (Math.sin(i * 3.14 + 1.2) * (isFamily ? 120 : 280 + i * 15)),
        y: 300 + (Math.cos(i * 3.14 + 1.2) * (isFamily ? 100 : 200 + i * 8)),
        color: isFamily ? '#1A202C' : (TYPE_COLORS[e.type] || '#ccc'),
        insight: e.metadata?.notes,
        isFamily
      };
    });

    return [...memoryNodes, ...entityNodes];
  }, [story.memories, story.entities]);

  const links = useMemo(() => {
    const results: { s: any, t: any, type: 'entity' | 'neural' | 'family', strength: number }[] = [];
    
    // Explicit entity relationships (lineage)
    story.entities.forEach(ent => {
      if (ent.relatedToId) {
        const source = nodes.find(n => n.id === ent.id);
        const target = nodes.find(n => n.id === ent.relatedToId);
        if (source && target) results.push({ s: source, t: target, type: 'family', strength: 1.0 });
      }
    });

    story.memories.forEach(m => {
      m.entityIds.forEach(eid => {
        const source = nodes.find(n => n.id === m.id);
        const target = nodes.find(n => n.id === eid);
        if (source && target) results.push({ s: source, t: target, type: 'entity', strength: 0.3 });
      });
    });
    return results;
  }, [nodes, story.memories, story.entities]);

  const relatedNodeIds = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const related = new Set<string>();
    links.forEach(l => {
      if (l.s.id === hoveredNode) related.add(l.t.id);
      if (l.t.id === hoveredNode) related.add(l.s.id);
    });
    return related;
  }, [hoveredNode, links]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as any).tagName === 'circle') return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({ ...prev, x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }));
  };
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`h-full w-full bg-[#fdfdfd] overflow-hidden relative selection:none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <div className="absolute top-6 left-6 z-10 space-y-2 pointer-events-none select-none">
        <h2 className="text-[8px] font-black uppercase tracking-[0.5em] text-stone-300 font-sans">Identity Ledger</h2>
        <p className="text-xl font-serif font-black text-stone-900">Neural Heirloom</p>
        <div className="flex gap-2 text-[6px] font-black uppercase text-stone-400">
          <span>Click & Drag to Pan</span>
          <span>•</span>
          <span>Scroll to Zoom</span>
        </div>
      </div>

      <AnimatePresence>
        {hoveredNode && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 glass px-4 py-3 rounded-2xl border border-stone-100 shadow-xl z-20 max-w-xs pointer-events-none"
          >
            <div className="text-[7px] font-black uppercase tracking-widest text-stone-400 mb-1">Active Fragment</div>
            <p className="text-[13px] font-bold text-stone-900 leading-tight">
              {nodes.find(n => n.id === hoveredNode)?.fullLabel}
            </p>
            {nodes.find(n => n.id === hoveredNode)?.insight && (
               <p className="text-[10px] text-stone-500 italic mt-1 leading-snug">
                {nodes.find(n => n.id === hoveredNode)?.insight}
               </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <g 
          style={{ 
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, 
            transformOrigin: '400px 300px',
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' 
          }}
        >
          {links.map((link, i) => {
            const isActive = hoveredNode === link.s.id || hoveredNode === link.t.id;
            return (
              <motion.line 
                key={i} initial={{ opacity: 0 }}
                animate={{ 
                  opacity: isActive ? 0.9 : 0.04, 
                  strokeWidth: link.type === 'family' ? 2 : (isActive ? 1.5 : 0.5), 
                  stroke: link.type === 'family' ? '#111' : '#cbd5e1' 
                }}
                x1={link.s.x} y1={link.s.y} x2={link.t.x} y2={link.t.y} 
              />
            );
          })}

          {nodes.map(node => {
            const isActive = hoveredNode === node.id;
            const isRelated = relatedNodeIds.has(node.id);
            const isFamily = node.isFamily;
            
            return (
              <motion.g 
                key={node.id} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)}
                initial={{ scale: 0, opacity: 0 }} 
                animate={{ scale: isActive ? 1.3 : isRelated ? 1.15 : 1, opacity: (hoveredNode && !isActive && !isRelated) ? 0.2 : 1 }}
                className="cursor-pointer"
              >
                <circle 
                  cx={node.x} cy={node.y} 
                  r={isFamily ? 8 : (node.type === 'PLACE' ? 6 : 4)} 
                  fill={node.color} 
                  stroke={isFamily ? 'white' : 'none'}
                  strokeWidth={2}
                  className="shadow-sm"
                />
                <motion.text 
                  x={node.x + 12} y={node.y + 4} 
                  className={`text-[6px] font-black font-sans fill-stone-900 uppercase tracking-tighter transition-opacity duration-300 ${(isActive || isRelated) ? 'opacity-100' : 'opacity-0'}`}
                >
                  {node.label}
                </motion.text>
              </motion.g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
