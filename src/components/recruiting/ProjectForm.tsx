import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, MapPin, Briefcase } from 'lucide-react';
import { Button, Input } from '../ui';
import type { Project } from '../../types';

const projectSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  client: z.string().min(2, "El cliente es requerido"),
  description: z.string().min(10, "La descripción es requerida (min 10)"),
  conditions: z.string().min(5, "Las condiciones son requeridas"),
  location: z.string().min(2, "La ubicación es requerida"),
  modality: z.enum(['Presencial', 'Híbrido', 'Remoto']),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  status: z.enum(['Abierta', 'Cerrada']),
  endDate: z.string().optional(),
  closingReason: z.enum(['Proceso completado', 'Proceso suspendido']).optional(),
}).refine((data) => {
  if (data.status === 'Cerrada') {
    return !!data.endDate && !!data.closingReason;
  }
  return true;
}, {
  message: "Fecha y motivo son obligatorios para cerrar la búsqueda",
  path: ["status"]
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
  initialData?: Project;
  isLoading?: boolean;
}

export function ProjectForm({ onClose, onSubmit, initialData, isLoading }: ProjectFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData || {
      status: 'Abierta',
      modality: 'Remoto',
      startDate: new Date().toISOString().split('T')[0]
    }
  });

  const selectedStatus = useWatch({
    control,
    name: "status"
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-blue-dark/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-brand-blue-dark border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh] scrollbar-thin">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-bold text-white">
            {initialData ? 'Editar Búsqueda' : 'Nueva Búsqueda'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Título de la Posición"
              placeholder="Ej: Senior Frontend Developer"
              error={errors.title?.message}
              {...register('title')}
            />

            <Input 
              label="Cliente"
              placeholder="Nombre de la empresa"
              error={errors.client?.message}
              {...register('client')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="block text-sm font-medium text-white/60 px-1">Ubicación</label>
               <div className="relative">
                 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                 <input 
                  {...register('location')}
                  placeholder="Ciudad, País"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-sky/50 transition-all"
                 />
                 {errors.location && <p className="text-red-400 text-[10px] mt-1 px-1">{errors.location.message}</p>}
               </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/60 px-1">Modalidad</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <select 
                  {...register('modality')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-sky/50 transition-all appearance-none"
                >
                  <option value="Presencial" className="bg-brand-blue-dark text-white">Presencial</option>
                  <option value="Híbrido" className="bg-brand-blue-dark text-white">Híbrido</option>
                  <option value="Remoto" className="bg-brand-blue-dark text-white">Remoto</option>
                </select>
                {errors.modality && <p className="text-red-400 text-[10px] mt-1 px-1">{errors.modality.message}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Fecha de Inicio"
              type="date"
              error={errors.startDate?.message}
              {...register('startDate')}
            />

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2 px-1">Estado</label>
              <select 
                {...register('status')}
                className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-sky/50 transition-all appearance-none ${selectedStatus === 'Cerrada' ? 'text-orange-400' : ''}`}
              >
                <option value="Abierta" className="bg-brand-blue-dark text-white">Abierta</option>
                <option value="Cerrada" className="bg-brand-blue-dark text-white">Cerrada</option>
              </select>
              {errors.status && <p className="text-red-400 text-[10px] mt-1 px-1 font-medium">{errors.status.message}</p>}
            </div>
          </div>

          {/* Conditional Cierre Fields */}
          {selectedStatus === 'Cerrada' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-orange-500/5 border border-orange-500/10 rounded-2xl animate-in slide-in-from-top duration-300">
               <div>
                  <label className="block text-sm font-medium text-orange-200/60 mb-2 px-1">Motivo de Cierre</label>
                  <select 
                    {...register('closingReason')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none"
                  >
                    <option value="" className="bg-brand-blue-dark text-white">Seleccioná motivo...</option>
                    <option value="Proceso completado" className="bg-brand-blue-dark text-white">Proceso completado</option>
                    <option value="Proceso suspendido" className="bg-brand-blue-dark text-white">Proceso suspendido</option>
                  </select>
               </div>
               
               <Input 
                 label="Fecha de Fin"
                 type="date"
                 {...register('endDate')}
               />
             </div>
          )}

          <Input 
            label="Condiciones (Sueldo, Beneficios)"
            placeholder="Ej: $1.000.000 + OSDE..."
            error={errors.conditions?.message}
            {...register('conditions')}
          />

          <Input 
            label="Descripción / JD"
            placeholder="Detalles de la búsqueda..."
            isTextArea
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="flex gap-4 pt-4 sticky bottom-0 bg-brand-blue-dark pb-2">
            <Button 
              type="button"
              variant="outline" 
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              variant="secondary" 
              className="flex-1"
              isLoading={isLoading}
            >
              {initialData ? 'Guardar Cambios' : 'Crear Proyecto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
