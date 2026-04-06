import { useState, useEffect } from 'react';
import { Plus, Briefcase, Users, Search as SearchIcon, MoreVertical } from 'lucide-react';
import { Card, Button } from '../ui';
import type { Project } from '../../types';
import { projectService } from '../../services/projectService';
import { candidateService } from '../../services/candidateService';

interface DashboardProps {
  onViewProject: (project: Project) => void;
  onNewProject: () => void;
  onEditProject: (project: Project) => void;
}

export function Dashboard({ onViewProject, onNewProject, onEditProject }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [candidateCounts, setCandidateCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const projectsData = await projectService.getAllProjects();
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
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditProject(project);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-brand-blue-primary/20 rounded-xl text-brand-sky">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-white group-hover:text-brand-lime transition-colors">
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
    </div>
  );
}
