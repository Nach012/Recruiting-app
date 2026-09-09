import React, { useState } from 'react';
import { Calendar, Clock, User, Mail, Video, X, ExternalLink } from 'lucide-react';
import { Button } from '../ui';
import type { Candidate } from '../../types';
import { getGoogleCalendarUrl } from '../../utils/calendar';

interface ScheduleInterviewModalProps {
  candidate: Candidate;
  projectTitle: string;
  defaultRecruiterName?: string;
  onClose: () => void;
  onScheduled?: () => void;
}

export function ScheduleInterviewModal({
  candidate,
  projectTitle,
  defaultRecruiterName = 'Ignacio',
  onClose,
  onScheduled
}: ScheduleInterviewModalProps) {
  // Fecha por defecto: mañana en día hábil (o hoy)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState(defaultDateStr);
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState<number>(45); // 45 minutos por defecto
  const [recruiterName, setRecruiterName] = useState(defaultRecruiterName);
  const [attendeeEmail, setAttendeeEmail] = useState(candidate.email || '');

  // Título exacto precargado requerido: [Nombre Candidato] + [Nombre Reclutador] - [Nombre Proyecto]
  const eventTitle = `${candidate.name} + ${recruiterName.trim() || 'Reclutador'} - ${projectTitle}`;

  const handleOpenCalendar = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !time) return;

    // Construir fechas de inicio y fin en horario local
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    const description = `Entrevista laboral para la posición de ${projectTitle} en Conectō Recruiting.
    
Candidato: ${candidate.name}
Contacto: ${candidate.phone || 'No especificado'}
Email: ${attendeeEmail}
Reclutador: ${recruiterName}

Generado automáticamente desde Conectō Recruiting.`;

    const url = getGoogleCalendarUrl({
      title: eventTitle,
      startDate,
      endDate,
      description,
      location: 'Google Meet',
      attendeeEmail: attendeeEmail
    });

    // Abrir Google Calendar en una nueva pestaña con la sesión activa
    window.open(url, '_blank', 'noopener,noreferrer');

    if (onScheduled) {
      onScheduled();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-brand-blue-dark border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow de acento */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-sky/10 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-sky/10 text-brand-sky rounded-2xl border border-brand-sky/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white">Agendar Entrevista</h2>
              <p className="text-xs text-white/40">Sincronización directa con Google Calendar & Meet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white rounded-full hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleOpenCalendar} className="space-y-5 pt-5 relative z-10">
          {/* Vista previa del título preformateado */}
          <div className="bg-brand-blue-primary/10 border border-brand-sky/20 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sky">
              Título del Evento en Google Calendar
            </span>
            <p className="text-sm font-bold text-white font-mono break-words">
              {eventTitle}
            </p>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-sky transition-colors w-full text-sm [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Hora de Inicio
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-sky transition-colors w-full text-sm [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Duración */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
              Duración de la Entrevista
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    duration === mins
                      ? 'bg-brand-sky/20 border-brand-sky text-brand-sky shadow-lg shadow-brand-sky/10'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 inline mr-1.5" />
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Reclutador */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-sky" />
              Nombre del Reclutador (para el título)
            </label>
            <input
              type="text"
              value={recruiterName}
              onChange={(e) => setRecruiterName(e.target.value)}
              placeholder="Ej: Ignacio"
              required
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-sky transition-colors placeholder:text-white/20 w-full text-sm"
            />
          </div>

          {/* Email del Candidato (Invitado automático) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-brand-lime" />
              Email del Candidato (Invitado automático)
            </label>
            <input
              type="email"
              value={attendeeEmail}
              onChange={(e) => setAttendeeEmail(e.target.value)}
              placeholder="email@candidato.com"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-sky transition-colors placeholder:text-white/20 w-full text-sm"
            />
            <p className="text-[11px] text-white/40 mt-1 flex items-center gap-1">
              <Video className="w-3 h-3 text-brand-lime shrink-0" />
              Google Calendar le enviará la invitación por correo con enlace a Google Meet.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="secondary"
              className="flex-1 !bg-brand-sky hover:!bg-brand-sky/90 !text-brand-blue-dark font-bold shadow-lg shadow-brand-sky/20 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir en Calendar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
