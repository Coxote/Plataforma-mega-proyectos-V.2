import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserSession, Role, ROLE_LABELS } from '../types';
import { Eye, EyeOff, UserPlus, LogIn, CheckCircle2, ShieldAlert } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';

interface LoginProps {
  onLogin: (user: UserSession) => void;
  onRegisterUser?: (user: UserSession) => Promise<void>;
  usersList: UserSession[];
}

// 4 Curated Artwork Images matching the platform aesthetic
const ARTWORK_SLIDES = [
  {
    id: 1,
    title: "Esferas 3D & Núcleo Naranja",
    url: "/src/assets/images/spheres_3d_artwork_1786405864690.jpg",
    fallbackUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
    gradient: "from-amber-900/60 to-slate-950/80",
  },
  {
    id: 2,
    title: "Vórtice Líquido",
    url: "/src/assets/images/orange_swirl_vortex_1786405886375.jpg",
    fallbackUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1200&auto=format&fit=crop",
    gradient: "from-lime-950/70 to-red-950/80",
  },
  {
    id: 3,
    title: "Mano 3D Táctil",
    url: "/src/assets/images/orange_fuzzy_hand_1786405899645.jpg",
    fallbackUrl: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=1200&auto=format&fit=crop",
    gradient: "from-amber-600/60 to-lime-950/80",
  },
  {
    id: 4,
    title: "Ilustración Vectorial de Equipo",
    url: "/src/assets/images/team_vector_art_1786405910647.jpg",
    fallbackUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
    gradient: "from-lime-600/50 to-blue-900/80",
  }
];

const AVAILABLE_ROLES: { role: Role; label: string; puesto: string }[] = [
  { role: 'contentd', label: 'Diseñador', puesto: 'Diseñador' },
  { role: 'sac', label: 'PM / Consultor SAC', puesto: 'PM / Consultor' },
  { role: 'contents', label: 'Social Media', puesto: 'Social Media' },
  { role: 'supervisor', label: 'Supervisor General', puesto: 'Supervisor General' },
  { role: 'coordinador', label: 'Coordinador PM', puesto: 'Coordinador PM' },
  { role: 'director_financiero', label: 'Director Financiero', puesto: 'Director Financiero' },
  { role: 'proveedor', label: 'Proveedor Externo', puesto: 'Proveedor Externo' },
  { role: 'invitado', label: 'Cliente / Invitado', puesto: 'Cliente / Invitado' },
];

export default function Login({ onLogin, onRegisterUser, usersList }: LoginProps) {
  // Tabs: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state (Empty placeholders by default)
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRoleIndex, setRegRoleIndex] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

  // Alerts
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pick a random artwork on login load and keep it static
  const [activeSlide] = useState(() => Math.floor(Math.random() * ARTWORK_SLIDES.length));

  const getAuthErrorMessage = (err: unknown) => {
    const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code) : '';
    if (code.includes('invalid-credential') || code.includes('wrong-password')) {
      return 'Correo o contraseña incorrectos. Verifica tus credenciales.';
    }
    if (code.includes('user-not-found')) {
      return 'No encontramos una cuenta con ese correo. Si eres nuevo, regístrate en "Crear Cuenta".';
    }
    if (code.includes('email-already-in-use')) {
      return 'Este correo ya existe en Firebase Auth. Intenta iniciar sesión o restablecer la contraseña.';
    }
    if (code.includes('weak-password')) {
      return 'Firebase requiere una contraseña de al menos 6 caracteres.';
    }
    return 'No se pudo autenticar la cuenta. Intenta nuevamente.';
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const query = emailOrUser.trim().toLowerCase();
    if (!query) {
      setError('Por favor, ingresa tu correo o nombre de usuario.');
      return;
    }

    if (!password) {
      setError('Por favor, ingresa tu contraseña.');
      return;
    }

    const found = usersList.find(
      (u) =>
        (u.email && u.email.toLowerCase() === query) ||
        u.username.toLowerCase() === query
    );

    const isRodrigoBootstrap = (query === 'rodrigo' || query === 'rodrigo@tpp.com') && password === '123456';
    const loginEmail = query.includes('@')
      ? query
      : (found?.email?.toLowerCase() || (isRodrigoBootstrap ? 'rodrigo@tpp.com' : undefined));
    if (!loginEmail) {
      setError('No encontramos una cuenta con ese correo o usuario. Si eres nuevo, regístrate en "Crear Cuenta".');
      return;
    }

    const rodrigoBootstrapProfile: UserSession | null = isRodrigoBootstrap
      ? {
          id: 'u-rodrigo',
          username: 'rodrigo',
          email: 'rodrigo@tpp.com',
          puesto: 'Coordinador PM',
          role: 'coordinador',
          password: '123456',
          estado: 'activo',
          capacidadMensualHoras: 176
        }
      : null;
    const profileCandidate = found || rodrigoBootstrapProfile;

    const canUseLocalDemoLogin =
      !isRodrigoBootstrap &&
      profileCandidate &&
      profileCandidate.password &&
      profileCandidate.password === password &&
      profileCandidate.estado !== 'pendiente_autenticacion' &&
      profileCandidate.estado !== 'inactivo';

    if (profileCandidate?.password === password && profileCandidate.estado === 'pendiente_autenticacion') {
      setError('Tu cuenta se encuentra registrada pero está PENDIENTE DE AUTENTICACIÓN por un Supervisor o Coordinador. Espera a que sea aprobada en el panel de Equipo.');
      return;
    }

    if (profileCandidate?.password === password && profileCandidate.estado === 'inactivo') {
      setError('Tu usuario se encuentra inactivo. Contacta a un administrador para reactivarlo.');
      return;
    }

    const loginWithLocalProfile = () => {
      if (!profileCandidate) return false;
      const loggedUser: UserSession = {
        ...profileCandidate,
        email: loginEmail,
        password: undefined,
        lastLoginAt: new Date().toISOString()
      };
      onLogin(loggedUser);
      return true;
    };

    try {
      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, loginEmail, password);
      } catch (authError: any) {
        const canMigrateLegacyUser =
          profileCandidate &&
          profileCandidate.password &&
          profileCandidate.password === password &&
          password.length >= 6 &&
          (authError?.code === 'auth/user-not-found' || authError?.code === 'auth/invalid-credential');

        if (!canMigrateLegacyUser) {
          if (canUseLocalDemoLogin && loginWithLocalProfile()) {
            return;
          }
          throw authError;
        }

        credential = await createUserWithEmailAndPassword(auth, loginEmail, password);
        await updateProfile(credential.user, { displayName: profileCandidate.username });
      }

      const firebaseUid = credential.user.uid;
      const profile = usersList.find((u) => u.id === firebaseUid || u.email?.toLowerCase() === loginEmail) || profileCandidate;

      if (!profile) {
        await signOut(auth);
        setError('Tu cuenta existe en Firebase Auth, pero no tiene perfil en la base de datos. Solicita acceso al coordinador.');
        return;
      }

      if (profile.estado === 'pendiente_autenticacion') {
        await signOut(auth);
        setError('Tu cuenta se encuentra registrada pero está PENDIENTE DE AUTENTICACIÓN por un Supervisor o Coordinador. Espera a que sea aprobada en el panel de Equipo.');
        return;
      }

      if (profile.estado === 'inactivo') {
        await signOut(auth);
        setError('Tu usuario se encuentra inactivo. Contacta a un administrador para reactivarlo.');
        return;
      }

      const loggedUser: UserSession = {
        ...profile,
        id: firebaseUid,
        email: loginEmail,
        password: undefined,
        lastLoginAt: new Date().toISOString()
      };
      onLogin(loggedUser);
    } catch (err) {
      if (canUseLocalDemoLogin && loginWithLocalProfile()) {
        return;
      }
      setError(getAuthErrorMessage(err));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const nameClean = regName.trim();
    const emailClean = regEmail.trim().toLowerCase();
    const passClean = regPassword.trim();

    if (!nameClean) {
      setError('Por favor ingresa tu nombre de usuario o nombre completo.');
      return;
    }

    if (!emailClean || !emailClean.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (passClean.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const alreadyExists = usersList.some(
      (u) =>
        u.username.toLowerCase() === nameClean.toLowerCase() ||
        (u.email && u.email.toLowerCase() === emailClean)
    );

    if (alreadyExists) {
      setError('Ya existe un usuario registrado con ese nombre o correo electrónico.');
      return;
    }

    setIsRegistering(true);
    try {
      const selectedOption = AVAILABLE_ROLES[regRoleIndex];
      const credential = await createUserWithEmailAndPassword(auth, emailClean, passClean);
      await updateProfile(credential.user, { displayName: nameClean });

      const newUser: UserSession = {
        id: credential.user.uid,
        username: nameClean,
        email: emailClean,
        puesto: selectedOption.puesto,
        role: selectedOption.role,
        estado: 'pendiente_autenticacion',
        createdAt: new Date().toISOString(),
        capacidadMensualHoras: selectedOption.role === 'invitado' ? 0 : 176
      };

      if (onRegisterUser) {
        await onRegisterUser(newUser);
      }

      await signOut(auth);
      setSuccessMsg('¡Cuenta registrada exitosamente! Está en estado "Pendiente de Autenticación". Un Supervisor o Coordinador la autenticará y activará en breve.');
      setEmailOrUser(emailClean);
      setPassword('');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setActiveTab('login');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsRegistering(false);
    }
  };

  const currentSlide = ARTWORK_SLIDES[activeSlide];

  return (
    <div
      className="min-h-screen w-screen flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 140% 100% at 50% -15%, #e0f2fe 0%, #f0f5fa 40%, #f8fafc 70%, #ffffff 100%)'
      }}
      id="login-page-container"
    >
      {/* Tarjeta Principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] p-4 sm:p-5 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center relative overflow-hidden"
        id="login-card"
      >

        {/* Panel Izquierdo (Composición 3D) */}
        <div className="relative w-full aspect-[4/5] md:h-[530px] rounded-2xl overflow-hidden bg-slate-100 shadow-sm hidden sm:block">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6">
            <span className="text-[10px] font-bold text-lime-300 uppercase tracking-widest">Plataforma Cloud</span>
            <h3 className="text-white text-lg font-bold">Gestión de Proyectos & Operaciones</h3>
          </div>
        </div>

        {/* Panel Derecho (UI / Formulario Iniciar Sesión / Crear Cuenta) */}
        <div className="w-full h-full flex flex-col justify-center py-4 px-2 sm:px-6">
          <div className="w-full max-w-sm mx-auto space-y-5">

            {/* Selector de Pestañas: Iniciar Sesión vs Crear Cuenta */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Crear Cuenta
              </button>
            </div>

            {/* Encabezado */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
                {activeTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </h1>
              <p className="text-xs text-slate-500 font-normal">
                {activeTab === 'login'
                  ? 'Ingresa tus credenciales para acceder a la plataforma'
                  : 'Registra tu usuario para solicitar acceso al equipo'}
              </p>
            </div>

            {/* Alerta de Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 font-medium flex items-start gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-rose-400 hover:text-rose-700 font-bold ml-1 cursor-pointer"
                >
                  ✕
                </button>
              </motion.div>
            )}

            {/* Alerta de Éxito */}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 font-medium flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">{successMsg}</div>
                <button
                  type="button"
                  onClick={() => setSuccessMsg(null)}
                  className="text-emerald-400 hover:text-emerald-700 font-bold ml-1 cursor-pointer"
                >
                  ✕
                </button>
              </motion.div>
            )}

            {/* FORMULARIO 1: INICIAR SESIÓN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5" id="login-form">
                {/* Input: Email o Usuario */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Correo electrónico o Usuario
                  </label>
                  <input
                    type="text"
                    value={emailOrUser}
                    onChange={(e) => setEmailOrUser(e.target.value)}
                    placeholder="nombre@empresa.com"
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                    id="login-username"
                    autoComplete="username"
                  />
                </div>

                {/* Input: Contraseña */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Contraseña
                    </label>
                    <a
                      href="#forgot"
                      onClick={(e) => {
                        e.preventDefault();
                        setError('Si olvidaste tu contraseña, solicita el restablecimiento a tu Coordinador o Supervisor.');
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña"
                      className="w-full bg-white border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none transition-all pr-9 placeholder:text-slate-400 font-medium"
                      id="login-password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
                    className="w-3.5 h-3.5 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer accent-black"
                  />
                  <label htmlFor="rememberMe" className="text-xs text-slate-600 font-medium cursor-pointer select-none">
                    Mantener sesión iniciada
                  </label>
                </div>

                {/* Botón Principal CTA (Single Accent / Negro de alto contraste) */}
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer text-center active:scale-[0.99] mt-2 flex items-center justify-center gap-2"
                  id="login-submit-btn"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#c6ef4e]" />
                  <span>Iniciar Sesión</span>
                </button>
              </form>
            )}

            {/* FORMULARIO 2: CREAR CUENTA (REGISTRO) */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3" id="register-form">
                {/* Nombre de Usuario */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Nombre Completo o Usuario
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej: Laura Méndez"
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                    required
                  />
                </div>

                {/* Correo Electrónico */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nombre@empresa.com"
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                    required
                  />
                </div>

                {/* Contraseña */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Crea una contraseña"
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                    required
                  />
                </div>

                {/* Rol / Puesto Solicitado */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Rol / Puesto Solicitado
                  </label>
                  <select
                    value={regRoleIndex}
                    onChange={(e) => setRegRoleIndex(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none transition-all font-medium cursor-pointer"
                  >
                    {AVAILABLE_ROLES.map((item, idx) => (
                      <option key={item.role} value={idx}>
                        {item.label} ({ROLE_LABELS[item.role]})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    * Tu solicitud quedará en estado de autenticación hasta ser aprobada por el Supervisor.
                  </span>
                </div>

                {/* Botón de Registro */}
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer text-center active:scale-[0.99] mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#c6ef4e]" />
                  <span>{isRegistering ? 'Registrando en la nube...' : 'Solicitar Acceso'}</span>
                </button>
              </form>
            )}

          </div>
        </div>

      </motion.div>
    </div>
  );
}
