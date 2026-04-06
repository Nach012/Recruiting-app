import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../ui';

interface DiscardModalProps {
  onClose: () => void;
  onConfirm: (instance: string, reason: string) => void;
}

const INSTANCES = [
  'Primer contacto',
  'Primera entrevista',
  'Entrevista técnica',
  'Preocupacionales',
  'Oferta',
  'Otro'
];

export function DiscardModal({ onClose, onConfirm }: DiscardModalProps) {
  const [instance, setInstance] = useState(INSTANCES[0]);
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(instance, reason);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-brand-blue-dark border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-xl text-red-500">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-display font-bold text-white">Feedback de Descarte</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2 px-1">¿En qué instancia se descartó?</label>
            <select 
              value={instance}
              onChange={(e) => setInstance(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-sky/50 transition-all appearance-none"
            >
              {INSTANCES.map(item => (
                <option key={item} value={item} className="bg-brand-blue-dark">{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2 px-1">Motivo del descarte</label>
            <textarea 
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describí brevemente el motivo..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-sky/50 transition-all resize-none h-32"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 !bg-red-500 hover:!bg-red-600 border-none"
              onClick={handleConfirm}
              disabled={!reason.trim()}
            >
              Confirmar Descarte
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
