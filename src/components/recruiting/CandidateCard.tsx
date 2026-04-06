import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Mail, Phone, FileText, MoreHorizontal } from 'lucide-react';
import { Card } from '../ui';
import type { Candidate, CandidateStatus } from '../../types';

interface CandidateCardProps {
  candidate: Candidate;
  onClick?: () => void;
  onStatusChange?: (newStatus: CandidateStatus) => void;
}

const COLUMNS_LIST: CandidateStatus[] = [
  'PRESELECCIONADOS', 
  'CONTACTADOS', 
  'ENTREVISTA (CONSULTORA)', 
  'ENTREVISTA TÉCNICA (CLIENTE)', 
  'PREOCUPACIONALES', 
  'OFERTA', 
  'CONTRATADOS', 
  'DESCARTADOS'
];

export function CandidateCard({ candidate, onClick, onStatusChange }: CandidateCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: candidate.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 200 : (isMenuOpen ? 100 : 1),
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8, // mt-2 equivalent
        left: rect.right - 192, // Align right with button, 192 is w-48
      });
    }
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card 
        onClick={onClick}
        className="mb-2 p-2.5 active:cursor-grabbing cursor-grab relative group/card hover:ring-1 hover:ring-brand-lime/30 transition-all border-white/5 bg-white/[0.03]"
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-display font-bold text-sm text-white/90 group-hover/card:text-brand-lime transition-colors truncate pr-4">
            {candidate.name}
          </h4>
          <div className="relative shrink-0">
            <button 
              ref={buttonRef}
              onClick={handleMenuToggle}
              className={`p-1 rounded-lg transition-colors ${isMenuOpen ? 'bg-brand-blue-primary text-white' : 'bg-black/20 text-white/20 hover:text-white'}`}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            
            {isMenuOpen && createPortal(
              <>
                <div 
                  className="fixed inset-0 z-[9998]" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                />
                <div 
                  className="fixed w-48 bg-brand-blue-dark border border-brand-sky/30 rounded-xl shadow-2xl z-[9999] py-1 overflow-hidden animate-in fade-in zoom-in duration-200"
                  style={{ 
                    top: `${menuPosition.top}px`, 
                    left: `${menuPosition.left}px` 
                  }}
                >
                  <div className="px-3 py-2 border-b border-white/5 mb-1">
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Mover a...</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                    {COLUMNS_LIST.map((status) => (
                      <button
                        key={status}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusChange?.(status);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[11px] font-sans transition-colors flex items-center justify-between
                          ${candidate.status === status 
                            ? 'bg-brand-blue-primary/20 text-brand-sky' 
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                          }
                        `}
                      >
                        {status}
                        {candidate.status === status && <div className="w-1 h-1 rounded-full bg-brand-sky" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>,
              document.body
            )}
          </div>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-1.5 text-[11px] text-white/40">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{candidate.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/40">
            <Phone className="w-3 h-3 shrink-0" />
            <span>{candidate.phone}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {candidate.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-brand-sky/10 text-brand-sky text-[9px] font-bold rounded uppercase tracking-wider border border-brand-sky/10">
              {tag}
            </span>
          ))}
          {candidate.cvUrl && (
            <span className="px-1.5 py-0.5 bg-brand-lime/10 text-brand-lime text-[9px] font-bold rounded flex items-center gap-1 border border-brand-lime/10">
              <FileText className="w-2.5 h-2.5" />
              CV
            </span>
          )}
        </div>

        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
           <span className="text-[9px] text-white/10 uppercase font-bold tracking-widest leading-none">
            {candidate.id?.slice(-4)}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-brand-sky/20" />
        </div>
      </Card>
    </div>
  );
}
