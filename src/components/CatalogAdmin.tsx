import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Edit3, 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight, 
  Users, 
  BookOpen, 
  Sliders, 
  CheckCircle2, 
  Clock, 
  Building2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { APYCode, PQRCategory, BusinessRule, UserRole } from '../types';

interface CatalogAdminProps {
  currentUser: UserRole | null;
}

export const CatalogAdmin: React.FC<CatalogAdminProps> = ({ currentUser }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'apy' | 'categories' | 'rules' | 'users'>('apy');
  
  const [apyCodes, setApyCodes] = useState<APYCode[]>([]);
  const [categories, setCategories] = useState<PQRCategory[]>([]);
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states for creating/editing APY code
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [editingCode, setEditingCode] = useState<APYCode | null>(null);
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formArea, setFormArea] = useState('Operaciones Tarjetas / Soluciones');
  const [formCausales, setFormCausales] = useState('');
  const [formRequisitos, setFormRequisitos] = useState('');
  const [formSlaHoras, setFormSlaHoras] = useState(48);
  const [formSlaDias, setFormSlaDias] = useState(3);
  const [formEstado, setFormEstado] = useState<'APROBADO' | 'PENDIENTE_APROBACION'>('APROBADO');

  const isAdmin = currentUser?.rol === 'ADMIN_CALIDAD';

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/catalog/apy-codes').then(r => r.json()),
      fetch('/api/catalog/categories').then(r => r.json()),
      fetch('/api/catalog/rules').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json())
    ]).then(([apyData, catData, rulesData, authData]) => {
      if (apyData.apyCodes) setApyCodes(apyData.apyCodes);
      if (catData.categories) setCategories(catData.categories);
      if (rulesData.rules) setRules(rulesData.rules);
      if (authData.availableUsers) setUsers(authData.availableUsers);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleOpenCreateCode = () => {
    setEditingCode(null);
    setFormCodigo('');
    setFormNombre('');
    setFormDescripcion('');
    setFormArea('Gerencia de Soluciones');
    setFormCausales('');
    setFormRequisitos('');
    setFormSlaHoras(48);
    setFormSlaDias(3);
    setFormEstado('APROBADO');
    setShowCodeModal(true);
  };

  const handleOpenEditCode = (c: APYCode) => {
    setEditingCode(c);
    setFormCodigo(c.codigo);
    setFormNombre(c.nombre);
    setFormDescripcion(c.descripcion);
    setFormArea(c.areaResponsable);
    setFormCausales(c.causales.join('\n'));
    setFormRequisitos(c.requisitos.join('\n'));
    setFormSlaHoras(c.slaHoras);
    setFormSlaDias(c.slaDiasHabiles);
    setFormEstado(c.estadoAprobacion);
    setShowCodeModal(true);
  };

  const handleSaveCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Solo el Administrador de Calidad tiene permisos para modificar el catálogo oficial.');
      return;
    }

    const payload = {
      codigo: formCodigo,
      nombre: formNombre,
      descripcion: formDescripcion,
      areaResponsable: formArea,
      causales: formCausales.split('\n').filter(s => s.trim().length > 0),
      requisitos: formRequisitos.split('\n').filter(s => s.trim().length > 0),
      slaHoras: Number(formSlaHoras),
      slaDiasHabiles: Number(formSlaDias),
      estadoAprobacion: formEstado
    };

    try {
      const url = editingCode 
        ? `/api/catalog/apy-codes/${editingCode.id}`
        : '/api/catalog/apy-codes';
      const method = editingCode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');

      setShowCodeModal(false);
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    if (!isAdmin) {
      alert('Solo el Administrador de Calidad puede modificar el estado de las reglas.');
      return;
    }

    try {
      const res = await fetch(`/api/catalog/rules/${ruleId}/toggle`, {
        method: 'PUT'
      });
      if (!res.ok) throw new Error('Error al actualizar regla');
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado del Módulo */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Módulo 4: Catálogos, Reglas y Gobernanza</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Administración de Parámetros Institucionales
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Gestione los códigos APY oficiales, la taxonomía de categorías PQR, las reglas de exclusión y la matriz de roles y permisos con trazabilidad y versionamiento.
            </p>
          </div>

          {!isAdmin && (
            <div className="bg-amber-950/40 border border-amber-800 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Modo Lectura: Su rol actual ({currentUser?.cargo}) no tiene permisos de edición.</span>
            </div>
          )}
        </div>

        {/* Sub-Tabs de Administración */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-700/60">
          <button
            onClick={() => setActiveAdminTab('apy')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              activeAdminTab === 'apy'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Códigos APY y Procedimientos ({apyCodes.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('categories')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              activeAdminTab === 'categories'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Categorías PQR Autorizadas ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('rules')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              activeAdminTab === 'rules'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Reglas de Negocio & Exclusión ({rules.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              activeAdminTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuarios & Matriz de Permisos RLS ({users.length})</span>
          </button>
        </div>
      </div>

      {/* Contenido Sub-Tab 1: Códigos APY */}
      {activeAdminTab === 'apy' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">
              Códigos de radicación oficiales configurados para la operación bancaria
            </span>
            {isAdmin && (
              <button
                onClick={handleOpenCreateCode}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Código APY</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apyCodes.map((c) => (
              <div
                key={c.id}
                className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-3 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-mono font-bold text-sm bg-blue-950 text-blue-300 px-2.5 py-0.5 rounded border border-blue-800">
                      APY {c.codigo}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      c.estadoAprobacion === 'APROBADO' 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {c.estadoAprobacion}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-2">{c.nombre}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.descripcion}</p>

                  <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{c.areaResponsable}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>SLA: {c.slaHoras} horas ({c.slaDiasHabiles} días hábiles)</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300 block mb-0.5">Causales ({c.causales.length}):</span>
                    <ul className="list-disc list-inside space-y-0.5 line-clamp-3">
                      {c.causales.map((cau, idx) => <li key={idx}>{cau}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/60 flex justify-between items-center text-xs">
                  <span className="text-[10px] text-slate-500 font-mono">v{c.version}.0</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleOpenEditCode(c)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar Ficha</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenido Sub-Tab 2: Categorías PQR */}
      {activeAdminTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-3 shadow-md"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {cat.nombre}
                  </span>
                  <span className="font-mono text-[10px] text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-900">
                    ID: {cat.codigoIdentificador}
                  </span>
                </div>

                <p className="text-xs text-slate-300">{cat.descripcion}</p>

                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Código APY por Defecto:</span>
                    <span className="font-mono text-amber-400 font-bold">APY {cat.codigoApyDefault}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Área Responsable:</span>
                    <span className="text-white font-medium">{cat.areaDefault}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <span className="font-semibold text-slate-300 block">Criterio Superintendencia Financiera:</span>
                  <p className="text-slate-400 text-[11px] italic">{cat.criterioSuperfinanciera}</p>
                </div>

                <div className="text-xs space-y-1">
                  <span className="font-semibold text-rose-300 block">Reglas de Exclusión Asociadas:</span>
                  <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-0.5">
                    {cat.reglasExclusion.map((rex, idx) => <li key={idx}>{rex}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenido Sub-Tab 3: Reglas de Negocio & Exclusión */}
      {activeAdminTab === 'rules' && (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Matriz de Reglas de Negocio Bancarias y Criterios Críticos
            </h2>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-slate-900 p-4 rounded-xl border border-slate-700/80 space-y-2.5 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{rule.nombre}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900">
                        v{rule.version}.0
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        rule.activa 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {rule.activa ? 'ACTIVA' : 'INACTIVA'}
                      </span>

                      {isAdmin && (
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className="text-slate-400 hover:text-white"
                          title="Alternar estado de regla"
                        >
                          {rule.activa ? (
                            <ToggleRight className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-slate-600" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-300">{rule.descripcion}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Patrón de Detección:</span>
                      <code className="text-amber-400 font-mono text-[10px]">{rule.patronDeteccion}</code>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Acción del Motor:</span>
                      <span className="text-blue-300 font-semibold">{rule.accion}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Categoría Destino / APY:</span>
                      <span className="text-emerald-300 font-semibold">
                        {rule.categoriaDestino || 'N/A'} {rule.codigoApySugerido ? `(APY ${rule.codigoApySugerido})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-850 p-2 rounded border border-slate-800">
                    <strong className="text-slate-300">Justificación Normativa:</strong> {rule.justificacionNormativa}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contenido Sub-Tab 4: Usuarios y Matriz RLS */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Matriz de Control de Acceso por Rol (RBAC / RLS)
            </h2>

            <div className="overflow-x-auto rounded-xl border border-slate-700">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">Correo Institucional</th>
                    <th className="p-3">Cargo Operativo</th>
                    <th className="p-3">Rol del Sistema</th>
                    <th className="p-3">Permisos Habilitados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 bg-slate-850">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-750">
                      <td className="p-3 font-semibold text-white">{u.nombre}</td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{u.email}</td>
                      <td className="p-3 text-slate-300">{u.cargo}</td>
                      <td className="p-3 font-mono font-bold text-xs text-blue-400">{u.rol}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {u.permisos.map((perm, pIdx) => (
                            <span key={pIdx} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                              {perm}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Código APY */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveCode} className="bg-slate-850 border border-slate-700 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white border-b border-slate-700 pb-3">
              {editingCode ? `Editar Código APY ${editingCode.codigo}` : 'Registrar Nuevo Código APY'}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Código Numérico *</label>
                <input
                  type="text"
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value)}
                  placeholder="Ej: 807"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Estado de Aprobación</label>
                <select
                  value={formEstado}
                  onChange={(e) => setFormEstado(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="APROBADO">APROBADO</option>
                  <option value="PENDIENTE_APROBACION">PENDIENTE_APROBACION</option>
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-300 mb-1">Nombre del Trámite *</label>
              <input
                type="text"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Ej: Cancelación de Tarjeta de Crédito"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                required
              />
            </div>

            <div className="text-xs">
              <label className="block text-slate-300 mb-1">Área Responsable *</label>
              <input
                type="text"
                value={formArea}
                onChange={(e) => setFormArea(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">SLA en Horas</label>
                <input
                  type="number"
                  value={formSlaHoras}
                  onChange={(e) => setFormSlaHoras(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">SLA en Días Hábiles</label>
                <input
                  type="number"
                  value={formSlaDias}
                  onChange={(e) => setFormSlaDias(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-300 mb-1">Causales Aprobadas (una por línea)</label>
              <textarea
                value={formCausales}
                onChange={(e) => setFormCausales(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div className="text-xs">
              <label className="block text-slate-300 mb-1">Requisitos Operativos (uno por línea)</label>
              <textarea
                value={formRequisitos}
                onChange={(e) => setFormRequisitos(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
              >
                Guardar Código APY
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
