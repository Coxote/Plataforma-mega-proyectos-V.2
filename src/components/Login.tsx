import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserSession, Role } from '../types';
import { TppLogo } from './TppLogo';
import { Lock, User, Briefcase, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (user: UserSession) => void;
  usersList: UserSession[];
}

export default function Login({ onLogin, usersList }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [puesto, setPuesto] = useState('Coordinador');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map Puesto to Role
  const getRoleFromPuesto = (p: string): Role => {
    switch (p) {
      case 'Coordinador':
        return 'coordinador';
      case 'SAC':
        return 'sac';
      case 'ContentS':
        return 'contents';
      case 'ContentD':
        return 'contentd';
      case 'Director Financiero':
      case 'Finanzas':
        return 'director_financiero';
      case 'Proveedor':
      case 'Proveedor Externo':
        return 'proveedor';
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
      if (existingUser.estado === 'inactivo') {
        setError('Tu usuario se encuentra inactivo. Contacta al coordinador de la plataforma.');
        return;
      }

      // Validate password
      if (existingUser.password && existingUser.password !== password) {
        setError('Contraseña incorrecta para este usuario.');
        return;
      }
      
      const loggedUser = {
        ...existingUser,
        lastLoginAt: new Date().toISOString()
      };

      // Update local storage active session
      onLogin(loggedUser);
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
      className="min-h-screen w-screen flex items-center justify-center bg-white oa-pixel-grid-orange p-4 md:p-8"
      id="login-page-container"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden md:flex"
        id="login-card"
      >
        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Logo / Brand Header */}
            <div className="flex items-center gap-3 mb-8">
              <TppLogo size="md" variant="full" />
            </div>

            <div className="space-y-1 mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">Iniciar Sesión</h2>
              <p className="text-xs text-slate-500">Ingresa tus credenciales para acceder a la sala de control</p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl p-3 font-semibold flex items-center gap-2 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                {error}
              </div>
            )}

            {/* Card Body / Form */}
            <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Usuario
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej: carlos, ana..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 focus:bg-white outline-none transition-all font-medium"
                    id="login-username"
                  />
                </div>
              </div>

              {/* Job Selection Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Puesto / Rol
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <select
                    value={puesto}
                    onChange={(e) => setPuesto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 focus:bg-white outline-none transition-all font-medium appearance-none cursor-pointer"
                    id="login-puesto"
                  >
                    <option value="Coordinador">Coordinador</option>
                    <option value="Director Financiero">Director Financiero</option>
                    <option value="SAC">SAC</option>
                    <option value="ContentS">ContentS</option>
                    <option value="ContentD">ContentD</option>
                    <option value="Proveedor">Proveedor Externo</option>
                    <option value="Cliente / Invitado">Cliente / Invitado</option>
                  </select>
                  <span className="absolute right-4 top-3.5 text-slate-400 pointer-events-none text-[10px]">▼</span>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 focus:bg-white outline-none transition-all font-medium"
                    id="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#FF5500] hover:bg-[#E04B00] text-white font-black py-3 rounded-2xl text-xs transition-all shadow-lg shadow-orange-500/25 cursor-pointer uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99]"
                id="login-submit-btn"
              >
                Acceder al Hub Digital
              </button>
            </form>
          </div>

          {/* Quick Fill Demos */}
          <div className="mt-8 border-t border-slate-100 pt-6 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Accesos de Prueba
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('sofia', 'Director Financiero')}
                className="px-2.5 py-1.5 bg-emerald-50/90 hover:bg-emerald-100/80 border border-emerald-300 rounded-xl text-[10.5px] font-bold text-emerald-950 text-left flex flex-col transition-all cursor-pointer shadow-2xs"
              >
                <span>Sofía</span>
                <span className="text-[9px] text-emerald-700 font-extrabold truncate">Dir. Financiera</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('carlos', 'Coordinador')}
                className="px-2.5 py-1.5 bg-white hover:border-orange-200 hover:bg-orange-50/50 border border-slate-200 rounded-xl text-[10.5px] font-bold text-slate-700 text-left flex flex-col transition-all cursor-pointer"
              >
                <span>Carlos</span>
                <span className="text-[9px] text-slate-400 font-medium truncate">Coordinador</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('ana', 'SAC')}
                className="px-2.5 py-1.5 bg-white hover:border-orange-200 hover:bg-orange-50/50 border border-slate-200 rounded-xl text-[10.5px] font-bold text-slate-700 text-left flex flex-col transition-all cursor-pointer"
              >
                <span>Ana</span>
                <span className="text-[9px] text-slate-400 font-medium truncate">SAC</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('proveedor', 'Proveedor')}
                className="px-2.5 py-1.5 bg-amber-50/80 hover:bg-amber-100/60 border border-amber-200 rounded-xl text-[10.5px] font-bold text-amber-900 text-left flex flex-col transition-all cursor-pointer"
              >
                <span>Proveedor</span>
                <span className="text-[9px] text-amber-600 font-medium truncate">Proveedor Dev</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('lucia', 'ContentS')}
                className="px-2.5 py-1.5 bg-white hover:border-orange-200 hover:bg-orange-50/50 border border-slate-200 rounded-xl text-[10.5px] font-bold text-slate-700 text-left flex flex-col transition-all cursor-pointer"
              >
                <span>Lucía</span>
                <span className="text-[9px] text-slate-400 font-medium truncate">Content S</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('pedro', 'ContentD')}
                className="px-2.5 py-1.5 bg-white hover:border-orange-200 hover:bg-orange-50/50 border border-slate-200 rounded-xl text-[10.5px] font-bold text-slate-700 text-left flex flex-col transition-all cursor-pointer"
              >
                <span>Pedro</span>
                <span className="text-[9px] text-slate-400 font-medium truncate">Content D</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Editorial Panel */}
        <div className="hidden md:flex md:w-1/2 bg-slate-950 p-10 flex-col justify-between text-white relative overflow-hidden oa-pixel-grid-lime">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
          
          <div className="relative z-20">
            <span className="text-[10px] font-black tracking-widest text-lime-400 uppercase bg-lime-950/80 px-2.5 py-1 rounded-full border border-lime-800/40">
              TPP LINEA GRAFICA V1.0
            </span>
          </div>

          <div className="space-y-4 relative z-20 max-w-sm">
            <h3 className="text-3xl font-black tracking-tight leading-none text-white">
              Tu operación merece mejores entregas.
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed font-medium">
              Operations Atelier combina una consola operativa SaaS con la energía gráfica de TPP: blanco dominante, bloques naranjas, acentos de selección lima y datos con precisión milimétrica.
            </p>
          </div>

          <div className="relative z-20 flex items-center justify-between border-t border-slate-800/80 pt-6">
            <div className="text-xs font-bold text-slate-400">
              © 2026 Operations Atelier
            </div>
            <div className="w-6 h-6 rounded-lg bg-orange-600 flex items-center justify-center shadow-md">
              <span className="text-[10px] font-black text-white">OA</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
