import { useState, useEffect } from 'react';
import { 
  X, Mail, Phone, FileText, MessageSquare, Edit3, Check, 
  ChevronDown, AlertCircle, MapPin, Link2,
  Briefcase, GraduationCap, DollarSign, Clock, Sparkles
} from 'lucide-react';
import { Button, Input } from '../ui';
import type { Candidate, CandidateStatus } from '../../types';
import { candidateService } from '../../services/candidateService';
import { DiscardModal } from './DiscardModal';

interface CandidateDetailsProps {
  candidate: Candidate;
  onClose: () => void;
  onUpdate: () => void;
}

const COLUMNS: CandidateStatus[] = [
  'PRESELECCIONADOS',
  'CONTACTADOS',
  'ENTREVISTA (CONSULTORA)',
  'ENTREVISTA TÉCNICA (CLIENTE)',
  'PREOCUPACIONALES',
  'OFERTA',
  'CONTRATADOS',
  'DESCARTADOS'
];

export function CandidateDetails({ candidate, onClose, onUpdate }: CandidateDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<CandidateStatus | null>(null);
  const [editedData, setEditedData] = useState({
    name: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    tags: candidate.tags.join(', '),
    location: candidate.location || '',
    linkedin: candidate.links?.linkedin || '',
    aiSummary: candidate.aiSummary || '',
    expectedSalary: String(candidate.expectedSalary || ''),
    interviewNotes: candidate.interviewNotes || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setEditedData({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      tags: candidate.tags.join(', '),
      location: candidate.location || '',
      linkedin: candidate.links?.linkedin || '',
      aiSummary: candidate.aiSummary || '',
      expectedSalary: String(candidate.expectedSalary || ''),
      interviewNotes: candidate.interviewNotes || ''
    });
  }, [candidate]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tagsArray = editedData.tags
        .split(',')
        .map(s => s.trim().startsWith('#') ? s.trim() : `#${s.trim()}`)
        .filter(s => s.length > 1);
      if (candidate.id) {
        await candidateService.updateCandidate(candidate.id, {
          name: editedData.name,
          email: editedData.email,
          phone: editedData.phone,
          tags: tagsArray,
          location: editedData.location,
          links: { linkedin: editedData.linkedin },
          aiSummary: editedData.aiSummary,
          expectedSalary: editedData.expectedSalary,
          interviewNotes: editedData.interviewNotes
        });
        setIsEditing(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: CandidateStatus) => {
    if (newStatus === 'DESCARTADOS') {
      setPendingStatus(newStatus);
      setShowDiscardModal(true);
      return;
    }
    if (candidate.id) {
      await candidateService.updateCandidateStatus(candidate.id, newStatus);
      onUpdate();
    }
  };

  const handleConfirmDiscard = async (instance: string, reason: string) => {
    if (!pendingStatus || !candidate.id) return;
    const discardInfo = {
      instance,
      reason,
      discardedAt: Date.now(),
      previousStatus: candidate.status
    };
    try {
      await candidateService.updateCandidateStatus(candidate.id, pendingStatus, discardInfo);
      setShowDiscardModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error discarding candidate:', error);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-brand-blue-dark border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="h-full flex flex-col">

        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-blue-primary flex items-center justify-center text-xl font-bold shadow-lg shadow-brand-blue-primary/20 shrink-0">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-white leading-tight">{candidate.name}</h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-white/40 text-xs">
                  <MapPin className="w-3 h-3" />
                  {candidate.location || 'Ubicación no especificada'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Status Bar ── */}
        <div className="px-5 py-2 bg-brand-blue-primary/5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Etapa:</span>
            <div className="flex items-center gap-1 bg-brand-blue-primary/10 px-2.5 py-1 rounded-full border border-brand-blue-primary/20">
              <span className="text-brand-sky text-xs font-bold">{candidate.status}</span>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-0.5 hover:bg-white/10 rounded text-brand-sky/40 hover:text-brand-sky transition-colors"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 w-56 bg-brand-blue-dark border border-brand-sky/30 rounded-xl shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in duration-200">
                      <div className="max-h-60 overflow-y-auto">
                        {COLUMNS.map(status => (
                          <button
                            key={status}
                            onClick={() => { handleStatusChange(status); setIsMenuOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between
                              ${candidate.status === status ? 'bg-brand-blue-primary/20 text-brand-sky' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                          >
                            {status}
                            {candidate.status === status && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
            ID: {candidate.id?.slice(-6).toUpperCase()}
          </span>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
          {isEditing ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <Input label="Nombre Completo" value={editedData.name} onChange={(e) => setEditedData({ ...editedData, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Email" value={editedData.email} onChange={(e) => setEditedData({ ...editedData, email: e.target.value })} />
                <Input label="Teléfono" value={editedData.phone} onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })} />
              </div>
              <Input label="Ubicación" value={editedData.location} onChange={(e) => setEditedData({ ...editedData, location: e.target.value })} />
              <Input label="Remuneración Pretendida" value={editedData.expectedSalary} onChange={(e) => setEditedData({ ...editedData, expectedSalary: e.target.value })} />
              <Input label="Resumen IA" isTextArea rows={3} value={editedData.aiSummary} onChange={(e) => setEditedData({ ...editedData, aiSummary: e.target.value })} />
              <Input label="Notas Internas de Entrevista" isTextArea rows={5} value={editedData.interviewNotes} onChange={(e) => setEditedData({ ...editedData, interviewNotes: e.target.value })} />
              <Input label="Etiquetas (separadas por coma)" value={editedData.tags} onChange={(e) => setEditedData({ ...editedData, tags: e.target.value })} />
            </div>
          ) : (
            <>
              {/* AI Summary */}
              <section className="relative p-4 bg-gradient-to-br from-brand-lime/10 to-transparent border border-brand-lime/20 rounded-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-10 h-10 text-brand-lime" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-brand-lime/20 rounded-md">
                    <Sparkles className="w-3.5 h-3.5 text-brand-lime" />
                  </div>
                  <h3 className="text-xs font-bold text-brand-lime uppercase tracking-widest">Resumen IA Profile</h3>
                </div>
                <p className="text-white/80 leading-relaxed text-sm italic">
                  "{candidate.aiSummary || 'Análisis pendiente de procesamiento...'}"
                </p>
              </section>

              {/* Professional Profile (experience – read-only) + Salary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <section className="space-y-2">
                  <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Perfil Profesional
                  </h3>
                  <div className="bg-white/5 px-4 py-3 rounded-xl flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-brand-sky/50" />
                      <span className="text-xs text-white/30 font-medium uppercase tracking-wider">Experiencia Total</span>
                    </div>
                    {/* Read-only – auto-populated by IA */}
                    <span className="text-sm font-bold text-brand-sky/70 italic">
                      {candidate.experience || '—'}
                    </span>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Condiciones
                  </h3>
                  <div className="bg-brand-lime/5 px-4 py-3 rounded-xl flex items-center justify-between border border-brand-lime/10 group hover:bg-brand-lime/10 transition-all">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-brand-lime" />
                      <span className="text-xs text-brand-lime/60 font-medium uppercase tracking-wider">Remun. Pretendida</span>
                    </div>
                    <span className="text-sm font-bold text-brand-lime">{candidate.expectedSalary || '—'}</span>
                  </div>
                </section>
              </div>

              {/* Education – read-only */}
              <section className="space-y-2">
                <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Formación Académica
                </h3>
                <div className="grid gap-2">
                  {candidate.education && candidate.education.length > 0 ? (
                    candidate.education.map((edu, i) => (
                      <div key={i} className="bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 hover:border-brand-sky/20 transition-all group">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-white group-hover:text-brand-sky transition-colors">{edu.degree}</span>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/50 font-medium uppercase">{edu.period}</span>
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">{edu.institution}</p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white/5 p-5 rounded-xl text-center border border-dashed border-white/10">
                      <p className="text-xs text-white/20 italic">No hay información de estudios registrada.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Internal Notes */}
              <section className="space-y-2">
                <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Notas Internas de Entrevista
                </h3>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 min-h-[90px] leading-relaxed text-white/70 text-sm whitespace-pre-wrap">
                  {candidate.interviewNotes || "Sin notas todavía. Hacé click en 'Editar Ficha' para añadir comentarios."}
                </div>
              </section>

              {/* Discard info */}
              {candidate.status === 'DESCARTADOS' && candidate.discardInfo && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-3 animate-in slide-in-from-top duration-500">
                  <div className="flex items-center gap-2 text-red-400">
                    <div className="p-1.5 bg-red-400/20 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest">Feedback de Descarte</h3>
                  </div>
                  <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{candidate.discardInfo.instance}</p>
                  <div className="bg-black/20 p-4 rounded-xl italic text-white/80 text-sm leading-relaxed">
                    "{candidate.discardInfo.reason}"
                  </div>
                </div>
              )}

              {/* Contact (with LinkedIn) + Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/5">
                <section className="space-y-2">
                  <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Contacto</h3>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Mail className="w-3.5 h-3.5 text-brand-sky shrink-0" />
                      <span>{candidate.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Phone className="w-3.5 h-3.5 text-brand-sky shrink-0" />
                      <span>{candidate.phone}</span>
                    </div>
                    {candidate.links?.linkedin && (
                      <a
                        href={candidate.links.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        title={candidate.links.linkedin}
                        className="flex items-center gap-2 text-brand-sky text-sm group hover:text-brand-sky/80 transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate text-xs underline underline-offset-2">LinkedIn</span>
                      </a>
                    )}
                  </div>
                </section>
                <section className="space-y-2">
                  <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Etiquetas</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-brand-sky/10 text-brand-sky text-[10px] font-bold rounded-md border border-brand-sky/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              </div>

              {/* CV */}
              {candidate.cvUrl && (
                <section className="space-y-2">
                  <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Documentación</h3>
                  <a href={candidate.cvUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-lime" />
                      <span className="text-sm text-white font-medium">Currículum Vitae (PDF)</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs h-7">Abrir</Button>
                  </a>
                </section>
              )}

              {/* Audit Trail */}
              <section className="space-y-3 pt-4 border-t border-white/5">
                <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Historial de Movimientos
                </h3>
                <div className="relative pl-5 space-y-5 before:absolute before:left-[9px] before:top-1 before:bottom-1 before:w-[2px] before:bg-white/5">
                  {(candidate.history || [{ stage: candidate.status, date: candidate.createdAt }]).map((entry, index, arr) => (
                    <div key={index} className="relative">
                      <div className={`absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 border-brand-blue-dark transition-colors duration-500
                        ${index === arr.length - 1 ? 'bg-brand-lime' : 'bg-brand-sky/40'}`}
                      />
                      <p className="text-xs font-bold text-white/90">{entry.stage}</p>
                      <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mt-0.5">
                        {new Date(entry.date).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-white/10 bg-white/5 flex gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button variant="secondary" className="flex-1" icon={Check} isLoading={isSaving} onClick={handleSave}>Guardar Cambios</Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="flex-1" icon={Edit3} onClick={() => setIsEditing(true)}>Editar Ficha</Button>
              <div className="flex-1 relative">
                <Button variant="secondary" className="w-full" icon={ChevronDown}>Mover Etapa</Button>
                <select
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={candidate.status}
                  onChange={(e) => handleStatusChange(e.target.value as CandidateStatus)}
                >
                  {COLUMNS.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {showDiscardModal && (
        <DiscardModal onClose={() => setShowDiscardModal(false)} onConfirm={handleConfirmDiscard} />
      )}
    </div>
  );
}
