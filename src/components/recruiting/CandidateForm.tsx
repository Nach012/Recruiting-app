import { useState, useEffect, useCallback } from 'react';
import { X, Upload, Loader2, Sparkles, CheckCircle2, AlertCircle, UserMinus } from 'lucide-react';
import { Button } from '../ui';
import { candidateService } from '../../services/candidateService';
import { extractTextFromPDF } from '../../services/pdfService';
import { simulateCVAnalysis } from '../../services/aiService';
import type { CandidateStatus } from '../../types';

type FlowState = 'idle' | 'processing' | 'done' | 'error';

interface CandidateFormProps {
  projectId: string;
  initialStatus?: CandidateStatus;
  onClose: () => void;
  onSuccess: () => void;
}

export function CandidateForm({
  projectId,
  initialStatus = 'PRESELECCIONADOS',
  onClose,
  onSuccess,
}: CandidateFormProps) {
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [currentFileName, setCurrentFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Results counting
  const [totalFiles, setTotalFiles] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Escape key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(f => f.type === 'application/pdf');
      const invalidCount = fileArray.length - validFiles.length;

      if (validFiles.length === 0) {
        setErrorMsg('No se detectaron archivos PDF válidos.');
        setFlowState('error');
        return;
      }

      setTotalFiles(validFiles.length);
      setSkippedCount(invalidCount);
      setCreatedCount(0);
      setDuplicateCount(0);
      setProcessedCount(0);
      setFlowState('processing');
      setErrorMsg('');

      try {
        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          setProcessedCount(i + 1);
          setCurrentFileName(file.name);

          // Step 1 — extract text
          const pdfText = await extractTextFromPDF(file);

          // Step 2 — AI analysis (mock)
          const aiResult = await simulateCVAnalysis(pdfText);

          try {
            // Step 3 — Upload binary to Firebase Storage
            const uploadResult = await candidateService.uploadCV(file, aiResult.name || 'Candidato');

            // Step 4 — Persist candidate to Firestore with final reference
            await candidateService.createCandidate({
              projectId: projectId, // Mandatorio para vinculación Pipeline
              documentId: aiResult.documentId,
              name: aiResult.name || 'Candidato sin nombre',
              email: aiResult.email || '',
              phone: aiResult.phone || '',
              status: initialStatus,
              tags: aiResult.tags || [],
              location: aiResult.location,
              links: aiResult.links,
              experience: aiResult.experience,
              education: aiResult.education,
              aiSummary: aiResult.aiSummary,
              expectedSalary: aiResult.expectedSalary,
              interviewNotes: aiResult.interviewNotes || '',
              cvUrl: uploadResult.url,   // URL real de Storage
              cvPath: uploadResult.path, // Path real de Storage
            });
            setCreatedCount(prev => prev + 1);
          } catch (e: any) {
            if (e.message === 'DUPLICATE_DOCUMENT') {
              setDuplicateCount(prev => prev + 1);
            } else {
              throw e;
            }
          }
        }

        setFlowState('done');
      } catch (err) {
        console.error('Error in CV processing pipeline:', err);
        setErrorMsg('Ocurrió un error procesando los archivos. Intentá de nuevo.');
        setFlowState('error');
      }
    },
    [projectId, initialStatus]
  );

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) processFiles(files);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processFiles(files);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-blue-dark/80 backdrop-blur-md cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-brand-blue-dark border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-white">Cargar Candidatos</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── IDLE state: drop zone ── */}
        {(flowState === 'idle' || flowState === 'error') && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 transition-all duration-300
              ${isDragOver
                ? 'border-brand-lime/60 bg-brand-lime/10 scale-[1.02]'
                : 'border-white/10 hover:border-brand-sky/30 bg-white/5'}
            `}
          >
            <Upload className={`w-12 h-12 transition-colors ${isDragOver ? 'text-brand-lime' : 'text-white/20'}`} />
            <div className="text-center">
              <p className="text-white/70 text-sm font-medium">
                Arrastrá tus CVs aquí o hacé click para seleccionar
              </p>
              <p className="text-white/30 text-xs mt-1">Soporte multi-PDF con IA</p>
            </div>
            <input
              type="file"
              accept=".pdf"
              multiple
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileInput}
            />
            {flowState === 'error' && (
              <p className="text-red-400 text-xs mt-2 animate-in fade-in duration-300 text-center">{errorMsg}</p>
            )}
          </div>
        )}

        {/* ── PROCESSING state (extracting / analyzing) ── */}
        {flowState === 'processing' && (
          <div className="flex flex-col items-center justify-center gap-6 py-12 animate-in fade-in duration-300">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-sky/20 to-brand-lime/20 flex items-center justify-center overflow-hidden">
                <Sparkles className="w-10 h-10 text-brand-lime animate-pulse" />
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-brand-lime transition-all duration-500" 
                  style={{ width: `${(processedCount / totalFiles) * 100}%` }}
                />
              </div>
              <Loader2 className="absolute -bottom-2 -right-2 w-8 h-8 text-brand-sky animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-brand-sky font-bold text-xs uppercase tracking-widest">
                Ingresando {processedCount} de {totalFiles}
              </p>
              <p className="text-white font-semibold text-sm truncate max-w-[280px]">
                {currentFileName}
              </p>
            </div>
          </div>
        )}

        {/* ── DONE state: success summary ── */}
        {flowState === 'done' && (
          <div className="space-y-6 py-2 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center justify-center gap-3">
               <div className="w-16 h-16 rounded-full bg-brand-lime/20 flex items-center justify-center">
                 <CheckCircle2 className="w-8 h-8 text-brand-lime" />
               </div>
               <h3 className="text-white font-bold text-xl uppercase tracking-tighter">¡Proceso Completado!</h3>
            </div>

            <div className="grid gap-2">
              {/* EXITOSOS */}
              <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-white/80 font-medium text-sm">Candidatos Creados</span>
                </div>
                <span className="text-xl font-bold text-emerald-400">{createdCount}</span>
              </div>

              {/* DUPLICADOS */}
              <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                    <UserMinus className="w-5 h-5" />
                  </div>
                  <span className="text-white/80 font-medium text-sm">Ya existían (Duplicados)</span>
                </div>
                <span className="text-xl font-bold text-orange-400">{duplicateCount}</span>
              </div>

              {/* OMITIDOS */}
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/40">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <span className="text-white/40 font-medium text-sm">Omitidos (No PDF)</span>
                </div>
                <span className="text-xl font-bold text-white/20">{skippedCount}</span>
              </div>
            </div>

            <Button 
              variant="secondary" 
              className="w-full py-4 text-base shadow-xl" 
              onClick={onSuccess}
            >
              Finalizar Carga
            </Button>
          </div>
        )}

        {/* Footer – only show cancel in idle/error */}
        {(flowState === 'idle' || flowState === 'error') && (
          <div className="flex gap-4 mt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
