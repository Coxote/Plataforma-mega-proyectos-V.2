import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserSession, Role } from '../types';
import { X, UserPlus, Shield, UserCheck, Trash2, Key, Briefcase } from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  usersList: UserSession[];
  projects: { id: string; name: string }[];
  onUpdateUser: (user: UserSession) => void;
  onAddUser: (user: UserSession) => void;
  onDeleteUser: (userId: string) => void;
  currentUser: UserSession;
}

export default function UserManagementModal({
  isOpen,
  onClose,
  usersList,
  projects = [],
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  currentUser,
}: UserManagementModalProps) {
  // New user state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPuesto, setNewPuesto] = useState('ContentS');
  const [assignedProjectId, setAssignedProjectId] = useState('');
  const [tarifaProveedor, setTarifaProveedor] = useState<number | ''>('');
  const [empresaProveedor, setEmpresaProveedor] = useState('');
  const [proyectosAsignados, setProyectosAsignados] = useState<string[]>([]);
  const [fasesAsignadas, setFasesAsignadas] = useState<string[]>(['A5', 'A6']);
  const [formError, setFormError] = useState<string | null>(null);

  const getRoleFromPuesto = (p: string): Role => {
    switch (p) {
      case 'Supervisor':
      case 'Coordinador':
        return 'coordinador';
      case 'PM':
      case 'SAC':
        return 'sac';
      case 'Social media':
      case 'ContentS':
        return 'contents';
      case 'Diseñador':
      case 'Diseño':
      case 'ContentD':
        return 'contentd';
      case 'Director Financiero':
      case 'Finanzas':
        return 'director_financiero';
      case 'Proveedor Externo':
      case 'Proveedor':
        return 'proveedor';
      case 'Invitado':
      default:
        return 'invitado';
    }
  };

  const getPuestoFromRole = (r: Role): string => {
    switch (r) {
      case 'coordinador':
        return 'Supervisor';
      case 'sac':
        return 'PM';
      case 'contents':
        return 'Social media';
      case 'contentd':
        return 'Diseñador';
      case 'director_financiero':
        return 'Director Financiero';
      case 'proveedor':
        return 'Proveedor Externo';
      case 'invitado':
      default:
        return 'Invitado';
    }
  };

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

    const role = getRoleFromPuesto(newPuesto);

    const newUser: UserSession = {
      id: `u-${Date.now()}`,
      username: newUsername.trim(),
      puesto: role === 'proveedor' ? (empresaProveedor ? `Proveedor (${empresaProveedor})` : 'Proveedor Externo') : newPuesto,
      role,
      password: newPassword || '123',
      projectId: newPuesto === 'Cliente / Invitado' || role === 'invitado' ? (assignedProjectId || projects[0]?.id) : undefined,
      tarifaHoraProveedor: role === 'proveedor' && typeof tarifaProveedor === 'number' ? tarifaProveedor : undefined,
      empresaProveedor: role === 'proveedor' ? empresaProveedor.trim() : undefined,
      proyectosAsignados: role === 'proveedor' ? proyectosAsignados : undefined,
      fasesAsignadas: role === 'proveedor' ? fasesAsignadas : undefined,
      estado: 'activo',
    };

    onAddUser(newUser);
    setNewUsername('');
    setNewPassword('');
    setTarifaProveedor('');
    setEmpresaProveedor('');
    setProyectosAsignados([]);
    setFasesAsignadas(['A5', 'A6']);
  };

  const handleRoleChange = (userId: string, newRole: Role) => {
    const userToUpdate = usersList.find((u) => u.id === userId);
    if (!userToUpdate) return;

    const updated: UserSession = {
      ...userToUpdate,
      role: newRole,
      puesto: getPuestoFromRole(newRole),
      projectId: newRole === 'invitado' ? (userToUpdate.projectId || projects[0]?.id) : undefined,
      proyectosAsignados: newRole === 'proveedor' ? (userToUpdate.proyectosAsignados || (projects[0]?.id ? [projects[0].id] : [])) : undefined,
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

  const handleToggleUserStatus = (userId: string) => {
    const userToUpdate = usersList.find((u) => u.id === userId);
    if (!userToUpdate) return;

    const newStatus = (userToUpdate.estado === 'inactivo' ? 'activo' : 'inactivo') as 'activo' | 'inactivo';
    const updated: UserSession = {
      ...userToUpdate,
      estado: newStatus,
    };

    onUpdateUser(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-200"
        id="user-management-modal-card"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-lime-400" />
            <div>
              <h3 className="font-bold text-sm">Administración de Roles & Usuarios</h3>
              <p className="text-[10px] text-slate-400">Gestiona accesos, puestos y roles para el sistema SaaS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Grid */}
        <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Create New User Form */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 self-start">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserPlus className="w-4 h-4 text-lime-600" />
              <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500">Crear Usuario</h4>
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
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
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
                    <option value="Supervisor">Supervisor</option>
                    <option value="PM">PM</option>
                    <option value="Social media">Social media</option>
                    <option value="Diseñador">Diseñador</option>
                    <option value="Director Financiero">Director Financiero</option>
                    <option value="Proveedor Externo">Proveedor Externo</option>
                    <option value="Invitado">Invitado</option>
                  </select>
                </div>
              </div>

              {(newPuesto === 'Proveedor Externo' || newPuesto === 'Proveedor') && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2.5">
                  <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
                    Configuración de Proveedor / Contrata
                  </span>
                  
                  <div>
                    <label className="block text-[9px] font-bold text-amber-900/80 uppercase mb-1">
                      Empresa / Agencia Proveedora
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Devs Studio Latam"
                      value={empresaProveedor}
                      onChange={(e) => setEmpresaProveedor(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-amber-900/80 uppercase mb-1">
                      Tarifa por Hora Acordada ($/h)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Ej: 50.00"
                      value={tarifaProveedor}
                      onChange={(e) => setTarifaProveedor(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-amber-900/80 uppercase mb-1">
                      Proyectos Permitidos
                    </label>
                    <div className="max-h-24 overflow-y-auto space-y-1 bg-white p-2 border border-amber-200 rounded-lg text-xs">
                      {projects.map((p) => {
                        const isChecked = proyectosAsignados.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-amber-50/50 p-1 rounded text-[11px] font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setProyectosAsignados([...proyectosAsignados, p.id]);
                                } else {
                                  setProyectosAsignados(proyectosAsignados.filter(id => id !== p.id));
                                }
                              }}
                              className="rounded border-amber-300 text-amber-600 focus:ring-amber-400"
                            />
                            <span className="truncate">{p.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-amber-900/80 uppercase mb-1">
                      Fases Permitidas / Asignadas
                    </label>
                    <div className="max-h-24 overflow-y-auto space-y-1 bg-white p-2 border border-amber-200 rounded-lg text-xs">
                      {[
                        { id: 'A1', label: 'Fase 1: Kickoff' },
                        { id: 'A2', label: 'Fase 2: Cronograma' },
                        { id: 'A3', label: 'Fase 3: Revisión' },
                        { id: 'A4', label: 'Fase 4: Aprobación' },
                        { id: 'A5', label: 'Fase 5: Sprint (Desarrollo)' },
                        { id: 'A6', label: 'Fase 6: QA (Pruebas)' },
                        { id: 'A7', label: 'Fase 7: Entrega' },
                        { id: 'A8', label: 'Fase 8: Cierre' },
                        { id: 'A9', label: 'Fase 9: Garantía' },
                      ].map((f) => {
                        const isChecked = fasesAsignadas.includes(f.id);
                        return (
                          <label key={f.id} className="flex items-center gap-2 cursor-pointer hover:bg-amber-50/50 p-1 rounded text-[11px] font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFasesAsignadas([...fasesAsignadas, f.id]);
                                } else {
                                  setFasesAsignadas(fasesAsignadas.filter(id => id !== f.id));
                                }
                              }}
                              className="rounded border-amber-300 text-amber-600 focus:ring-amber-400"
                            />
                            <span className="truncate">{f.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

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
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Añadir Usuario
              </button>
            </form>
          </div>

          {/* Right Column: Users List Table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500">Usuarios del Sistema</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {usersList.length} Registrados
              </span>
            </div>

            <div className="overflow-x-auto flex-1 min-h-[300px]">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                    <th className="py-2.5 px-3">Usuario</th>
                    <th className="py-2.5 px-3">Puesto</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Rol / Nivel</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {usersList.map((user) => {
                    const isSelf = user.username.toLowerCase() === currentUser.username.toLowerCase();
                    const isActive = user.estado !== 'inactivo';
                    return (
                      <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${!isActive ? 'opacity-60 bg-slate-50/30' : ''}`}>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          <div className="flex flex-col">
                            <span>{user.username}</span>
                            {isSelf && (
                              <span className="text-[8.5px] text-lime-600 font-bold uppercase tracking-wider mt-0.5">
                                (Tú actual)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-500 max-w-[150px] truncate">
                          {user.puesto}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            disabled={isSelf}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-all ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            } ${isSelf ? 'opacity-70 cursor-not-allowed' : ''}`}
                            title={isSelf ? 'No puedes desactivar tu propia cuenta' : 'Haz clic para cambiar estado'}
                          >
                            {isActive ? '● Activo' : '○ Inactivo'}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1.5">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                              disabled={isSelf || !(currentUser.role === 'coordinador' || currentUser.role === 'supervisor' || currentUser.role === 'director_financiero')}
                              className={`bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:ring-2 focus:ring-lime-400/50 outline-none transition-all cursor-pointer ${
                                isSelf || !(currentUser.role === 'coordinador' || currentUser.role === 'supervisor' || currentUser.role === 'director_financiero') ? 'opacity-60 cursor-not-allowed' : ''
                              }`}
                            >
                              <option value="coordinador">Coordinador</option>
                              <option value="sac">SAC</option>
                              <option value="contents">ContentS</option>
                              <option value="contentd">ContentD</option>
                              <option value="proveedor">Proveedor</option>
                              <option value="invitado">Invitado</option>
                            </select>

                            {user.role === 'proveedor' && (
                              <div className="space-y-1 bg-amber-50/50 p-2 rounded-lg border border-amber-200/60 text-[10px]">
                                <div className="flex items-center gap-1">
                                  <span className="text-amber-800 font-bold">Tarifa:</span>
                                  <input
                                    type="number"
                                    placeholder="50.00"
                                    value={user.tarifaHoraProveedor ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value ? Number(e.target.value) : undefined;
                                      onUpdateUser({ ...user, tarifaHoraProveedor: val });
                                    }}
                                    className="w-16 px-1 py-0.5 bg-white border border-amber-200 rounded font-mono font-bold text-slate-800"
                                  />
                                  <span className="text-slate-500">$/h</span>
                                </div>
                                <div className="text-slate-600 font-medium">
                                  <span>Proyectos:</span> {user.proyectosAsignados?.length || 0} asignados
                                </div>
                              </div>
                            )}

                            {user.role === 'invitado' && (
                              <select
                                value={user.projectId || ''}
                                onChange={(e) => handleUserProjectChange(user.id, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-[10px] text-slate-700 focus:ring-1 focus:ring-lime-400 outline-none transition-all cursor-pointer"
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <p className="text-[10px] text-slate-400 font-medium">
            * Nota: Los cambios de roles se aplican instantáneamente a la sesión de cada usuario activo.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar Gestión
          </button>
        </div>
      </motion.div>
    </div>
  );
}
