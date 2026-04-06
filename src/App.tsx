import { useState } from 'react';
import { Dashboard } from './components/recruiting/Dashboard';
import { Pipeline } from './components/recruiting/Pipeline';
import { ProjectForm } from './components/recruiting/ProjectForm';
import { projectService } from './services/projectService';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/auth/Login';
import type { Project } from './types';
import { auth } from './config/firebase';
import { signOut } from 'firebase/auth';
import { LogOut, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './components/ui';
import './App.css';

function AppContent() {
  const { user, loading, error } = useAuth();
  const [view, setView] = useState<{ type: 'dashboard' | 'pipeline', data?: Project }>({ type: 'dashboard' });
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-blue-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-sky/20 border-t-brand-lime rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-blue-dark flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-[40px] p-10 text-center backdrop-blur-xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">Error de Conexión</h2>
          <p className="text-white/40 text-sm mb-8 leading-relaxed">
            No pudimos establecer conexión con los servicios de Conecto. 
            <br/><span className="text-[10px] font-mono mt-2 block opacity-50">{error}</span>
          </p>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => window.location.reload()} icon={RefreshCw}>
              Recargar aplicación
            </Button>
            <button 
              onClick={handleLogout}
              className="w-full py-3 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Cerrar Sesión para resetear
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleSaveProject = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (editingProject?.id) {
        await projectService.updateProject(editingProject.id, data);
      } else {
        await projectService.createProject(data);
      }
      setShowForm(false);
      setEditingProject(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("Error saving project:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewProject = (project: Project) => {
    setView({ type: 'pipeline', data: project });
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-brand-blue-dark text-white font-body selection:bg-brand-lime selection:text-brand-blue-dark">
      <header className="py-6 px-4 md:px-6 border-b border-white/10 backdrop-blur-lg sticky top-0 z-40 bg-brand-blue-dark/50">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
             <h1 
              className="text-2xl md:text-3xl font-display font-bold text-brand-sky hover:text-white cursor-pointer transition-all active:scale-95 group flex items-center gap-2"
              onClick={() => setView({ type: 'dashboard' })}
              title="Volver al Dashboard"
            >
              Conectō <span className="text-brand-lime group-hover:text-white transition-colors">Recruiting</span>
            </h1>
            {view.type === 'pipeline' && (
              <div className="hidden sm:flex items-center gap-2 text-white/20 animate-in fade-in slide-in-from-left duration-500">
                <ChevronRight className="w-4 h-4" />
                <span className="text-sm font-medium truncate max-w-[150px] uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">{view.data?.title}</span>
              </div>
            )}
          </div>
          <nav className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 pr-6 border-r border-white/10">
               <div className="w-8 h-8 rounded-full bg-brand-lime/10 flex items-center justify-center text-brand-lime text-xs font-bold ring-1 ring-brand-lime/20">
                  {user.email?.[0].toUpperCase()}
               </div>
               <span className="text-xs font-medium text-white/40">{user.email}</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </header>

      <main className="w-full px-4 md:px-6 py-8 min-h-[calc(100vh-200px)] flex flex-col">
        {view.type === 'dashboard' ? (
          <Dashboard 
            key={refreshKey}
            onViewProject={handleViewProject} 
            onNewProject={() => {
              setEditingProject(null);
              setShowForm(true);
            }}
            onEditProject={handleEditProject}
          />
        ) : view.type === 'pipeline' ? (
          <Pipeline 
            project={view.data!} 
            onBack={() => setView({ type: 'dashboard' })} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mb-8 border border-white/10">
               <AlertCircle className="w-12 h-12 text-brand-lime" />
            </div>
            <h2 className="text-4xl font-display font-bold text-white mb-4">404</h2>
            <p className="text-white/40 max-w-xs mb-10 text-sm leading-relaxed uppercase tracking-widest font-bold">La página que buscas no existe en el ecosistema Conectō.</p>
            <Button onClick={() => setView({ type: 'dashboard' })}>Volver al Dashboard</Button>
          </div>
        )}
      </main>
      
      {showForm && (
        <ProjectForm 
          onClose={() => {
            setShowForm(false);
            setEditingProject(null);
          }} 
          onSubmit={handleSaveProject}
          initialData={editingProject || undefined}
          isLoading={isSubmitting}
        />
      )}

      <footer className="py-12 px-6 border-t border-white/10 bg-black/10">
        <div className="w-full text-center text-white/20 text-sm">
          &copy; 2026 Conectō Ecosistema by Ignacio Desarrollos. Plataforma de Soporte a Decisiones.
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
