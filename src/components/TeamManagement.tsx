import React, { useState, useMemo } from 'react';
import { UserSession, Project, Role, ROLE_LABELS } from '../types';
import {
  UserPlus,
  Trash2,
  Key,
  Briefcase,
  Users,
  UserCheck,
  Shield,
  TrendingUp,
  Sliders,
  Grid,
  Sparkles,
  Mail,
  CheckCircle,
  AlertCircle,
  UserX,
  ShieldCheck,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { TeamCard, VitaminizedMember } from './TeamCard';
import { UserInspectorPanel } from './UserInspectorPanel';
import { CustomModal } from './CustomModal';
import { calculateTeamWorkload, getUserColor } from '../dashboardUtils';

interface TeamManagementProps {
  usersList: UserSession[];
  projects: Project[];
  onUpdateUser: (user: UserSession) => void;
  onAddUser: (user: UserSession) => void;
  onDeleteUser: (userId: string) => void;
  onApproveUser?: (userId: string) => void;
  currentUser: UserSession;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  usersList,
  projects = [],
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  onApproveUser,
  currentUser,
}) => {
  const [subView, setSubView] = useState<'cards' | 'admin'>('cards');
  const [selectedMember, setSelectedMember] = useState<VitaminizedMember | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserSession | null>(null);

  // Form states for creating a user
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('123');
  const [newRole, setNewRole] = useState<Role>('contentd');
  const [assignedProjectId, setAssignedProjectId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const getPuestoFromRole = (r: Role): string => {
    switch (r) {
      case 'coordinador': return 'Coordinador PM';
      case 'supervisor': return 'Supervisor General';
      case 'sac': return 'PM / Consultor SAC';
      case 'contents': return 'Social Media';
      case 'contentd': return 'Diseñador';
      case 'director_financiero': return 'Director Financiero';
      case 'proveedor': return 'Proveedor Externo';
      case 'invitado': return 'Cliente / Invitado';
      default: return 'Colaborador';
    }
  };

  // Build Vitaminized Member objects dynamically from real user database + active project budgets
  const teamMembers = useMemo<VitaminizedMember[]>(() => {
    const loads = calculateTeamWorkload(usersList, projects);
    return loads.map(load => {
      let baseSkills: string[] = [];
      if (load.role === 'coordinador') {
        baseSkills = ['Gestión', 'Finanzas', 'Liderazgo'];
      } else if (load.role === 'supervisor') {
        baseSkills = ['Supervisión', 'Auditoría', 'Control Calidad'];
      } else if (load.role === 'sac') {
        baseSkills = ['Cuentas', 'Figma Inspect', 'Copywriting'];
      } else if (load.role === 'contents') {
        baseSkills = ['Social Media', 'Estrategia', 'SEO'];
      } else if (load.role === 'contentd') {
        baseSkills = ['UI/UX Refactor', 'Illustrator', 'Branding'];
      } else if (load.role === 'director_financiero') {
        baseSkills = ['Estrategia Financiera', 'Presupuestos', 'EBITDA'];
      } else if (load.role === 'proveedor') {
        baseSkills = ['Servicio Externo', 'Contrata', 'Desarrollo Especializado'];
      } else {
        baseSkills = ['Invitado'];
      }

      const userProjects = projects.filter(p => p.budget && (p.budget[load.role]?.allocated || 0) > 0);
      userProjects.forEach(p => {
        const nameLower = p.name.toLowerCase();
        if (nameLower.includes('futbol') || nameLower.includes('game') || nameLower.includes('gaming')) {
          baseSkills.push('Game Dev');
        }
        if (nameLower.includes('ui') || nameLower.includes('ux') || nameLower.includes('web')) {
          baseSkills.push('UX/UI');
        }
        if (nameLower.includes('redes') || nameLower.includes('campaña') || nameLower.includes('social')) {
          baseSkills.push('Marketing');
        }
      });

      const uniqueSkills = Array.from(new Set(baseSkills)).slice(0, 4);

      return {
        id: load.id,
        username: load.username,
        role: load.role,
        puesto: load.puesto,
        monthlyCapacity: 192,
        effectiveCapacity: 153.6,
        idleBuffer: 38.4,
        loadedHours: load.consumedHours,
        assignedHours: load.assignedHours,
        saturation: load.assignedHours > 0 ? (load.consumedHours / load.assignedHours) * 100 : 0,
        skills: uniqueSkills,
        activeProjectsCount: load.activeProjectsCount
      };
    });
  }, [usersList, projects]);

  // List of users pending coordinator/supervisor authentication
  const pendingUsers = useMemo(() => {
    return usersList.filter(u => u.estado === 'pendiente_autenticacion');
  }, [usersList]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanUser = newUsername.trim();
    const cleanEmail = newEmail.trim().toLowerCase() || `${cleanUser.toLowerCase()}@tpp.com`;

    if (!cleanUser) {
      setFormError('El nombre de usuario es obligatorio.');
      return;
    }

    if (usersList.some((u) => u.username.toLowerCase() === cleanUser.toLowerCase() || (u.email && u.email.toLowerCase() === cleanEmail))) {
      setFormError('Ya existe un usuario con ese nombre o correo electrónico.');
      return;
    }

    const newUser: UserSession = {
      id: `u-${Date.now()}`,
      username: cleanUser,
      email: cleanEmail,
      puesto: getPuestoFromRole(newRole),
      role: newRole,
      password: newPassword || '123',
      estado: 'activo',
      autenticadoPor: currentUser.username,
      fechaAutenticacion: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      projectId: newRole === 'invitado' ? (assignedProjectId || projects[0]?.id) : undefined,
      capacidadMensualHoras: newRole === 'invitado' ? 0 : 176
    };

    onAddUser(newUser);
    setFormSuccess(`Usuario "${cleanUser}" creado y autenticado directamente en la nube.`);
    setNewUsername('');
    setNewEmail('');
    setNewPassword('123');
    setTimeout(() => setFormSuccess(null), 3500);
  };

  const handleRoleChange = (userId: string, targetRole: Role) => {
    const userToUpdate = usersList.find((u) => u.id === userId);
    if (!userToUpdate) return;

    const updated: UserSession = {
      ...userToUpdate,
      role: targetRole,
      puesto: getPuestoFromRole(targetRole),
      projectId: targetRole === 'invitado' ? (userToUpdate.projectId || projects[0]?.id) : undefined,
    };

    onUpdateUser(updated);
  };

  const handleToggleUserStatus = (user: UserSession) => {
    const nextStatus = user.estado === 'activo' ? 'inactivo' : 'activo';
    const updated: UserSession = {
      ...user,
      estado: nextStatus,
      autenticadoPor: currentUser.username,
      fechaAutenticacion: nextStatus === 'activo' ? new Date().toISOString() : user.fechaAutenticacion
    };
    onUpdateUser(updated);
  };

  const handleApprovePending = (userId: string) => {
    if (onApproveUser) {
      onApproveUser(userId);
    } else {
      const user = usersList.find(u => u.id === userId);
      if (user) {
        onUpdateUser({
          ...user,
          estado: 'activo',
          autenticadoPor: currentUser.username,
          fechaAutenticacion: new Date().toISOString()
        });
      }
    }
  };

  const totalMembers = usersList.filter(u => u.role !== 'invitado').length;
  const totalClients = usersList.filter(u => u.role === 'invitado').length;

  return (
    <div className="p-4 sm:p-8 bg-[#F4F5F0] w-full min-h-full space-y-6 flex flex-col relative" id="team-management-panel">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">
            <Shield className="w-3.5 h-3.5 text-slate-800" />
            Control de Personal y Accesos
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Gestión del Escuadrón</h1>
          <p className="text-xs text-slate-500 font-normal">
            Supervisa roles técnicos, autentica solicitudes de nuevos usuarios y sincroniza accesos con Cloud Firestore.
          </p>
        </div>

        {/* Sub-tab view toggles */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-full shadow-xs self-start shrink-0">
          <button
            onClick={() => {
              setSubView('cards');
              setSelectedMember(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
              subView === 'cards'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Fichas Operativas
          </button>

          <button
            onClick={() => {
              setSubView('admin');
              setSelectedMember(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer relative ${
              subView === 'admin'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Administración & Autenticación</span>
            {pendingUsers.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {pendingUsers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* BANNER DE NOTIFICACIÓN DE USUARIOS PENDIENTES DE AUTENTICACIÓN */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                {pendingUsers.length} Solicitud(es) de Usuario Pendientes de Autenticación
              </h4>
              <p className="text-xs text-amber-800">
                Hay usuarios que crearon cuenta desde el portal y requieren tu aprobación como Supervisor/Coordinador para ingresar.
              </p>
            </div>
          </div>
          {subView !== 'admin' && (
            <button
              onClick={() => setSubView('admin')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Revisar y Autenticar
            </button>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-xs flex items-center gap-4 border border-stone-200/70">
          <div className="w-11 h-11 bg-stone-100 rounded-2xl flex items-center justify-center text-slate-800 shrink-0">
            <Users className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Escuadrón Interno</span>
            <span className="text-xl sm:text-2xl font-semibold font-display text-slate-900">{totalMembers} Operadores</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-xs flex items-center gap-4 border border-stone-200/70">
          <div className="w-11 h-11 bg-stone-100 rounded-2xl flex items-center justify-center text-slate-800 shrink-0">
            <UserCheck className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Clientes Invitados</span>
            <span className="text-xl sm:text-2xl font-semibold font-display text-slate-900">{totalClients} Clientes</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-xs flex items-center gap-4 border border-stone-200/70">
          <div className="w-11 h-11 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Pendientes Autenticar</span>
            <span className="text-xl sm:text-2xl font-semibold font-display text-amber-700">{pendingUsers.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-xs flex items-center gap-4 border border-stone-200/70">
          <div className="w-11 h-11 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Cloud Firestore</span>
            <span className="text-xl sm:text-2xl font-semibold font-display text-emerald-700">En Línea</span>
          </div>
        </div>
      </div>

      {/* SUBVIEWS CONTAINER */}
      {subView === 'cards' ? (
        /* SQUAD BOARDS GRID VIEW */
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-slate-800" />
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider font-sans">
              Escuadrón Activo ({teamMembers.length} operadores)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" id="team-cards-grid">
            {teamMembers.map((member) => (
              <TeamCard
                key={member.id}
                member={member}
                onSelect={(m) => setSelectedMember(m)}
                getUserColor={getUserColor}
              />
            ))}
          </div>
        </div>
      ) : (
        /* ADMINISTRACIÓN & AUTENTICACIÓN VIEW */
        <div className="space-y-6">

          {/* 1. SECCIÓN DE USUARIOS PENDIENTES DE AUTENTICACIÓN */}
          {pendingUsers.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-xs border-2 border-amber-300 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-amber-950 font-sans">
                    Solicitudes de Acceso para Autenticar ({pendingUsers.length})
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                  Acción requerida por {currentUser.role === 'supervisor' ? 'Supervisor' : 'Coordinador'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead>
                    <tr className="border-b border-stone-100 text-xs uppercase text-slate-400 font-bold tracking-wider">
                      <th className="py-2.5 px-3">Usuario y Correo</th>
                      <th className="py-2.5 px-3">Puesto Solicitado</th>
                      <th className="py-2.5 px-3">Rol Base</th>
                      <th className="py-2.5 px-3">Fecha Solicitud</th>
                      <th className="py-2.5 px-3 text-right">Decisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {pendingUsers.map((pUser) => (
                      <tr key={pUser.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs capitalize shadow-2xs">
                              {pUser.username.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{pUser.username}</span>
                              <span className="text-[11px] text-slate-500 font-mono">{pUser.email || 'Sin correo'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {pUser.puesto || getPuestoFromRole(pUser.role)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 rounded-md bg-stone-100 text-slate-800 text-[11px] font-bold">
                            {ROLE_LABELS[pUser.role]}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {pUser.createdAt ? new Date(pUser.createdAt).toLocaleDateString('es-ES') : 'Reciente'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprovePending(pUser.id)}
                              className="px-3 py-1.5 bg-[#c6ef4e] hover:bg-[#b4df3b] text-black text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-[0.98]"
                              title="Autenticar y dar acceso activo"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Autenticar y Habilitar</span>
                            </button>
                            <button
                              onClick={() => setUserToDelete(pUser)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                              title="Rechazar solicitud"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. GRID PRINCIPAL: CREAR USUARIO Y TABLA GENERAL */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Create / Add New User Form */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-stone-200/80 space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <UserPlus className="w-4 h-4 text-slate-800" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-sans">
                  Añadir Usuario Directamente
                </h3>
              </div>

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl font-medium">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl font-medium">
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de Usuario</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Ej: sofia, marcelo"
                    className="w-full bg-[#F4F5F0] hover:bg-stone-100 focus:bg-white border-0 rounded-2xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="usuario@empresa.com"
                      className="w-full bg-[#F4F5F0] hover:bg-stone-100 focus:bg-white border-0 rounded-2xl pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Contraseña Inicial</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400">
                      <Key className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ej: 123"
                      className="w-full bg-[#F4F5F0] hover:bg-stone-100 focus:bg-white border-0 rounded-2xl pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Rol en la Plataforma</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-full bg-[#F4F5F0] hover:bg-stone-100 focus:bg-white border-0 rounded-2xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all font-medium cursor-pointer"
                  >
                    <option value="contentd">Diseñador (contentd)</option>
                    <option value="sac">PM / Consultor SAC (sac)</option>
                    <option value="contents">Social Media (contents)</option>
                    <option value="supervisor">Supervisor General (supervisor)</option>
                    <option value="coordinador">Coordinador PM (coordinador)</option>
                    <option value="director_financiero">Director Financiero (director_financiero)</option>
                    <option value="proveedor">Proveedor Externo (proveedor)</option>
                    <option value="invitado">Cliente / Invitado (invitado)</option>
                  </select>
                </div>

                {newRole === 'invitado' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Proyecto Asignado</label>
                    <select
                      value={assignedProjectId}
                      onChange={(e) => setAssignedProjectId(e.target.value)}
                      className="w-full bg-[#F4F5F0] hover:bg-stone-100 focus:bg-white border-0 rounded-2xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all font-medium cursor-pointer"
                    >
                      <option value="">-- Seleccionar Proyecto --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#c6ef4e]" />
                  <span>Guardar y Autenticar</span>
                </button>
              </form>
            </div>

            {/* Right: Users List Table */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xs border border-stone-200/80 space-y-4 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-800" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-sans">
                    Miembros Registrados en la Base de Datos ({usersList.length})
                  </h4>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F4F5F0] text-slate-700">
                  {usersList.filter(u => u.estado !== 'pendiente_autenticacion').length} Activos
                </span>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-stone-100 text-xs uppercase text-slate-400 font-bold tracking-wider">
                      <th className="py-2.5 px-3">Usuario & Correo</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Rol / Acceso</th>
                      <th className="py-2.5 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {usersList.map((user) => {
                      const isSelf = user.username.toLowerCase() === currentUser.username.toLowerCase();
                      const isPending = user.estado === 'pendiente_autenticacion';
                      const isInactive = user.estado === 'inactivo';

                      return (
                        <tr key={user.id} className="hover:bg-stone-50/70 transition-colors">
                          {/* Columna 1: Usuario & Correo */}
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white capitalize shadow-2xs ${getUserColor(user.role)}`}>
                                {user.username.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                  {user.username}
                                  {isSelf && (
                                    <span className="text-[9px] bg-slate-900 text-lime-400 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                      Tú
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {user.email || `${user.username}@tpp.com`}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Columna 2: Estado */}
                          <td className="py-3 px-3">
                            {isPending ? (
                              <button
                                onClick={() => handleApprovePending(user.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                                title="Clic para autenticar inmediatamente"
                              >
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pendiente (Autenticar)</span>
                              </button>
                            ) : isInactive ? (
                              <button
                                onClick={() => handleToggleUserStatus(user)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                                title="Clic para reactivar cuenta"
                              >
                                <UserX className="w-3 h-3 text-slate-500" />
                                <span>Inactivo</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => !isSelf && handleToggleUserStatus(user)}
                                disabled={isSelf}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold ${
                                  isSelf ? 'cursor-default' : 'hover:bg-emerald-100 cursor-pointer'
                                }`}
                                title={isSelf ? 'Cuenta activa' : 'Clic para pausar cuenta'}
                              >
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Activo</span>
                              </button>
                            )}
                          </td>

                          {/* Columna 3: Asignar Rol */}
                          <td className="py-3 px-3">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                              disabled={isSelf}
                              className={`bg-[#F4F5F0] rounded-xl px-2.5 py-1 text-xs text-slate-900 outline-none transition-all cursor-pointer font-bold ${
                                isSelf ? 'opacity-60 cursor-not-allowed' : ''
                              }`}
                            >
                              <option value="contentd">Diseñador</option>
                              <option value="sac">PM / SAC</option>
                              <option value="contents">Social Media</option>
                              <option value="supervisor">Supervisor</option>
                              <option value="coordinador">Coordinador</option>
                              <option value="director_financiero">Director Financiero</option>
                              <option value="proveedor">Proveedor</option>
                              <option value="invitado">Invitado</option>
                            </select>
                          </td>

                          {/* Columna 4: Acciones */}
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setUserToDelete(user)}
                              disabled={isSelf}
                              className={`p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all cursor-pointer ${
                                isSelf ? 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-slate-400' : ''
                              }`}
                              title={isSelf ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Slide-out Inspector Panel overlay and drawer */}
      {selectedMember && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setSelectedMember(null)}
          />
          <UserInspectorPanel
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
            getUserColor={getUserColor}
            projects={projects}
          />
        </>
      )}

      {/* Modal Confirmación Eliminación de Usuario */}
      <CustomModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        type="danger"
        isDestructive={true}
        title="¿Eliminar usuario del sistema?"
        description={`Esta acción eliminará a "${userToDelete?.username}" de Cloud Firestore y de los proyectos asignados.`}
        confirmLabel="Eliminar Usuario"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (userToDelete) {
            onDeleteUser(userToDelete.id);
            setUserToDelete(null);
          }
        }}
      />
    </div>
  );
};
