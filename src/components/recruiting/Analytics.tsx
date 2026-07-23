import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Briefcase, 
  Filter, 
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';
import { Card } from '../ui';
import { projectService } from '../../services/projectService';
import { candidateService } from '../../services/candidateService';
import type { Project, Candidate, CandidateStatus } from '../../types';

interface AnalyticsProps {
  userId: string;
}

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

export function Analytics({ userId }: AnalyticsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | '30' | '90' | '365'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  useEffect(() => {
    const loadAllData = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
        // 1. Obtener proyectos del usuario
        const projectsData = await projectService.getAllProjects(userId);
        setProjects(projectsData);
        
        // 2. Obtener candidatos de cada proyecto
        const allCandidatesPromises = projectsData.map(p => 
          candidateService.getCandidatesByProject(p.id!)
        );
        const candidatesByProjectArray = await Promise.all(allCandidatesPromises);
        const flatCandidates = candidatesByProjectArray.flat();
        setCandidates(flatCandidates);
      } catch (error) {
        console.error("Error al cargar datos en Analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [userId]);

  // Listar clientes únicos para el segmentador
  const clientsList = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.client))).filter(Boolean);
  }, [projects]);

  // Aplicar filtros dinámicos (useMemo reactivo)
  const filteredData = useMemo(() => {
    let projs = [...projects];
    
    // Filtro de Tiempo
    if (timeFilter !== 'all') {
      const days = parseInt(timeFilter, 10);
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      projs = projs.filter(p => p.createdAt >= cutoff);
    }
    
    // Filtro de Cliente
    if (clientFilter !== 'all') {
      projs = projs.filter(p => p.client === clientFilter);
    }
    
    const projIds = new Set(projs.map(p => p.id));
    const cands = candidates.filter(c => projIds.has(c.projectId));
    
    return { projects: projs, candidates: cands };
  }, [projects, candidates, timeFilter, clientFilter]);

  // Métricas y KPIs calculados
  const stats = useMemo(() => {
    const totalProjects = filteredData.projects.length;
    const activeProjects = filteredData.projects.filter(p => p.status === 'Abierta').length;
    const closedProjects = filteredData.projects.filter(p => p.status === 'Cerrada').length;
    const totalCandidates = filteredData.candidates.length;

    // Calcular Time to Hire promedio (solo para candidatos CONTRATADOS)
    const hiredCandidates = filteredData.candidates.filter(c => c.status === 'CONTRATADOS');
    let totalHiredDays = 0;
    let hiredCount = 0;

    hiredCandidates.forEach(c => {
      const hiredEntry = c.history?.find(h => h.stage === 'CONTRATADOS');
      if (hiredEntry) {
        const hiredDate = hiredEntry.date;
        const createdDate = c.createdAt || c.history?.[0]?.date || hiredDate;
        const diffTime = Math.max(0, hiredDate - createdDate);
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        totalHiredDays += diffDays;
        hiredCount++;
      }
    });

    const avgTimeToHire = hiredCount > 0 ? Math.round(totalHiredDays / hiredCount) : 0;
    const conversionRate = totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0;

    // Distribución por Modalidad de búsqueda
    const modalityCounts = {
      Presencial: filteredData.projects.filter(p => p.modality === 'Presencial').length,
      Híbrido: filteredData.projects.filter(p => p.modality === 'Híbrido').length,
      Remoto: filteredData.projects.filter(p => p.modality === 'Remoto').length,
    };

    // Distribución de candidatos por etapa
    const stageCounts = STAGES.reduce((acc, stage) => {
      acc[stage] = filteredData.candidates.filter(c => c.status === stage).length;
      return acc;
    }, {} as Record<CandidateStatus, number>);

    return {
      totalProjects,
      activeProjects,
      closedProjects,
      totalCandidates,
      avgTimeToHire,
      conversionRate,
      modalityCounts,
      stageCounts
    };
  }, [filteredData]);

  // Buscar el valor máximo en etapa para porcentajes relativos en gráficos
  const maxStageCount = useMemo(() => {
    const counts = Object.values(stats.stageCounts);
    return Math.max(...counts, 1);
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-brand-sky/20 border-t-brand-lime rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* HEADER DE ESTADÍSTICAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-white">Panel de Analíticas</h2>
          <p className="text-white/40 mt-1">Métricas de rendimiento e indicadores de conversión del ecosistema Conectō.</p>
        </div>

        {/* SELECTORES / FILTROS */}
        <div className="flex flex-wrap items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 px-3 text-white/40">
            <Filter className="w-4 h-4 text-brand-sky" />
            <span className="text-xs font-bold uppercase tracking-wider">Filtros:</span>
          </div>

          {/* Filtro de Tiempo */}
          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none focus:ring-1 focus:ring-brand-sky transition-all appearance-none pr-8 cursor-pointer font-sans"
            >
              <option value="all" className="bg-brand-blue-dark">Histórico Completo</option>
              <option value="30" className="bg-brand-blue-dark">Últimos 30 días</option>
              <option value="90" className="bg-brand-blue-dark">Últimos 90 días</option>
              <option value="365" className="bg-brand-blue-dark">Último Año</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-white/30 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filtro de Cliente */}
          <div className="relative">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none focus:ring-1 focus:ring-brand-sky transition-all appearance-none pr-8 cursor-pointer font-sans max-w-[160px]"
            >
              <option value="all" className="bg-brand-blue-dark">Todos los Clientes</option>
              {clientsList.map(client => (
                <option key={client} value={client} className="bg-brand-blue-dark">{client}</option>
              ))}
            </select>
            <Briefcase className="w-3.5 h-3.5 text-white/30 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* PROCESOS */}
        <Card className="p-6 bg-white/[0.02] border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 bg-brand-blue-primary/10 rounded-bl-3xl text-brand-sky">
            <Briefcase className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Búsquedas Activas</p>
          <h3 className="text-4xl font-display font-bold text-white mb-2">{stats.totalProjects}</h3>
          <div className="flex gap-3 text-[10px] uppercase font-bold tracking-wider">
            <span className="text-brand-lime">{stats.activeProjects} Abiertas</span>
            <span className="text-white/20">•</span>
            <span className="text-white/40">{stats.closedProjects} Cerradas</span>
          </div>
        </Card>

        {/* CANDIDATOS GESTIONADOS */}
        <Card className="p-6 bg-white/[0.02] border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 bg-brand-sky/10 rounded-bl-3xl text-brand-sky">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Candidatos Gestionados</p>
          <h3 className="text-4xl font-display font-bold text-white mb-2">{stats.totalCandidates}</h3>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Perfiles en Base de Datos</p>
        </Card>

        {/* TIME TO HIRE */}
        <Card className="p-6 bg-white/[0.02] border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 bg-brand-lime/10 rounded-bl-3xl text-brand-lime">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Time to Hire Promedio</p>
          <h3 className="text-4xl font-display font-bold text-white mb-2">
            {stats.avgTimeToHire > 0 ? `${stats.avgTimeToHire} días` : '—'}
          </h3>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Ingreso a Contratación</p>
        </Card>

        {/* HIRING CONVERSION RATE */}
        <Card className="p-6 bg-white/[0.02] border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 bg-purple-500/10 rounded-bl-3xl text-purple-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Tasa de Contratación</p>
          <h3 className="text-4xl font-display font-bold text-white mb-2">{stats.conversionRate}%</h3>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Conversión del Pipeline</p>
        </Card>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO EMBUTO DEL PIPELINE (2/3 de ancho) */}
        <Card className="lg:col-span-2 p-8 bg-white/[0.01] border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Layers className="w-5 h-5 text-brand-lime" />
            <div>
              <h3 className="font-display font-bold text-lg text-white">Embudo de Candidatos (Pipeline Funnel)</h3>
              <p className="text-xs text-white/40">Cantidad de candidatos activos y distribuidos por etapa del tablero.</p>
            </div>
          </div>

          <div className="space-y-4">
            {STAGES.map((stage) => {
              const count = stats.stageCounts[stage] || 0;
              const percentage = Math.round((count / maxStageCount) * 100);
              
              return (
                <div key={stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold tracking-wider">
                    <span className="text-white/60 uppercase text-[10px] tracking-widest">{stage}</span>
                    <span className="text-brand-sky">{count} {count === 1 ? 'Candidato' : 'Candidatos'}</span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-sky via-brand-blue-primary to-brand-lime rounded-full transition-all duration-1000"
                      style={{ width: `${maxStageCount > 0 ? percentage : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* DISTRIBUCIÓN POR MODALIDAD */}
        <Card className="p-8 bg-white/[0.01] border-white/5 flex flex-col justify-between space-y-6">
          <div className="space-y-1.5 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-brand-sky" />
              <h3 className="font-display font-bold text-lg text-white">Modalidad de Búsqueda</h3>
            </div>
            <p className="text-xs text-white/40">Distribución física de los proyectos activos.</p>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-6 py-4">
            {Object.entries(stats.modalityCounts).map(([modality, count]) => {
              const total = stats.totalProjects || 1;
              const percent = Math.round((count / total) * 100);
              
              let progressColor = 'bg-brand-blue-primary';
              let badgeColor = 'text-brand-sky bg-brand-sky/10 border-brand-sky/20';
              if (modality === 'Híbrido') {
                progressColor = 'bg-brand-sky';
              } else if (modality === 'Remoto') {
                progressColor = 'bg-brand-lime';
                badgeColor = 'text-brand-lime bg-brand-lime/10 border-brand-lime/20';
              }

              return (
                <div key={modality} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-widest ${badgeColor}`}>
                      {modality}
                    </span>
                    <span className="text-white text-sm font-bold">{count} ({percent}%)</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${progressColor} rounded-full transition-all duration-1000`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
