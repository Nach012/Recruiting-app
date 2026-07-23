import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Briefcase, Users, Search as SearchIcon, MoreVertical, Trash2, Edit3, AlertTriangle, X } from 'lucide-react';
import { Card, Button } from '../ui';
import type { Project } from '../../types';
import { projectService } from '../../services/projectService';
import { candidateService } from '../../services/candidateService';

interface DashboardProps {
  userId: string;
  onViewProject: (project: Project) => void;
  onNewProject: () => void;
  onEditProject: (project: Project) => void;
}

export function Dashboard({ userId, onViewProject, onNewProject, onEditProject }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [candidateCounts, setCandidateCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuProjectId, setActiveMenuProjectId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    try {
      const projectsData = await projectService.getAllProjects(userId);
      setProjects(projectsData);
      
      const counts: Record<string, number> = {};
      for (const project of projectsData) {
        if (project.id) {
          const candidates = await candidateService.getCandidatesByProject(project.id);
          counts[project.id] = candidates.length;
        }
      }
      setCandidateCounts(counts);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuToggle = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if (activeMenuProjectId === project.id) {
      setActiveMenuProjectId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right - 160 + window.scrollX,
      });
      setActiveMenuProjectId(project.id!);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProject || !deletingProject.id) return;
    setIsLoading(true);
    try {
      await candidateService.deleteCandidatesByProject(deletingProject.id);
      await projectService.deleteProject(deletingProject.id);
      setDeletingProject(null);
      await loadData();
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-white">Búsquedas Activas</h2>
          <p className="text-white/40 mt-1">Gestioná tus proyectos de selección de forma centralizada.</p>
        </div>
        <Button icon={Plus} variant="secondary" onClick={onNewProject}>
          Nueva Búsqueda
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white/5 animate-pulse h-48 rounded-2xl" />
          ))
        ) : projects.length > 0 ? (
          projects.map((project: Project) => (
            <Card 
              key={project.id} 
              className="relative group overflow-hidden cursor-pointer"
              onClick={() => onViewProject(project)}
            >
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                 <button 
                   onClick={(e) => handleMenuToggle(e, project)}
                   className={`p-2 rounded-full transition-colors ${
                     activeMenuProjectId === project.id 
                       ? 'bg-brand-blue-primary text-white' 
                       : 'bg-black/25 text-white/50 hover:text-white'
                   }`}
                 >
                   <MoreVertical className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="flex items-start gap-4 mb-6">
                 <div className="p-3 bg-brand-blue-primary/20 rounded-xl text-brand-sky">
                   <Briefcase className="w-6 h-6" />
                 </div>
                 <div className="pr-8">
                   <h3 className="font-display font-bold text-xl text-white group-hover:text-brand-lime transition-colors truncate max-w-[180px]">
                     {project.title}
                   </h3>
                   <p className="text-brand-sky/60 text-sm font-medium">{project.client}</p>
                 </div>
               </div>

               <p className="text-white/40 text-sm line-clamp-2 mb-4 min-h-[40px]">
                 {project.description}
               </p>

               <div className="flex items-center gap-3 mb-6 text-[10px] uppercase tracking-wider font-bold">
                  <span className="px-2 py-1 bg-white/5 text-white/40 rounded-md border border-white/5">
                    {project.modality}
                  </span>
                  <span className="text-brand-sky/40">
                    {project.location}
                  </span>
               </div>

               <div className="flex items-center justify-between pt-6 border-t border-white/5">
                 <div className="flex items-center gap-2 text-white/30 text-sm">
                   <Users className="w-4 h-4" />
                   <span>{candidateCounts[project.id!] || 0} Candidatos</span>
                 </div>
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                   project.status === 'Abierta' 
                     ? 'bg-brand-lime/10 text-brand-lime' 
                     : 'bg-white/10 text-white/40'
                 }`}>
                   {project.status}
                 </span>
               </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchIcon className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">No hay búsquedas activas</h3>
            <p className="text-white/40 max-w-xs mx-auto mb-8">
              Empezá creando tu primer proyecto de selección para el cliente.
            </p>
            <Button variant="outline" icon={Plus} onClick={onNewProject}>
              Crear Proyecto
            </Button>
          </div>
        )}
      </div>

      {activeMenuProjectId && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuProjectId(null);
            }}
          />
          <div 
            className="fixed w-40 bg-brand-blue-dark border border-brand-sky/30 rounded-xl shadow-2xl z-[9999] py-1 overflow-hidden animate-in fade-in zoom-in duration-200"
            style={{ 
              top: `${menuPosition.top}px`, 
              left: `${menuPosition.left}px` 
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                const project = projects.find(p => p.id === activeMenuProjectId);
                if (project) onEditProject(project);
                setActiveMenuProjectId(null);
              }}
              className="w-full text-left px-4 py-2.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4 text-brand-sky" />
              Editar Búsqueda
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const project = projects.find(p => p.id === activeMenuProjectId);
                if (project) setDeletingProject(project);
                setActiveMenuProjectId(null);
              }}
              className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2 border-t border-white/5"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Búsqueda
            </button>
          </div>
        </>,
        document.body
      )}

      {deletingProject && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-brand-blue-dark border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-xl text-red-500 animate-pulse">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-display font-bold text-white">Eliminar Búsqueda</h2>
              </div>
              <button 
                onClick={() => setDeletingProject(null)} 
                className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <p className="text-sm text-white/60 leading-relaxed">
                ¿Estás seguro de que querés eliminar la búsqueda <strong className="text-white font-bold">"{deletingProject.title}"</strong> de <strong className="text-white font-bold">{deletingProject.client}</strong>?
              </p>
              
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex gap-3 text-red-400">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  <strong>ADVERTENCIA:</strong> Esta acción es irreversible y eliminará en cascada todos los candidatos y archivos de CV cargados asociados a esta búsqueda.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setDeletingProject(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex-1 !bg-red-500 hover:!bg-red-600 border-none shadow-lg shadow-red-500/20"
                  onClick={handleDeleteConfirm}
                >
                  Confirmar Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
