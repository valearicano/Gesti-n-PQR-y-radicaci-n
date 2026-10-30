import React, { useState } from 'react';
import { 
  Headset, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Clock, 
  ShieldAlert, 
  ExternalLink, 
  HelpCircle,
  Building2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { CommercialEvaluation } from '../types';

interface CommercialAssistantProps {
  onTransferToBatch?: (text: string, categorySuggestion?: string) => void;
}

export const CommercialAssistant: React.FC<CommercialAssistantProps> = ({ onTransferToBatch }) => {
  const [solicitud, setSolicitud] = useState('');
  const [canal, setCanal] = useState('Sucursal Física - Asesor Comercial');
  const [perfilCliente, setPerfilCliente] = useState('Persona Natural');
  const [producto, setProducto] = useState('Tarjeta de Crédito');
  const [monto, setMonto] = useState('');
  const [reclamoPrevio, setReclamoPrevio] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<CommercialEvaluation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({});

  const predefinedCases = [
    {
      title: 'Caso 1: Trámite comercial puro (Sin PQR)',
      text: 'Buenas tardes, deseo solicitar un aumento de cupo en mi tarjeta de crédito Oro y consultar qué tasas me ofrecen para una compra de cartera de otro banco.',
      prod: 'Tarjeta de Crédito',
      monto: '5000000'
    },
    {
      title: 'Caso 2: Inconformidad con seguro no autorizado (PQR Mandatoria)',
      text: 'Vengo a la oficina porque en mi extracto me siguen cobrando $38.500 de un Seguro Cardif Protección Vida que jamás solicité ni autoricé. Exijo la cancelación inmediata y la devolución de todas las cuotas cobradas.',
      prod: 'Tarjeta de Crédito',
      monto: '154000'
    },
    {
      title: 'Caso 3: Pago no aplicado con mora injustificada (PQR Soluciones)',
      text: 'El día 20 pagué la cuota de mi crédito por $650.000 con soporte bancario, sin embargo el banco no aplicó el pago y ahora me reportan en mora y me están cobrando intereses moratorios que no debo.',
      prod: 'Crédito de Consumo / Libre Inversión',
      monto: '650000'
    },
    {
      title: 'Caso 4: Cobranza prejudicial (Área Especializada)',
      text: 'Tengo una mora de 120 días en mi tarjeta de crédito y me están llamando de una casa de cobranzas de abogados cobrándome honorarios muy altos. Deseo saber cómo hacer una renegociación con el banco directamente.',
      prod: 'Tarjeta de Crédito',
      monto: '4200000'
    }
  ];

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!solicitud.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setCheckedItems({});

    try {
      const response = await fetch('/api/commercial/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitudCliente: solicitud,
          canal,
          perfilCliente,
          productoInvolucrado: producto,
          montoReclamado: monto,
          antecedenteReclamoPrevio: reclamoPrevio
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al evaluar la solicitud comercial');
      }

      setEvaluation(data.evaluation);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCase = (c: typeof predefinedCases[0]) => {
    setSolicitud(c.text);
    setProducto(c.prod);
    setMonto(c.monto);
    setEvaluation(null);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado del Módulo */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Headset className="w-4 h-4" />
              <span>Módulo 1: Asistente Comercial</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Triaje Inteligente de Solicitudes y Reclamaciones
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Identifica objetivamente si la consulta del cliente corresponde a un <strong className="text-white">trámite comercial ordinario</strong>, a la <strong className="text-white">Gerencia de Soluciones (PQR)</strong> o a <strong className="text-white">otra área institucional</strong>. Aplica criterios de la Superintendencia Financiera para evitar descartar quejas legítimas o generar radicaciones PQR innecesarias.
            </p>
          </div>
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-300 flex items-start gap-2.5 max-w-sm">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">Regla Institucional:</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Prohibido dilatar una queja por ofrecer una alternativa comercial. Si hay disconformidad objetiva, la PQR debe radicarse formalmente en el término de ley (15 días hábiles).
              </p>
            </div>
          </div>
        </div>

        {/* Casos de Prueba Rápida */}
        <div className="mt-5 pt-4 border-t border-slate-700/60">
          <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Cargar Casos Típicos Bancarios de Evaluación Rápida:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {predefinedCases.map((c, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadCase(c)}
                className="text-left text-xs bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/80 hover:border-blue-500/50 p-2.5 rounded-lg text-slate-300 hover:text-white transition group"
              >
                <div className="font-semibold text-blue-400 group-hover:text-blue-300 truncate">
                  {c.title}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {c.text}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario de Entrada */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleEvaluate} className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Datos de la Solicitud del Consumidor Financiero
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Relato o Solicitud del Cliente <span className="text-red-400">*</span>
              </label>
              <textarea
                value={solicitud}
                onChange={(e) => setSolicitud(e.target.value)}
                placeholder="Describa textualmente lo expresado por el cliente o copie la solicitud..."
                rows={5}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {solicitud.length} caracteres ingresados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Canal de Atención
                </label>
                <select
                  value={canal}
                  onChange={(e) => setCanal(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option>Sucursal Física - Asesor Comercial</option>
                  <option>Línea Telefónica de Atención (Contact Center)</option>
                  <option>App Móvil Bancolima</option>
                  <option>Portal Web Transaccional</option>
                  <option>Defensor del Consumidor Financiero</option>
                  <option>Superintendencia Financiera de Colombia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tipo de Consumidor
                </label>
                <select
                  value={perfilCliente}
                  onChange={(e) => setPerfilCliente(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option>Persona Natural</option>
                  <option>Persona Jurídica / PYME</option>
                  <option>Preferencial / Banca Premium</option>
                  <option>Adulto Mayor / Sujeto de Protección Especial</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Producto Involucrado
                </label>
                <select
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option>Tarjeta de Crédito</option>
                  <option>Cuenta de Ahorros / Corriente</option>
                  <option>Crédito de Consumo / Libre Inversión</option>
                  <option>Crédito de Libranza</option>
                  <option>Crédito Hipotecario / Leasing</option>
                  <option>Seguros y Pólizas (Bancaseguros)</option>
                  <option>Certificado de Depósito a Término (CDT)</option>
                  <option>Canales Digitales / PSE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Monto Reclamado (COP)
                </label>
                <input
                  type="text"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ej: 350000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="check-reclamo"
                checked={reclamoPrevio}
                onChange={(e) => setReclamoPrevio(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="check-reclamo" className="text-xs text-slate-300 select-none">
                ¿El cliente ya tiene un reclamo previo no resuelto sobre este hecho?
              </label>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !solicitud.trim()}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analizando Reglas Institucionales con IA...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Evaluar y Determinar Ruta Operativa</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Panel de Resultados del Triaje */}
        <div className="lg:col-span-7">
          {evaluation ? (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-5 shadow-lg">
              {/* Badge Principal de Clasificación */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Dictamen de Triaje Institucional
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {evaluation.tipoTramite === 'TRAMITE_COMERCIAL' && (
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Trámite Comercial Ordinario
                      </span>
                    )}
                    {evaluation.tipoTramite === 'GERENCIA_SOLUCIONES' && (
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Gerencia de Soluciones (PQR)
                      </span>
                    )}
                    {evaluation.tipoTramite === 'OTRA_AREA_INSTITUCIONAL' && (
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        Otra Área Institucional Especializada
                      </span>
                    )}

                    <span className="text-xs text-slate-300 font-medium">
                      Asignar a: <strong className="text-white">{evaluation.areaSugerida}</strong>
                    </span>
                  </div>
                </div>

                {/* Decisión de PQR */}
                <div className={`p-3 rounded-xl border text-center ${
                  evaluation.debeRadicarsePQR 
                    ? 'bg-rose-950/40 border-rose-700/80 text-rose-200' 
                    : 'bg-emerald-950/40 border-emerald-700/80 text-emerald-200'
                }`}>
                  <div className="text-[10px] uppercase font-bold tracking-wider">¿Radicación PQR Mandatoria?</div>
                  <div className="text-sm font-extrabold mt-0.5">
                    {evaluation.debeRadicarsePQR ? 'SÍ (RADICAR FORMALMENTE)' : 'NO (TRÁMITE COMERCIAL SIN PQR)'}
                  </div>
                  {evaluation.codigoApyRecomendadoSiAplica && (
                    <div className="text-[10px] mt-1 bg-slate-900/80 px-2 py-0.5 rounded text-amber-300 font-mono">
                      APY Sugerido: {evaluation.codigoApyRecomendadoSiAplica}
                    </div>
                  )}
                </div>
              </div>

              {/* Motivo y Criterio Legal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700/70 space-y-1.5">
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                    Fundamentación del Triaje
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {evaluation.motivoPQR}
                  </p>
                </div>

                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700/70 space-y-1.5">
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                    Criterio Superintendencia Financiera
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {evaluation.criterioSuperfinanciera}
                  </p>
                </div>
              </div>

              {/* Checklist de Requisitos Documentales */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    Checklist Documental Institucional Requerido:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {Object.values(checkedItems).filter(Boolean).length} de {evaluation.checklistRequisitos.length} verificados
                  </span>
                </div>
                <div className="space-y-2">
                  {evaluation.checklistRequisitos.map((req, i) => (
                    <label key={i} className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer hover:text-white transition">
                      <input
                        type="checkbox"
                        checked={!!checkedItems[i]}
                        onChange={(e) => setCheckedItems({ ...checkedItems, [i]: e.target.checked })}
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className={checkedItems[i] ? 'line-through text-slate-500' : ''}>
                        {req}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ruta Sugerida Paso a Paso */}
              <div>
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Ruta Operativa Recomendada:
                </span>
                <ol className="space-y-2">
                  {evaluation.rutaSugeridaPasoAPaso.map((paso, idx) => (
                    <li key={idx} className="text-xs bg-slate-900/70 p-2.5 rounded-lg border border-slate-700/60 text-slate-300 flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{paso}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Advertencia Legal Institucional */}
              <div className="p-3 bg-blue-950/30 border border-blue-900/60 rounded-xl text-[11px] text-blue-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>{evaluation.advertenciaLegal}</span>
              </div>

              {/* Botón de Acción Directa */}
              {evaluation.debeRadicarsePQR && onTransferToBatch && (
                <div className="pt-2">
                  <button
                    onClick={() => onTransferToBatch(solicitud, evaluation.codigoApyRecomendadoSiAplica)}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Transferir Caso al Lector Masivo PQR para Radicación y Clasificación</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 p-12 text-center text-slate-400 h-full flex flex-col items-center justify-center">
              <Headset className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-slate-300">
                Esperando Consulta Comercial
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Ingrese los hechos planteados por el cliente o seleccione uno de los casos típicos de prueba para obtener el triaje de ley y la ruta de atención.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
