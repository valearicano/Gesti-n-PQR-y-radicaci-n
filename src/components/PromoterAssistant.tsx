import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Send, 
  UserCheck, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  HelpCircle,
  FileText,
  RotateCcw,
  Sparkles,
  Search
} from 'lucide-react';
import { APYCode, UserRole } from '../types';

interface PromoterAssistantProps {
  currentUser: UserRole | null;
  onOpenCatalog?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  codigosApy?: APYCode[];
  areaResponsable?: string;
  requisitos?: string[];
  procedimiento?: string[];
}

export const PromoterAssistant: React.FC<PromoterAssistantProps> = ({ currentUser, onOpenCatalog }) => {
  // Regla obligatoria: Preguntar el perfil del usuario al iniciar el chat
  const [selectedProfile, setSelectedProfile] = useState<string>(
    currentUser?.cargo || 'Promotor de Soluciones Nivel 1'
  );
  const [profileConfirmed, setProfileConfirmed] = useState<boolean>(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [apyCatalog, setApyCatalog] = useState<APYCode[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableProfiles = [
    'Promotor de Soluciones Nivel 1 (Canal Presencial y Telefónico)',
    'Promotor de Soluciones Nivel 2 (Escalamiento y Backoffice)',
    'Asesor de Radicaciones Especiales (Tarjetas y Crédito)',
    'Analista de Prevención de Fraude y Seguridad Bancaria',
    'Auditor de Calidad y Cumplimiento Normativo'
  ];

  // Cargar catálogo de códigos APY al montar
  useEffect(() => {
    fetch('/api/catalog/apy-codes')
      .then(res => res.json())
      .then(data => {
        if (data.apyCodes) setApyCatalog(data.apyCodes);
      })
      .catch(console.error);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, profileConfirmed]);

  const handleConfirmProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    setProfileConfirmed(true);

    // Mensaje de bienvenida contextual al perfil
    const welcomeMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `¡Bienvenido! Has iniciado sesión técnica con el perfil: **${selectedProfile}**.\n\nEstoy conectado en tiempo real al **Catálogo Oficial de Códigos APY, Procedimientos y Causales Autorizadas** de Bancolima.\n\n¿Qué trámite o radicación necesitas consultar hoy? Puedes indicar un código numérico (ej. **807, 627, 267, 779, 638**) o describir la necesidad operativa del cliente.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([welcomeMsg]);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        rol: m.sender === 'user' ? ('user' as const) : ('model' as const),
        texto: m.text
      }));

      const res = await fetch('/api/promoter/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfilPromotor: selectedProfile,
          historial: historyPayload,
          mensajeActual: textToSend
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Error en asistente de promotores');
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        sender: 'assistant',
        text: data.respuesta,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        codigosApy: data.codigosApyMencionados,
        areaResponsable: data.areaResponsableRecomendada,
        requisitos: data.requisitosDocumentales,
        procedimiento: data.procedimientoOficial
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'assistant',
          text: `Error de comunicación institucional: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = () => {
    setProfileConfirmed(false);
    setMessages([]);
    setInputMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Banner Superior */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Módulo 2: Asistente para Promotores</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Soporte Técnico Operativo y Radicación APY
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Asistencia directa para promotores de soluciones y analistas operativos. Consulta procedimientos exactos, causales autorizadas, áreas responsables y SLAs oficiales según tu perfil operativo.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-semibold text-slate-200">Catálogo Autorizado:</span>
              <span className="text-slate-400 ml-1">Prohibido inventar códigos o procedimientos.</span>
            </div>
          </div>
        </div>

        {/* Chips de Códigos Mandatorios Iniciales */}
        <div className="mt-4 pt-4 border-t border-slate-700/60">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Códigos APY Mandatorios de Consulta Inmediata:
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { code: '807', label: '807: Cancelación Tarjeta' },
              { code: '627', label: '627: Fraude sin Suplantación' },
              { code: '267', label: '267: Devolución FGA' },
              { code: '779', label: '779: Error en Canales / PSE' },
              { code: '638', label: '638: Cambio Tasa o Cuota Tarjeta' },
              { code: '312', label: '312: Cuota de Manejo' },
              { code: '445', label: '445: Seguros Voluntarios' },
              { code: '510', label: '510: Aplicación de Pago' },
              { code: '198', label: '198: GMF (4x1000)' }
            ].map(c => (
              <button
                key={c.code}
                onClick={() => {
                  if (!profileConfirmed) {
                    setProfileConfirmed(true);
                  }
                  handleSendMessage(`¿Cuál es el procedimiento, causales, requisitos y área responsable para el código APY ${c.code}?`);
                }}
                className="px-3 py-1.5 bg-slate-900/90 hover:bg-blue-600/30 border border-slate-700 hover:border-blue-500 rounded-lg text-xs text-slate-200 hover:text-white transition flex items-center gap-1.5 font-mono"
              >
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pantalla de Selección Obligatoria de Perfil o Chat Activo */}
      {!profileConfirmed ? (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-2xl mx-auto shadow-2xl">
          <div className="text-center space-y-3 mb-6">
            <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
              <UserCheck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Identificación Obligatoria de Perfil de Promotor
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Conforme a la política de seguridad y auditoría de Bancolima, debe definir su perfil operativo antes de acceder a la matriz técnica de radicaciones APY.
            </p>
          </div>

          <form onSubmit={handleConfirmProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Seleccione su Rol o Perfil en la Entidad:
              </label>
              <div className="space-y-2">
                {availableProfiles.map((p) => (
                  <label
                    key={p}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition text-xs ${
                      selectedProfile === p
                        ? 'bg-blue-950/60 border-blue-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <input
                      type="radio"
                      name="promoterProfile"
                      value={p}
                      checked={selectedProfile === p}
                      onChange={(e) => setSelectedProfile(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-600"
                    />
                    <span className="font-medium">{p}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-4"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirmar Perfil e Iniciar Asistente Técnico</span>
            </button>
          </form>
        </div>
      ) : (
        /* Interfaz de Chat Técnico */
        <div className="bg-slate-800 rounded-2xl border border-slate-700 flex flex-col h-[650px] shadow-xl overflow-hidden">
          {/* Barra de Perfil Activo */}
          <div className="px-5 py-3 bg-slate-900 border-b border-slate-700 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <span className="text-slate-400">Perfil en sesión:</span>{' '}
                <strong className="text-white font-semibold">{selectedProfile}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetSession}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cambiar Perfil</span>
              </button>
            </div>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                  <span>{m.sender === 'user' ? 'Tú (Promotor)' : 'Asistente APY Institucional'}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`max-w-3xl rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-900/90 border border-slate-700 text-slate-200 shadow-sm'
                  }`}
                >
                  {m.text}

                  {/* Fichas de Códigos APY Detectados */}
                  {m.codigosApy && m.codigosApy.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-3">
                      <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Ficha Técnica del Código APY
                      </div>
                      {m.codigosApy.map((code) => (
                        <div
                          key={code.id}
                          className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-slate-300"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-900 text-xs">
                              CÓDIGO APY {code.codigo}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              SLA: {code.slaHoras}h ({code.slaDiasHabiles} días hábiles)
                            </span>
                          </div>

                          <div className="font-semibold text-white text-xs">{code.nombre}</div>
                          <p className="text-[11px] text-slate-400">{code.descripcion}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                            <div>
                              <strong className="text-slate-300 block mb-0.5">Área Responsable:</strong>
                              <span className="text-slate-400">{code.areaResponsable}</span>
                            </div>
                            <div>
                              <strong className="text-slate-300 block mb-0.5">Estado:</strong>
                              <span className="text-emerald-400 font-medium">{code.estadoAprobacion}</span>
                            </div>
                          </div>

                          {code.causales && (
                            <div className="pt-1 text-[11px]">
                              <strong className="text-slate-300 block mb-0.5">Causales Autorizadas:</strong>
                              <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                                {code.causales.map((cau, cIdx) => (
                                  <li key={cIdx}>{cau}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {code.requisitos && (
                            <div className="pt-1 text-[11px]">
                              <strong className="text-slate-300 block mb-0.5">Requisitos Operativos:</strong>
                              <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                                {code.requisitos.map((req, rIdx) => (
                                  <li key={rIdx}>{req}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-3 bg-slate-900/50 rounded-xl border border-slate-800 w-fit">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                <span>Consultando catálogo oficial de radicaciones bancarias...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Envío */}
          <div className="p-4 bg-slate-900 border-t border-slate-700">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu consulta sobre códigos APY, causales o procedimientos..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Consultar</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
