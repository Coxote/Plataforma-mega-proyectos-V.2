import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserSession, Role } from '../types';
import { Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (user: UserSession) => void;
  usersList: UserSession[];
}

// 4 Curated Artwork Images matching the user's uploaded compositions
const ARTWORK_SLIDES = [
  {
    id: 1,
    title: "Esferas 3D & Núcleo Naranja",
    url: "/src/assets/images/spheres_3d_artwork_1786405864690.jpg",
    fallbackUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
    gradient: "from-amber-900/60 to-slate-950/80",
    fallbackTag: "3D Spheres & Orange Core"
  },
  {
    id: 2,
    title: "Vórtice Líquido Naranja",
    url: "/src/assets/images/orange_swirl_vortex_1786405886375.jpg",
    fallbackUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1200&auto=format&fit=crop",
    gradient: "from-orange-950/70 to-red-950/80",
    fallbackTag: "Orange Liquid Vortex"
  },
  {
    id: 3,
    title: "Mano 3D Táctil Peluda",
    url: "/src/assets/images/orange_fuzzy_hand_1786405899645.jpg",
    fallbackUrl: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=1200&auto=format&fit=crop",
    gradient: "from-amber-600/60 to-orange-950/80",
    fallbackTag: "Tactile Orange 3D Art"
  },
  {
    id: 4,
    title: "Ilustración Vectorial de Equipo",
    url: "/src/assets/images/team_vector_art_1786405910647.jpg",
    fallbackUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
    gradient: "from-orange-600/50 to-blue-900/80",
    fallbackTag: "Creative Team Collaboration"
  }
];

export default function Login({ onLogin, usersList }: LoginProps) {
  const [username, setUsername] = useState('coordinador@tpp.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pick a random artwork on login load and keep it static
  const [activeSlide] = useState(() => Math.floor(Math.random() * ARTWORK_SLIDES.length));

  const handleSelectPresetUser = (user: UserSession) => {
    setUsername(user.username);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Por favor, ingresa tu email.');
      return;
    }

    if (!password) {
      setError('Por favor, ingresa tu contraseña.');
      return;
    }

    const normalizedUser = username.trim().toLowerCase();
    const existingUser = usersList.find(
      (u) => u.username.toLowerCase() === normalizedUser || 
             (u.puesto && u.puesto.toLowerCase().includes(normalizedUser))
    );

    if (existingUser) {
      if (existingUser.estado === 'inactivo') {
        setError('Tu usuario se encuentra inactivo. Contacta al administrador.');
        return;
      }
      const loggedUser = {
        ...existingUser,
        lastLoginAt: new Date().toISOString()
      };
      onLogin(loggedUser);
    } else {
      // Default to coordinator if custom email entered
      const newUser: UserSession = {
        id: `u-${Date.now()}`,
        username: username.trim(),
        puesto: 'Coordinador',
        role: 'coordinador',
        password: password,
      };
      onLogin(newUser);
    }
  };

  const currentSlide = ARTWORK_SLIDES[activeSlide];

  return (
    <div 
      className="min-h-screen w-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-sky-100/80 via-slate-50 to-slate-100/90 p-4 sm:p-6 md:p-10 font-sans"
      id="login-page-container"
    >
      {/* Tarjeta Principal (Modal con 20px border radius, p-[13px] para separaciones exactas) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl bg-white rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] p-[13px] border border-slate-100/80 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center relative overflow-hidden"
        id="login-card"
      >

        {/* Panel Izquierdo (Composición 3D limpia separada a 13px de los bordes con radio anidado de 7px) */}
        <div className="relative w-full aspect-[4/5] md:h-[510px] rounded-[7px] overflow-hidden bg-slate-100 shadow-sm">
          <img 
            src={currentSlide.url} 
            alt={currentSlide.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover block"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== currentSlide.fallbackUrl) {
                target.src = currentSlide.fallbackUrl;
              }
            }}
          />
        </div>

        {/* Panel Derecho (UI / Formulario Iniciar Sesión) */}
        <div className="w-full pr-4 sm:pr-8 py-4 pl-1 md:pl-2 flex flex-col justify-center space-y-7">
          
          {/* Encabezados */}
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#18181b] tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-[#71717a] font-normal">
              Ingresa tus credenciales
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3 font-medium flex items-center justify-between"
            >
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 font-bold ml-2">✕</button>
            </motion.div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
            
            {/* Input 1: Email */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-[#3f3f46]">
                Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. usuario@tpp.com"
                className="w-full bg-white border border-[#D1D5DB] rounded-[8px] px-3.5 py-2.5 text-sm text-[#18181b] focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] outline-none transition-all placeholder:text-slate-300"
                id="login-username"
              />
            </div>

            {/* Input 2: Contraseña (Con estado activo de borde naranja de 2px y enlace "¿Olvidaste tu contraseña?") */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-semibold text-[#3f3f46]">
                  Contraseña
                </label>
                <a 
                  href="#forgot" 
                  onClick={(e) => { e.preventDefault(); setError('Instrucciones de recuperación enviadas a administración.'); }}
                  className="text-xs font-medium text-[#FF4500] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 border-[#FF4500] rounded-[8px] px-3.5 py-2.5 text-sm text-[#18181b] outline-none transition-all pr-10"
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox: Mantener sesión */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-[3px] border-[#D1D5DB] text-[#FF4500] focus:ring-[#FF4500] cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs sm:text-sm text-[#3f3f46] font-normal cursor-pointer select-none">
                Mantener sesión
              </label>
            </div>

            {/* Botón Principal CTA (Naranja vibrante #FF4500 con border-radius 8px) */}
            <button
              type="submit"
              className="w-full bg-[#FF4500] hover:bg-[#e03d00] text-white font-medium py-3 rounded-[8px] text-sm transition-all shadow-sm cursor-pointer text-center active:scale-[0.99] mt-2"
              id="login-submit-btn"
            >
              Iniciar Sesión
            </button>
          </form>

          {/* Accesos rápidos de ejemplo */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-medium text-slate-400 block">
              Accesos de prueba rápidos:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {usersList.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectPresetUser(u)}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-medium transition-all cursor-pointer border border-slate-200"
                >
                  {u.username}
                </button>
              ))}
            </div>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
