import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Button } from '../ui';
import { LogIn, Lock, Mail, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/invalid-credential') {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Usuario no encontrado.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta.');
      } else {
        setError('Ocurrió un error al intentar ingresar. Reintenta pronto.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-blue-dark flex items-center justify-center p-6 selection:bg-brand-lime selection:text-brand-blue-dark">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-brand-blue-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-brand-sky/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <img 
            src="/logo-conecto.png" 
            alt="Conectō Logo" 
            className="h-24 mx-auto mb-6 object-contain drop-shadow-2xl rounded-2xl ring-1 ring-white/10"
          />
          <h1 className="text-5xl font-display font-bold text-brand-sky mb-2">
            Conectō <span className="text-brand-lime text-3xl align-top">®</span>
          </h1>
          <p className="text-white/40 font-medium tracking-wide uppercase text-xs">
            Plataforma de Gestión de Talento
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[32px] shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue-primary via-brand-sky to-brand-lime opacity-50" />
          
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-white mb-1">Bienvenido de nuevo</h2>
            <p className="text-white/40 text-sm">Ingresá tus credenciales para administrar el recruiting.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-brand-sky transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email corporativo"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-sky/50 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-brand-sky transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-sky/50 transition-all"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button 
              type="submit" 
              className="w-full py-4 text-base font-bold shadow-xl shadow-brand-blue-primary/20" 
              isLoading={isLoading}
              icon={LogIn}
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest">
              Uso exclusivo para administradores conectō
            </p>
          </div>
        </div>
      </motion.div>

      <footer className="absolute bottom-10 left-0 w-full text-center px-6">
        <p className="text-white/20 text-xs md:text-sm">
          &copy; 2026 Conectō Ecosistema by Ignacio Desarrollos. Plataforma de Soporte a Decisiones.
        </p>
      </footer>
    </div>
  );
}
