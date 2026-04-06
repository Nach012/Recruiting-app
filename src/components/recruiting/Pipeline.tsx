import { useState, useEffect, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { 
  ChevronLeft,
  Plus, 
  RotateCw,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DroppableColumn } from './DroppableColumn';
import { CandidateCard } from './CandidateCard';
import { CandidateForm } from './CandidateForm';
import { CandidateDetails } from './CandidateDetails';
import { DiscardModal } from './DiscardModal';
import { candidateService } from '../../services/candidateService';
import { exportCandidatesToExcel } from '../../utils/excelExport';
import type { Project, Candidate, CandidateStatus } from '../../types';
import { Button } from '../ui';

// CRITICAL SYSTEM RESET: Definición estática de STAGES
const STAGES: CandidateStatus[] = [
  'PRESELECCIONADOS', 
  'CONTACTADOS', 
  'ENTREVISTA (CONSULTORA)', 
  'ENTREVISTA TÉCNICA (CLIENTE)', 
  'PREOCUPACIONALES',
  'OFERTA',
  'CONTRATADOS',
  'DESCARTADOS'
];

interface PipelineProps {
  project: Project;
  onBack: () => void;
}

export function Pipeline({ project, onBack }: PipelineProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<{ show: boolean, status: CandidateStatus }>({ show: false, status: 'PRESELECCIONADOS' });
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [discardingCandidate, setDiscardingCandidate] = useState<{ candidate: Candidate, targetStatus: CandidateStatus } | null>(null);
  const [showExportToast, setShowExportToast] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Lógica de Agrupamiento Robusta (Blindada contra undefined)
  const candidatesByStage = useMemo(() => {
    const safeCandidates = candidates || [];
    const grouped: Record<string, Candidate[]> = {};
    STAGES.forEach(stage => {
      grouped[stage] = safeCandidates.filter(c => c.status === stage);
    });
    return grouped;
  }, [candidates]);

  useEffect(() => {
    if (!project.id) return;
    
    setIsLoading(true);
    setError(null);

    const unsubscribe = candidateService.subscribeToProjectCandidates(
      project.id, 
      (data) => {
        setCandidates(data || []);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("DND Factory Error:", err);
        setError(err.message || "Error de sincronización con Firestore");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [project.id, retryKey]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCandidate = candidates.find((c: Candidate) => c.id === activeId);
    let newStatus: CandidateStatus | null = null;
    
    if (STAGES.includes(overId as any)) {
      newStatus = overId as CandidateStatus;
    } else {
      const overCandidate = candidates.find((c: Candidate) => c.id === overId);
      if (overCandidate) newStatus = overCandidate.status;
    }

    if (activeCandidate && newStatus && activeCandidate.status !== newStatus) {
      if (newStatus === 'DESCARTADOS') {
        setDiscardingCandidate({ candidate: activeCandidate, targetStatus: newStatus });
        return;
      }
      try {
        await candidateService.updateCandidateStatus(activeId, newStatus);
      } catch (err) {
        console.error("Error updating status in Factory:", err);
      }
    }
  };

  const handleConfirmDiscard = async (instance: string, reason: string) => {
    if (!discardingCandidate) return;
    const { candidate, targetStatus } = discardingCandidate;
    const discardInfo = {
      instance,
      reason,
      discardedAt: Date.now(),
      previousStatus: candidate.status as CandidateStatus
    };

    try {
      await candidateService.updateCandidateStatus(candidate.id!, targetStatus, discardInfo);
      setDiscardingCandidate(null);
    } catch (err) {
      console.error("Error persisting discard in Factory:", err);
    }
  };

  const handleExport = () => {
    exportCandidatesToExcel(candidates, project.title);
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3000);
  };

  const activeCandidate = candidates.find((c: Candidate) => c.id === activeId);

  return (
    <div className="space-y-8 h-full flex flex-col min-h-[calc(100vh-160px)]">
      {/* BARRA SUPERIOR (Header Estático) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="group flex items-center gap-2 p-2 pr-4 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all border border-transparent hover:border-white/10"
          >
            <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold uppercase tracking-widest">Panel</span>
          </button>
          
          <div className="h-10 w-px bg-white/10 mx-2 hidden md:block" />

          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-display font-bold text-white tracking-tight">{project.title}</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-widest bg-brand-lime/10 text-brand-lime border border-brand-lime/20">
                 PROYECTO ACTIVO
              </span>
            </div>
            <p className="text-white/40 text-xs mt-1 font-medium">{project.client}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button onClick={() => setRetryKey(prev => prev + 1)} disabled={isLoading} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 transition-all active:scale-95 border border-white/5 disabled:opacity-50">
             <RotateCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-brand-lime' : ''}`} />
           </button>
           
           <button 
             onClick={handleExport}
             disabled={isLoading || candidates.length === 0}
             className="flex items-center gap-2 p-3 px-4 bg-brand-sky/10 hover:bg-brand-sky/20 rounded-2xl text-brand-sky transition-all active:scale-95 border border-brand-sky/20 disabled:opacity-30"
           >
             <FileSpreadsheet className="w-5 h-5" />
             <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Exportar Excel</span>
           </button>

           <Button icon={Plus} onClick={() => setShowAddForm({ show: true, status: 'PRESELECCIONADOS' })} className="shadow-2xl shadow-brand-lime/20">
            Cargar Candidatos
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white/5 rounded-[40px] border border-white/5">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-6" />
          <h3 className="text-xl font-display font-bold text-white mb-2 uppercase">Fallo de Comunicación</h3>
          <p className="text-white/40 text-center max-w-sm mb-8 text-sm">{error}</p>
          <Button variant="outline" onClick={() => setRetryKey(prev => prev + 1)} icon={RotateCw}>Reintentar</Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-10 scrollbar-hide flex-1 items-start">
            {STAGES.map((stage) => (
              <div key={stage} className="w-80 shrink-0 h-full flex flex-col min-h-[70vh]">
                <div className="flex items-center justify-between mb-6 px-2">
                    <h3 className="text-[10px] font-black text-brand-lime uppercase tracking-[0.2em]">{stage}</h3>
                    <div className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-bold text-white/30 border border-white/5">
                      {candidatesByStage[stage]?.length || 0}
                    </div>
                </div>

                <DroppableColumn status={stage} className="flex-1 flex flex-col h-full bg-white/[0.01] rounded-[32px] p-2">
                  <SortableContext items={candidatesByStage[stage]?.map(c => c.id!) || []} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4 flex-1 flex flex-col min-h-[300px]">
                      {isLoading ? (
                        <div className="animate-pulse space-y-4 p-2">
                           <div className="h-32 bg-white/5 rounded-[28px] border border-white/5" />
                           <div className="h-32 bg-white/5 rounded-[28px] border border-white/5" />
                        </div>
                      ) : (
                        <>
                          {(candidatesByStage[stage] || []).map((candidate) => (
                            <CandidateCard 
                              key={candidate.id} 
                              candidate={candidate} 
                              onClick={() => setSelectedCandidate(candidate)}
                              onStatusChange={async (newStatus) => {
                                if (candidate.id) {
                                  if (newStatus === 'DESCARTADOS') {
                                    setDiscardingCandidate({ candidate, targetStatus: newStatus });
                                  } else {
                                    await candidateService.updateCandidateStatus(candidate.id, newStatus);
                                  }
                                }
                              }}
                            />
                          ))}
                          
                          {(candidatesByStage[stage]?.length || 0) === 0 && (
                            <div className="flex-1 h-20 flex flex-col items-center justify-center text-center w-full border-2 border-dashed border-white/5 rounded-[32px] transition-colors hover:bg-white/[0.04]">
                              <p className="text-white/10 text-[10px] font-black uppercase tracking-[0.3em]">Cero Perfiles</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              </div>
            ))}
            
            <DragOverlay>
              {activeId && activeCandidate ? (
                <div className="rotate-3 scale-105 transition-transform duration-200">
                   <CandidateCard candidate={activeCandidate} />
                </div>
              ) : null}
            </DragOverlay>
          </div>
        </DndContext>
      )}

      {/* TOAST DE EXPORTACIÓN */}
      <AnimatePresence>
        {showExportToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="bg-brand-sky border border-white/20 shadow-2xl shadow-brand-sky/20 rounded-2xl px-6 py-4 flex items-center gap-3">
              <div className="bg-white/20 p-1 rounded-full">
                 <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-sm">Reporte Excel descargado con éxito</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAddForm.show && (
        <CandidateForm 
          projectId={project.id!} 
          initialStatus={showAddForm.status}
          onClose={() => setShowAddForm({ show: false, status: 'PRESELECCIONADOS' })} 
          onSuccess={() => setShowAddForm({ show: false, status: 'PRESELECCIONADOS' })}
        />
      )}

      {selectedCandidate && (
        <CandidateDetails 
          candidate={selectedCandidate} 
          onClose={() => setSelectedCandidate(null)} 
          onUpdate={() => setSelectedCandidate(null)}
        />
      )}

      {discardingCandidate && (
        <DiscardModal onClose={() => setDiscardingCandidate(null)} onConfirm={handleConfirmDiscard} />
      )}
    </div>
  );
}
