import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserSession } from '../types';
import { Lock, User, Briefcase, Eye, EyeOff, Shield } from 'lucide-react';

interface LoginProps {
  onLogin: (user: UserSession) => void;
  usersList: UserSession[];
}

export default function Login({ onLogin, usersList }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [puesto, setPuesto] = useState('Coordinador de Proyectos');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map Puesto to Role
  const getRoleFromPuesto = (p: string): 'coordinador' | 'sac' | 'contents' | 'contentd' | 'invitado' => {
    switch (p) {
      case 'Coordinador':
        return 'coordinador';
      case 'SAC':
        return 'sac';
      case 'ContentS':
        return 'contents';
      case 'ContentD':
        return 'contentd';
      case 'Cliente / Invitado':
      default:
        return 'invitado';
    }
  };

  const handleDemoFill = (demoUser: string, demoPuesto: string) => {
    setUsername(demoUser);
    setPassword('123');
    setPuesto(demoPuesto);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Por favor, ingresa un nombre de usuario.');
      return;
    }

    if (!password) {
      setError('Por favor, ingresa una contraseña.');
      return;
    }

    const normalizedUser = username.trim().toLowerCase();
    
    // Check if user exists in registered list
    const existingUser = usersList.find(
      (u) => u.username.toLowerCase() === normalizedUser
    );

    if (existingUser) {
      // Validate password
      if (existingUser.password && existingUser.password !== password) {
        setError('Contraseña incorrecta para este usuario.');
        return;
      }
      
      // Update local storage active session
      onLogin(existingUser);
    } else {
      // Create new user dynamically
      const newUser: UserSession = {
        id: `u-${Date.now()}`,
        username: username.trim(),
        puesto: puesto,
        role: getRoleFromPuesto(puesto),
        password: password,
      };
      
      onLogin(newUser);
    }
  };

  return (
    <div 
      className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-4"
      id="login-page-container"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        id="login-card"
      >
        {/* Card Header */}
        <div className="bg-slate-900 px-8 py-6 text-white text-center space-y-2">
          <div className="inline-flex p-3 bg-slate-800 rounded-xl border border-slate-700 mb-1">
            <Shield className="w-6 h-6 text-lime-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Plataforma Proyectos</h1>
          <p className="text-xs text-slate-400">Ingresa tus credenciales para acceder al panel</p>
        </div>

        {/* Card Body / Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6" id="login-form">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl p-3 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
              {error}
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
              Usuario
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: carlos, ana, o tu nombre"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all font-medium"
                id="login-username"
              />
            </div>
          </div>

          {/* Job Selection Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
              Puesto / Rol
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400">
                <Briefcase className="w-4 h-4" />
              </span>
              <select
                value={puesto}
                onChange={(e) => setPuesto(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all font-medium appearance-none cursor-pointer"
                id="login-puesto"
              >
                <option value="Coordinador">Coordinador</option>
                <option value="SAC">SAC</option>
                <option value="ContentS">ContentS</option>
                <option value="ContentD">ContentD</option>
                <option value="Cliente / Invitado">Cliente / Invitado</option>
              </select>
              <span className="absolute right-4 top-4 text-slate-400 pointer-events-none text-[10px]">▼</span>
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all font-medium"
                id="login-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-xs transition-colors shadow-lg shadow-slate-200 cursor-pointer"
            id="login-submit-btn"
          >
            Iniciar Sesión
          </button>
        </form>

        {/* Quick Fill Demos */}
        <div className="bg-slate-50 border-t border-slate-100 px-8 py-6 space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
            Acceso Rápido de Prueba (Contraseña: 123)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('carlos', 'Coordinador')}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[10.5px] font-bold text-slate-700 text-left flex flex-col transition-all cursor-pointer"
            >
              <span>Carlos</span>
              <span className="text-[9px] text-slate-400 font-medium">Coordinador</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('ana', 'SAC')}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[10.5px] font-bold text-slate-700 text-left flex flex-col transition-all cursor-pointer"
            >
              <span>Ana</span>
              <span className="text-[9px] text-slate-400 font-medium">Ejecutivo SAC</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('lucia', 'ContentS')}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[10.5px] font-bold text-slate-700 text-left flex flex-col transition-all cursor-pointer"
            >
              <span>Lucía</span>
              <span className="text-[9px] text-slate-400 font-medium">Content S</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('pedro', 'ContentD')}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[10.5px] font-bold text-slate-700 text-left flex flex-col transition-all cursor-pointer"
            >
              <span>Pedro</span>
              <span className="text-[9px] text-slate-400 font-medium">Content D</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('invitado', 'Cliente / Invitado')}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[10.5px] font-bold text-slate-750 text-left flex flex-col transition-all cursor-pointer col-span-2"
            >
              <span>Invitado (Acme Corp)</span>
              <span className="text-[9px] text-slate-400 font-medium">Ver Proyecto Acme Corp</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
