/**
 * Servicio Gemini API para Operaciones Bancarias y PQR
 * Ejecuta llamadas server-side con structured JSON y grounding institucional.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { bankDb } from './db.js';
import { BankRulesEngine, ClassificationResult, PQRInputRecord } from './rulesEngine.js';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface CommercialEvaluationResult {
  tipoTramite: 'TRAMITE_COMERCIAL' | 'GERENCIA_SOLUCIONES' | 'OTRA_AREA_INSTITUCIONAL';
  areaSugerida: string;
  debeRadicarsePQR: boolean;
  motivoPQR: string;
  criterioSuperfinanciera: string;
  checklistRequisitos: string[];
  rutaSugeridaPasoAPaso: string[];
  advertenciaLegal: string;
  resumenEjecutivo: string;
  codigoApyRecomendadoSiAplica?: string;
}

export class BankAIService {
  /**
   * Módulo 1: Asistente Comercial
   * Identifica si el caso corresponde a trámite comercial, Gerencia de Soluciones o a otra área.
   * Evalúa si existe una reclamación que deba gestionarse como PQR sin crear ni descartar PQR automáticamente.
   */
  public static async evaluateCommercialCase(data: {
    solicitudCliente: string;
    canal: string;
    perfilCliente: string;
    productoInvolucrado: string;
    montoReclamado?: string;
    antecedenteReclamoPrevio?: boolean;
  }): Promise<CommercialEvaluationResult> {
    const ai = getGenAI();
    const prompt = `
Actúa como especialista legal y operativo en regulación bancaria y atención al consumidor financiero (Superintendencia Financiera de Colombia - Circular Básica Jurídica CE 029/2014).

Analiza el siguiente caso de un cliente presentado en el canal "${data.canal}":
- Tipo de Cliente: ${data.perfilCliente}
- Producto Involucrado: ${data.productoInvolucrado}
- Solicitud/Queja del Cliente: "${data.solicitudCliente}"
- Monto mencionado: ${data.montoReclamado || 'No especificado'}
- ¿Tiene reclamo previo pendiente?: ${data.antecedenteReclamoPrevio ? 'SÍ' : 'NO'}

REGLAS INSTITUCIONALES CRÍTICAS:
1. Identifica objetivamente si el caso corresponde a:
   - "TRAMITE_COMERCIAL" (trámite comercial puro: aumento de cupo voluntario, asesoría, apertura de nuevo producto, compra de cartera pacífica, cambio de plan sin inconformidad).
   - "GERENCIA_SOLUCIONES" (inconformidad, objeción de cobros, fallas técnicas, solicitud de anulación de comisiones, controversia contractual).
   - "OTRA_AREA_INSTITUCIONAL" (Cobranzas prejudicial/judicial, Prevención de Fraude / Seguridad Bancaria, Defensor del Consumidor Financiero, Gestión Tributaria DIAN).
2. Evalúa si existe una inconformidad o perjuicio que constituya queja o reclamo conforme a la ley:
   - NO descartes una PQR si el cliente manifiesta inconformidad por un cobro, falla del servicio o vulneración de sus derechos, aun si solicita trámite comercial simultáneo.
   - NO generes una PQR de forma automática si es una simple petición de información o una solicitud comercial ordinaria sin reclamo.
   - Aplica criterios institucionales verificables: afectación económica, falta de consentimiento, incumplimiento de condiciones pactadas o tiempo vencido de respuesta.
3. Códigos APY autorizados: 807 (Cancelación tarjeta), 627 (Fraude sin suplantación), 267 (Devolución FGA), 779 (Error en canales), 638 (Cambio de tasa o cuota tarjeta), 312 (Cuota de manejo), 445 (Seguros), 510 (Aplicación de pago), 198 (GMF 4x1000).
`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'Eres el auditor y orientador oficial de procesos comerciales y PQR del banco. Responde únicamente en JSON estructurado.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                tipoTramite: {
                  type: Type.STRING,
                  description: 'TRAMITE_COMERCIAL | GERENCIA_SOLUCIONES | OTRA_AREA_INSTITUCIONAL',
                },
                areaSugerida: { type: Type.STRING },
                debeRadicarsePQR: { type: Type.BOOLEAN },
                motivoPQR: { type: Type.STRING },
                criterioSuperfinanciera: { type: Type.STRING },
                checklistRequisitos: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                rutaSugeridaPasoAPaso: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                advertenciaLegal: { type: Type.STRING },
                resumenEjecutivo: { type: Type.STRING },
                codigoApyRecomendadoSiAplica: { type: Type.STRING },
              },
              required: [
                'tipoTramite',
                'areaSugerida',
                'debeRadicarsePQR',
                'motivoPQR',
                'criterioSuperfinanciera',
                'checklistRequisitos',
                'rutaSugeridaPasoAPaso',
                'advertenciaLegal',
                'resumenEjecutivo'
              ],
            },
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          return parsed as CommercialEvaluationResult;
        }
      } catch (err) {
        console.warn('Gemini Commercial evaluation fallback to deterministic rules:', err);
      }
    }

    // Fallback determinístico con reglas estrictas de negocio
    const textLower = (data.solicitudCliente || '').toLowerCase();
    const hasDisconformity = /\b(reclamo|inconforme|no\s+reconozco|abuso|fraude|me\s+cobraron|devuelvan|no\s+estoy\s+de\s+acuerdo|ilegal|sin\s+mi\s+consentimiento|cancele\s+y\s+siguen|falla|error)\b/i.test(textLower);
    const isCommercialRequest = /\b(aumento\s+de\s+cupo|solicitar\s+credito|comprar\s+cartera|abrir\s+cuenta|portafolio|asesoria\s+comercial|nueva\s+tarjeta)\b/i.test(textLower);

    let tipo: 'TRAMITE_COMERCIAL' | 'GERENCIA_SOLUCIONES' | 'OTRA_AREA_INSTITUCIONAL' = 'TRAMITE_COMERCIAL';
    let area = 'Red de Sucursales y Asesoría Comercial';
    let debePQR = false;
    let motivo = 'La solicitud no presenta controversia jurídica ni queja por mala prestación; corresponde a una gestión comercial ordinaria.';
    let apyCode: string | undefined = undefined;

    if (hasDisconformity) {
      tipo = 'GERENCIA_SOLUCIONES';
      area = 'Gerencia de Soluciones y Reclamaciones PQR';
      debePQR = true;
      motivo = 'El cliente manifiesta inconformidad expresa por cobros, transacciones no reconocidas o fallas de servicio. Requiere radicación formal con radicado PQR y término de ley.';
      if (/\b(4x1000|gmf)\b/i.test(textLower)) apyCode = '198';
      else if (/\b(tarjeta.*cancel|cancelar.*tarjeta)\b/i.test(textLower)) apyCode = '807';
      else if (/\b(fraude|no\s+reconozco)\b/i.test(textLower)) apyCode = '627';
      else if (/\b(fga|fondo\s+de\s+garantias)\b/i.test(textLower)) apyCode = '267';
      else if (/\b(pse|cajero|atm)\b/i.test(textLower)) apyCode = '779';
      else if (/\b(cuota\s+de\s+manejo)\b/i.test(textLower)) apyCode = '312';
      else if (/\b(seguro|poliza)\b/i.test(textLower)) apyCode = '445';
      else apyCode = '510';
    } else if (/\b(cobranza|abogado|mora\s+castigada|acuerdo\s+de\s+pago\s+moroso)\b/i.test(textLower)) {
      tipo = 'OTRA_AREA_INSTITUCIONAL';
      area = 'Gerencia de Cobranzas y Normalización de Cartera';
      motivo = 'Gestión especializada de cartera en mora y acuerdos prejudiciales.';
    }

    return {
      tipoTramite: tipo,
      areaSugerida: area,
      debeRadicarsePQR: debePQR,
      motivoPQR: motivo,
      criterioSuperfinanciera: 'Circular Básica Jurídica CE 029 de 2014: Toda manifestación de disconformidad formulada por un consumidor financiero debe tramitarse bajo el régimen de PQR con plazo máximo de 15 días hábiles.',
      checklistRequisitos: [
        'Documento de identidad del titular y verificación biométrica/2FA',
        'Número de producto financiero objeto de la solicitud',
        'Extracto bancario o soporte transaccional (CUS, voucher, captura)',
        'Formulario o registro formal de radicación con fecha y hora exacta'
      ],
      rutaSugeridaPasoAPaso: [
        'Paso 1: Validar identidad y perfil de riesgo en la plataforma central.',
        'Paso 2: ' + (debePQR ? 'Ingresar a la bandeja PQR y radicar formalmente generando número de ticket único para el cliente.' : 'Gestionar a través del CRM Comercial sin generar PQR innecesaria.'),
        'Paso 3: Notificar al cliente el radicado y los canales de seguimiento institucionales.',
        'Paso 4: Remitir documentación al área responsable (' + area + ').'
      ],
      advertenciaLegal: 'De acuerdo con el Régimen de Protección al Consumidor Financiero (Ley 1328 de 2009), está prohibido dilatar o negar la radicación formal de un reclamo cuando el cliente manifiesta inconformidad.',
      resumenEjecutivo: `Caso tipificado como ${tipo}. Canal: ${data.canal}. Área asignada: ${area}.`,
      codigoApyRecomendadoSiAplica: apyCode
    };
  }

  /**
   * Módulo 2: Asistente para Promotores
   * Pregunta el perfil del usuario al iniciar el chat.
   * Consulta el catálogo administrable de códigos APY, procedimientos, causales y responsables.
   * NO inventa códigos ni procedimientos.
   */
  public static async promoterChat(params: {
    perfilPromotor: string; // OBLIGATORIO: e.g. "Promotor Nivel 1", "Promotor Nivel 2", "Asesor de Soluciones"
    historial: { rol: 'user' | 'model'; texto: string }[];
    mensajeActual: string;
  }): Promise<{
    respuesta: string;
    codigosApyMencionados: any[];
    areaResponsableRecomendada?: string;
    procedimientoOficial?: string[];
    requisitosDocumentales?: string[];
    alertaSeguridad?: string;
  }> {
    if (!params.perfilPromotor || params.perfilPromotor === 'NO_DEFINIDO') {
      return {
        respuesta: 'Estimado usuario: Para garantizar la rigurosidad operativa y consultar el catálogo de códigos APY oficial, es un requisito institucional indicar su perfil (Ejemplo: Promotor Nivel 1, Asesor Nivel 2, Backoffice o Auditor). Por favor seleccione o confirme su perfil en el selector superior para iniciar la consulta.',
        codigosApyMencionados: [],
        alertaSeguridad: 'REQUISITO_PERFIL_PENDIENTE: No se permite operar el asistente de promotores sin perfil autenticado.'
      };
    }

    const ai = getGenAI();
    // Contexto del catálogo oficial autorizado
    const catalogSummary = bankDb.apyCodes.map(c => 
      `[Código APY ${c.codigo}] "${c.nombre}". Área: ${c.areaResponsable}. SLA: ${c.slaHoras}h (${c.slaDiasHabiles} días hábiles). Causales: ${c.causales.join(' | ')}. Requisitos: ${c.requisitos.join(' | ')}. Estado: ${c.estadoAprobacion}.`
    ).join('\n\n');

    const systemPrompt = `
Eres el Asistente Técnico Oficial de Radicaciones Bancarias para Promotores de Soluciones y Backoffice.
Perfil activo del usuario: "${params.perfilPromotor}".

REGLAS INSTITUCIONALES DE OBLIGATORIO CUMPLIMIENTO:
1. NUNCA inventes códigos APY, procedimientos, causales ni políticas que no estén en el catálogo oficial.
2. Tu catálogo de códigos APY autorizados y aprobados es ÚNICAMENTE el siguiente:
${catalogSummary}
3. Códigos esenciales mandatorios en el sistema:
   - 807: Cancelación de tarjeta de crédito
   - 627: Fraude sin suplantación
   - 267: Devolución de FGA (Fondo de Garantías)
   - 779: Error en canales electrónicos (Cajeros, PSE, App)
   - 638: Cambio de tasa o cuota en tarjeta de crédito
   - 312: Exoneración y reintegro de cuota de manejo
   - 445: Objeción y cancelación de seguros voluntarios
   - 510: Aplicación y corrección de pagos
   - 198: Exención y ajuste de GMF (4x1000)
4. Si el promotor pregunta por un código o procedimiento que no existe en este catálogo:
   - Responde claramente que NO se encuentra en el catálogo oficial aprobado.
   - NO inventes un número ni una causal ficticia.
   - Orienta a elevar la consulta a la Mesa de Calidad PQR o radicar solicitud de actualización de catálogo en Administración.
5. Brinda el procedimiento paso a paso, causales exactas, área responsable y requisitos documentales exactos según el perfil del promotor.
`;

    if (ai) {
      try {
        const contents = [
          ...params.historial.map(h => ({
            role: h.rol === 'user' ? 'user' : 'model',
            parts: [{ text: h.texto }]
          })),
          {
            role: 'user',
            parts: [{ text: params.mensajeActual }]
          }
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: contents as any,
          config: {
            systemInstruction: systemPrompt,
          }
        });

        const reply = response.text || 'Sin respuesta del modelo.';
        
        // Extraer códigos APY identificados en la respuesta
        const matchedApy = bankDb.apyCodes.filter(c => 
          reply.includes(c.codigo) || params.mensajeActual.includes(c.codigo)
        );

        return {
          respuesta: reply,
          codigosApyMencionados: matchedApy,
          areaResponsableRecomendada: matchedApy[0]?.areaResponsable,
          procedimientoOficial: matchedApy[0]?.requisitos,
          requisitosDocumentales: matchedApy[0]?.requisitos,
        };
      } catch (err) {
        console.warn('Gemini Promoter chat fallback:', err);
      }
    }

    // Fallback determinístico preciso buscando códigos en el mensaje
    const currentLower = params.mensajeActual.toLowerCase();
    const matched = bankDb.apyCodes.filter(c => 
      currentLower.includes(c.codigo) || 
      currentLower.includes(c.nombre.toLowerCase()) ||
      c.causales.some(cau => currentLower.includes(cau.toLowerCase().substring(0, 15)))
    );

    if (matched.length > 0) {
      const top = matched[0];
      const reply = `Para tu perfil de **${params.perfilPromotor}**, la consulta coincide con el **Código APY ${top.codigo} - ${top.nombre}**:\n\n` +
        `• **Área Responsable:** ${top.areaResponsable}\n` +
        `• **SLA Institucional:** ${top.slaHoras} horas (${top.slaDiasHabiles} días hábiles)\n` +
        `• **Causales Oficiales Aprobadas:**\n${top.causales.map(c => `  - ${c}`).join('\n')}\n\n` +
        `• **Requisitos y Procedimiento Obligatorio:**\n${top.requisitos.map(r => `  - ${r}`).join('\n')}\n\n` +
        `Recuerda que no se deben radicar códigos fuera del catálogo oficial sin previa aprobación de la Mesa de Calidad PQR.`;

      return {
        respuesta: reply,
        codigosApyMencionados: matched,
        areaResponsableRecomendada: top.areaResponsable,
        procedimientoOficial: top.requisitos,
        requisitosDocumentales: top.requisitos
      };
    }

    return {
      respuesta: `Atención **${params.perfilPromotor}**: No se encontró un código APY coincidente directo en el catálogo oficial para tu consulta. Los códigos aprobados activos son:\n` +
        bankDb.apyCodes.map(c => `• **APY ${c.codigo}**: ${c.nombre} (${c.areaResponsable})`).join('\n') +
        `\n\nPor favor especifica si la operación corresponde a cancelación de tarjeta (807), fraude (627), devolución de FGA (267), error en canales o PSE (779), cambio de tasa/cuotas (638), cuota de manejo (312), seguros (445), pagos (510) o 4x1000 (198). Recuerda que no está autorizado inventar códigos en las radicaciones.`,
      codigosApyMencionados: []
    };
  }

  /**
   * Módulo 3: Lector Masivo PQR
   * Clasifica con validación cruzada: Motor de Reglas Críticas + Validación Semántica Gemini
   */
  public static async classifyPQRRecord(record: PQRInputRecord): Promise<ClassificationResult> {
    // 1. Ejecutar primero el motor determinístico de reglas bancarias obligatorias
    const deterministic = BankRulesEngine.evaluateRecord(record);

    // Si una regla crítica de alto impacto fue activada (e.g. sin embargo, cuota crédito vs manejo, GMF, PSE, FGA, cancelación)
    // respetamos el resultado del motor con máxima rigurosidad y lo retornamos inmediatamente para garantizar cero alucinación.
    if (deterministic.confianza >= 95 || deterministic.alertasReglas.length > 0) {
      return deterministic;
    }

    // Para casos ambiguos donde no se activó regla crítica determinística, usar Gemini con schema estricto
    const ai = getGenAI();
    if (ai) {
      try {
        const prompt = `
Analiza este expediente PQR de una entidad bancaria y clasifícalo conforme al catálogo cerrado y las reglas de negocio de la Superintendencia Financiera.

DATOS DEL EXPEDIENTE:
- Resumen del Cliente: "${record.resumenCliente || ''}"
- Subcategoría Inicial (Legacy): "${record.subcategoriaInicial || ''}"
- Descripción Detallada: "${record.descripcionDetallada || ''}"

REGLAS CRÍTICAS INELUDIBLES:
1. Prioriza la Descripción Detallada sobre el resumen o la subcategoría existente.
2. NO confundir cuotas de créditos con cuotas de manejo.
3. NO clasificar como CDT solamente porque mencione una cuenta de ahorros o corriente.
4. NO confundir la expresión "sin embargo" con un embargo judicial.
5. Códigos APY autorizados: 807 (Cancelación tarjeta), 627 (Fraude), 267 (Devolución FGA), 779 (Error canales), 638 (Cambio de tasa o cuotas), 312 (Cuota de manejo), 445 (Seguros), 510 (Aplicación de pago), 198 (GMF).
6. NO uses "OTRAS" o "REVISIÓN HUMANA" como salida predeterminada, a menos que exista contradicción insalvable o información insuficiente verificable.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'Eres el motor de clasificación PQR oficial de la entidad financiera. Devuelve JSON estructurado estricto.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                categoriaNormalizada: { type: Type.STRING },
                intencionReal: { type: Type.STRING },
                codigoApySugerido: { type: Type.STRING },
                areaResponsable: { type: Type.STRING },
                reglaAplicada: { type: Type.STRING },
                confianza: { type: Type.NUMBER },
                requiereRevisionHumana: { type: Type.BOOLEAN },
                justificacionTecnica: { type: Type.STRING },
                criterioSuperfinanciera: { type: Type.STRING },
                procedimientoSugerido: { type: Type.STRING },
              },
              required: [
                'categoriaNormalizada',
                'intencionReal',
                'codigoApySugerido',
                'areaResponsable',
                'reglaAplicada',
                'confianza',
                'requiereRevisionHumana',
                'justificacionTecnica'
              ]
            }
          }
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          // Validar que el código APY exista en el catálogo del banco
          const validApy = bankDb.apyCodes.some(c => c.codigo === parsed.codigoApySugerido);
          const finalApy = validApy ? parsed.codigoApySugerido : deterministic.codigoApySugerido;

          return {
            categoriaNormalizada: parsed.categoriaNormalizada || deterministic.categoriaNormalizada,
            intencionReal: parsed.intencionReal || deterministic.intencionReal,
            codigoApySugerido: finalApy,
            areaResponsable: parsed.areaResponsable || deterministic.areaResponsable,
            reglaAplicada: parsed.reglaAplicada || 'Análisis Semántico con Supervisión de Reglas',
            confianza: typeof parsed.confianza === 'number' ? Math.min(100, Math.max(0, parsed.confianza)) : 88,
            requiereRevisionHumana: parsed.requiereRevisionHumana ?? false,
            justificacionTecnica: parsed.justificacionTecnica || deterministic.justificacionTecnica,
            alertasReglas: deterministic.alertasReglas,
            tiempoEstimadoSla: deterministic.tiempoEstimadoSla,
            criterioSuperfinanciera: parsed.criterioSuperfinanciera || deterministic.criterioSuperfinanciera,
            causalesAprobadas: deterministic.causalesAprobadas,
            procedimientoSugerido: parsed.procedimientoSugerido || deterministic.procedimientoSugerido
          };
        }
      } catch (e) {
        console.warn('Gemini batch classification single fallback:', e);
      }
    }

    return deterministic;
  }
}
