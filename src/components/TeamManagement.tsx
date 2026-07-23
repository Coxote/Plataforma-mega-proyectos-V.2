import React, { useState, useMemo } from 'react';
import { UserSession, Project } from '../types';
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
  Sparkles
} from 'lucide-react';
import { TeamCard, VitaminizedMember } from './TeamCard';
import { UserInspectorPanel } from './UserInspectorPanel';
import { calculateTeamWorkload } from '../dashboardUtils';

interface TeamManagementProps {
  usersList: UserSession[];
  projects: Project[];
  onUpdateUser: (user: UserSession) => void;
  onAddUser: (user: UserSession) => void;
  onDeleteUser: (userId: string) => void;
  currentUser: UserSession;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  usersList,
  projects = [],
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  currentUser,
}) => {
  const [subView, setSubView] = useState<'cards' | 'admin'>('cards');
  const [selectedMember, setSelectedMember] = useState<VitaminizedMember | null>(null);

  // Form states for creating a user
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123');
  const [newPuesto, setNewPuesto] = useState('ContentS');
  const [assignedProjectId, setAssignedProjectId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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

  const getPuestoFromRole = (r: 'coordinador' | 'sac' | 'contents' | 'contentd' | 'invitado'): string => {
    switch (r) {
      case 'coordinador':
        return 'Coordinador';
      case 'sac':
        return 'SAC';
      case 'contents':
        return 'ContentS';
      case 'contentd':
        return 'ContentD';
      case 'invitado':
      default:
        return 'Cliente / Invitado';
    }
  };

  const getUserColor = (role: string): string => {
    switch (role) {
      case 'coordinador':
        return 'bg-slate-900';
      case 'sac':
        return 'bg-emerald-600';
      case 'contents':
        return 'bg-purple-600';
      case 'contentd':
        return 'bg-blue-600';
      case 'invitado':
        return 'bg-amber-500';
      default:
        return 'bg-slate-500';
    }
  };

  // Build Vitaminized Member objects dynamically from real user database + active project budgets
  const teamMembers = useMemo<VitaminizedMember[]>(() => {
    const loads = calculateTeamWorkload(usersList, projects);
    return loads.map(load => {
      // Determine skills based on role
      let baseSkills: string[] = [];
      if (load.role === 'coordinador') {
        baseSkills = ['Gestión', 'Finanzas', 'Liderazgo'];
      } else if (load.role === 'sac') {
        baseSkills = ['Cuentas', 'Figma Inspect', 'Copywriting'];
      } else if (load.role === 'contents') {
        baseSkills = ['Social Media', 'Estrategia', 'SEO'];
      } else if (load.role === 'contentd') {
        baseSkills = ['UI/UX Refactor', 'Illustrator', 'Branding'];
      } else {
        baseSkills = ['Invitado'];
      }

      // Add extra skills if they are allocated to specific projects
      const userProjects = projects.filter(p => p.budget && (p.budget[load.role]?.allocated || 0) > 0);
      userProjects.forEach(p => {
        const nameLower = p.name.toLowerCase();
        if (nameLower.includes('futbol') || nameLower.includes('game') || nameLower.includes('recreativo') || nameLower.includes('gaming')) {
          baseSkills.push('Game Dev');
        }
        if (nameLower.includes('ui') || nameLower.includes('ux') || nameLower.includes('web') || nameLower.includes('diseño')) {
          baseSkills.push('UX/UI');
        }
        if (nameLower.includes('redes') || nameLower.includes('campaña') || nameLower.includes('social')) {
          baseSkills.push('Marketing');
        }
      });

      // Clean duplicate skills and limit to 4
      const uniqueSkills = Array.from(new Set(baseSkills)).slice(0, 4);

      return {
        id: load.id,
        username: load.username,
        role: load.role,
        puesto: load.puesto,
        monthlyCapacity: 160, // Standard capacity in hours per month
        loadedHours: load.consumedHours,
        assignedHours: load.assignedHours,
        saturation: load.assignedHours > 0 ? (load.consumedHours / load.assignedHours) * 100 : 0,
        skills: uniqueSkills,
        activeProjectsCount: load.activeProjectsCount
      };
    });
  }, [usersList, projects]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newUsername.trim()) {
      setFormError('El nombre de usuario es obligatorio.');
      return;
    }

    if (usersList.some((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setFormError('Este nombre de usuario ya está registrado.');
      return;
    }

    const newUser: UserSession = {
      id: `u-${Date.now()}`,
      username: newUsername.trim(),
      puesto: newPuesto,
      role: getRoleFromPuesto(newPuesto),
      password: newPassword || '123',
      projectId: newPuesto === 'Cliente / Invitado' ? (assignedProjectId || projects[0]?.id) : undefined,
    };

    onAddUser(newUser);
    setNewUsername('');
    setNewPassword('123');
  };

  const handleRoleChange = (userId: string, newRole: 'coordinador' | 'sac' | 'contents' | 'contentd' | 'invitado') => {
    const userToUpdate = usersList.find((u) => u.id === userId);
    if (!userToUpdate) return;

    const updated: UserSession = {
      ...userToUpdate,
      role: newRole,
      puesto: getPuestoFromRole(newRole),
      projectId: newRole === 'invitado' ? (userToUpdate.projectId || projects[0]?.id) : undefined,
    };

    onUpdateUser(updated);
  };

  const handleUserProjectChange = (userId: string, projectId: string) => {
    const userToUpdate = usersList.find((u) => u.id === userId);
    if (!userToUpdate) return;

    const updated: UserSession = {
      ...userToUpdate,
      projectId: projectId,
    };

    onUpdateUser(updated);
  };

  // Stats for cards
  const totalMembers = usersList.filter(u => u.role !== 'invitado').length;
  const totalClients = usersList.filter(u => u.role === 'invitado').length;

  return (
    <div className="p-6 bg-slate-50/50 min-h-full overflow-y-auto space-y-6 flex flex-col relative" id="team-management-panel">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
            <Shield className="w-3.5 h-3.5 text-lime-600" />
            Control de Personal
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestión del Escuadrón</h1>
          <p className="text-xs text-slate-500 font-medium">Asigna roles técnicos, controla cargas operativas y configura accesos de clientes.</p>
        </div>

        {/* Sub-tab view toggles */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start shrink-0">
          <button
            onClick={() => {
              setSubView('cards');
              setSelectedMember(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subView === 'admin'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Administración y Accesos
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-lime-50 rounded-xl flex items-center justify-center text-lime-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Escuadrón Interno</span>
            <span className="text-xl font-black text-slate-900">{totalMembers} Operadores</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clientes Invitados</span>
            <span className="text-xl font-black text-slate-900">{totalClients} Clientes</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado del Equipo</span>
            <span className="text-xl font-black text-emerald-600">Sincronizado</span>
          </div>
        </div>
      </div>

      {/* SUBVIEWS CONTAINER */}
      {subView === 'cards' ? (
        /* SQUAD BOARDS GRID VIEW */
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-lime-600 animate-pulse" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider font-sans">
              Tablero Operativo de Rendimiento (S30)
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
        /* ADMINISTRATIVE & ACCESS TABLE VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Create New User Form */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 self-start">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserPlus className="w-4 h-4 text-lime-600" />
              <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500">Añadir Nuevo Operador</h4>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[11px] rounded-lg p-2.5 font-semibold">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre de Usuario</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">
                    <UserCheck className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Ej: jorge, sofia"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contraseña</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">
                    <Key className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ej: 123"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Puesto de Trabajo</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">
                    <Briefcase className="w-3.5 h-3.5" />
                  </span>
                  <select
                    value={newPuesto}
                    onChange={(e) => setNewPuesto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all font-medium cursor-pointer"
                  >
                    <option value="Coordinador">Coordinador (coordinador)</option>
                    <option value="SAC">SAC (sac)</option>
                    <option value="ContentS">ContentS (contents)</option>
                    <option value="ContentD">ContentD (contentd)</option>
                    <option value="Cliente / Invitado">Cliente / Invitado (invitado)</option>
                  </select>
                </div>
              </div>

              {newPuesto === 'Cliente / Invitado' && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proyecto Asignado</label>
                  <select
                    value={assignedProjectId}
                    onChange={(e) => setAssignedProjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 focus:bg-white outline-none transition-all font-medium cursor-pointer"
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
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-2 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-lime-400" />
                Añadir al Equipo
              </button>
            </form>
          </div>

          {/* Right: Users List Table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500 font-sans">Miembros del Sistema</h4>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {usersList.length} Registrados
              </span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                    <th className="py-2.5 px-3">Usuario</th>
                    <th className="py-2.5 px-3">Puesto</th>
                    <th className="py-2.5 px-3">Asignar Rol / Acceso</th>
                    <th className="py-2.5 px-3 text-right">Eliminar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((user) => {
                    const isSelf = user.username.toLowerCase() === currentUser.username.toLowerCase();
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[11px] text-slate-700 capitalize">
                              {user.username.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{user.username}</span>
                              {isSelf && (
                                <span className="text-[8.5px] text-lime-600 font-bold uppercase tracking-wider mt-0.5">
                                  (Tú actual)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-500 max-w-[150px] truncate">
                          {user.puesto}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1.5 max-w-[180px]">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                              disabled={isSelf}
                              className={`bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-850 focus:ring-2 focus:ring-lime-400/50 outline-none transition-all cursor-pointer font-bold ${
                                isSelf ? 'opacity-60 cursor-not-allowed' : ''
                              }`}
                            >
                              <option value="coordinador">Coordinador</option>
                              <option value="sac">SAC</option>
                              <option value="contents">ContentS</option>
                              <option value="contentd">ContentD</option>
                              <option value="invitado">Invitado</option>
                            </select>

                            {user.role === 'invitado' && (
                              <select
                                value={user.projectId || ''}
                                onChange={(e) => handleUserProjectChange(user.id, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 text-[10px] text-slate-700 focus:ring-1 focus:ring-lime-400 outline-none transition-all cursor-pointer font-semibold"
                              >
                                <option value="">Sin proyecto</option>
                                {projects.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`¿Estás seguro de que deseas eliminar a "${user.username}"?`)) {
                                onDeleteUser(user.id);
                              }
                            }}
                            disabled={isSelf}
                            className={`p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer ${
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
      )}

      {/* Global Slide-out Inspector Panel overlay and drawer */}
      {selectedMember && (
        <>
          {/* Backdrop */}
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

    </div>
  );
};
