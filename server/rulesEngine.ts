/**
 * Motor de Reglas Determinísticas y Validación Institucional Bancaria
 * Aplica con estricta prioridad las reglas críticas de negocio.
 */

import { bankDb } from './db.js';

export interface ClassificationResult {
  categoriaNormalizada: string;
  intencionReal: string;
  codigoApySugerido: string;
  areaResponsable: string;
  reglaAplicada: string;
  confianza: number; // 0 a 100
  requiereRevisionHumana: boolean;
  justificacionTecnica: string;
  alertasReglas: string[];
  tiempoEstimadoSla: string;
  criterioSuperfinanciera: string;
  causalesAprobadas: string[];
  procedimientoSugerido: string;
}

export interface PQRInputRecord {
  id: string | number;
  resumenCliente?: string;
  subcategoriaInicial?: string;
  descripcionDetallada: string;
  montoReclamado?: number | string;
  canal?: string;
  fechaRadicacion?: string;
  [key: string]: any;
}

export class BankRulesEngine {
  /**
   * Evalúa y clasifica un expediente con base en reglas de negocio bancarias y análisis semántico determinístico.
   */
  public static evaluateRecord(record: PQRInputRecord): ClassificationResult {
    const rawDescription = (record.descripcionDetallada || '').trim();
    const rawSummary = (record.resumenCliente || '').trim();
    const rawLegacyCategory = (record.subcategoriaInicial || '').trim();

    // Regla de Oro: Prioridad absoluta a la descripción detallada
    const textToAnalyze = rawDescription.length >= 10 ? rawDescription : rawSummary;
    const lower = textToAnalyze.toLowerCase();
    const alerts: string[] = [];

    // Validar caso de texto insuficiente o no informativo
    if (!textToAnalyze || textToAnalyze.length < 15) {
      return {
        categoriaNormalizada: 'REVISIÓN HUMANA',
        intencionReal: 'Información insuficiente en el expediente',
        codigoApySugerido: 'REVISIÓN_MANUAL',
        areaResponsable: 'Mesa de Calidad PQR',
        reglaAplicada: 'Regla de Validación Mínima: Texto Insuficiente (<15 caracteres)',
        confianza: 15,
        requiereRevisionHumana: true,
        justificacionTecnica: 'La descripción provista no contiene detalles mínimos para tipificar la reclamación con base en criterios institucionales.',
        alertasReglas: ['ALERTA_INFORMACION_INSUFICIENTE'],
        tiempoEstimadoSla: '48 horas hábiles para solicitud de aclaración al cliente',
        criterioSuperfinanciera: 'Circular Básica Jurídica: Derecho a solicitar ampliación de información cuando la queja es ininteligible.',
        causalesAprobadas: ['Expediente incompleto o descripción no concluyente'],
        procedimientoSugerido: 'Contactar al cliente para solicitar hechos claros, fechas y montos en controversia.'
      };
    }

    // =========================================================================
    // REGLA CRÍTICA 1: CONECTOR "SIN EMBARGO" VS EMBARGO JUDICIAL
    // =========================================================================
    const hasSinEmbargo = /\bsin\s+embargo\b/i.test(lower);
    const hasRealJudicialEmbargo = /\b(juzgado|oficio\s+(de\s+)?embargo|medida\s+cautelar|decreto\s+(de\s+)?embargo|coactiva\s+(dian|alcaldia|fiscalia)|desembargo\s+judicial)\b/i.test(lower);

    if (hasSinEmbargo && !hasRealJudicialEmbargo) {
      alerts.push('REGLA_CRITICA_ACTIVADA: Se detectó el conector lingüístico adversativo "sin embargo". Se anula categóricamente cualquier intento de clasificar como Embargo Judicial.');
    }

    // =========================================================================
    // REGLA CRÍTICA 2: CUOTA DE CRÉDITO VS CUOTA DE MANEJO
    // =========================================================================
    const isCreditAmortizationPayment = /\b(cuota\s+del?\s+(credito|prestamo|libranza|hipotecario|vehicular)|valor\s+de\s+la\s+cuota\s+(mensual|subio)|pague\s+la\s+cuota\s+del?\s+prestamo|pago\s+de\s+cuota\s+de\s+cartera)\b/i.test(lower);
    if (isCreditAmortizationPayment) {
      alerts.push('REGLA_CRITICA_ACTIVADA: La cuota reclamada pertenece a amortización de préstamo/crédito. PROHIBIDO clasificar como Cuota de Manejo.');
    }

    // =========================================================================
    // REGLA CRÍTICA 3: CUENTA INCIDENTAL NO ES CDT
    // =========================================================================
    const mentionsAccount = /\b(cuenta\s+(de\s+ahorros|corriente)|mi\s+cuenta)\b/i.test(lower);
    const hasExplicitCDT = /\b(cdt|certificado\s+de\s+deposito(\s+a\s+termino)?|titulo\s+valor\s+cdt|redencion\s+de\s+cdt|plazo\s+fijo)\b/i.test(lower);
    if (mentionsAccount && !hasExplicitCDT && /cdt/i.test(rawLegacyCategory)) {
      alerts.push('REGLA_CRITICA_ACTIVADA: Se detectó mención incidental de cuenta en expediente originalmente marcado como CDT. Se anula clasificación de CDT.');
    }

    // =========================================================================
    // CLASIFICACIÓN ESPECÍFICA POR INTENCIÓN REAL
    // =========================================================================

    // 1. GMF (Gravamen a los Movimientos Financieros / 4x1000)
    if (/\b(4x1000|cuatro\s+por\s+mil|gmf|gravamen(\s+a\s+los)?\s+movimientos\s+financieros|cuenta\s+exenta\s+(del\s+)?(4x1000|cuatro\s+por\s+mil))\b/i.test(lower)) {
      const apy = bankDb.apyCodes.find(a => a.codigo === '198') || bankDb.apyCodes[0];
      return {
        categoriaNormalizada: 'GMF (4x1000)',
        intencionReal: 'Reclamación por cobro de Gravamen a los Movimientos Financieros o solicitud de marcación de cuenta exenta',
        codigoApySugerido: '198',
        areaResponsable: apy.areaResponsable,
        reglaAplicada: 'Regla Específica de Marcación GMF 4x1000 (Estatuto Tributario Art. 879)',
        confianza: 98,
        requiereRevisionHumana: false,
        justificacionTecnica: 'El cliente objeta expresamente débitos por concepto de 4x1000 / GMF en su cuenta bancaria. Aplica verificación de estado de cuenta exenta en sistema CIFIN/SFC.',
        alertasReglas: alerts,
        tiempoEstimadoSla: `${apy.slaHoras} horas (${apy.slaDiasHabiles} días hábiles)`,
        criterioSuperfinanciera: 'Estatuto Tributario Art. 879 y Circular Externa SFC sobre cuentas de ahorro de bajo monto y cuentas únicas exentas.',
        causalesAprobadas: apy.causales,
        procedimientoSugerido: 'Validar registro en la plataforma de exención tributaria y solicitar extractos para reliquidación si hubo cobro indebido.'
      };
    }

    // 2. DEVOLUCIÓN DE FGA (Fondo de Garantías)
    if (/\b(fga|fondo\s+de\s+garantias|comision\s+de\s+fianza|devolucion\s+(de\s+)?fga|reintegro\s+(de\s+)?garantia)\b/i.test(lower)) {
      const apy = bankDb.apyCodes.find(a => a.codigo === '267')!;
      return {
        categoriaNormalizada: 'Devolución de FGA',
        intencionReal: 'Solicitud de reintegro o liquidación proporcional de fianza FGA por prepago o reliquidación de crédito',
        codigoApySugerido: '267',
        areaResponsable: apy.areaResponsable,
        reglaAplicada: 'Regla Institucional FGA: Devolución por Pago Anticipado o Cobro Erróneo de Garantía',
        confianza: 97,
        requiereRevisionHumana: false,
        justificacionTecnica: 'El usuario solicita la devolución de la fianza del Fondo de Garantías cobrada en su crédito, respaldado en la cancelación anticipada de la obligación.',
        alertasReglas: alerts,
        tiempoEstimadoSla: `${apy.slaHoras} horas (${apy.slaDiasHabiles} días hábiles)`,
        criterioSuperfinanciera: 'Régimen de prepago de obligaciones financieras (Ley 1555 de 2012) y comisiones de garantías admisibles.',
        causalesAprobadas: apy.causales,
        procedimientoSugerido: 'Verificar paz y salvo del crédito, certificar fecha exacta de cancelación anticipada y calcular saldo no causado con FGA.'
      };
    }

    // 3. PSE / FALLAS EN TRANSACCIONES ELECTRÓNICAS
    if (/\b(pse|boton\s+pse|codigo\s+cus|pasarela\s+pse|transaccion\s+en\s+linea\s+fallida|debito\s+sin\s+confirmacion\s+en\s+comercio)\b/i.test(lower)) {
      const apy = bankDb.apyCodes.find(a => a.codigo === '779')!;
      return {
        categoriaNormalizada: 'PSE',
        intencionReal: 'Fallo transaccional en pasarela PSE: débito aplicado en cuenta sin acreditación o aprobación en el comercio de destino',
        codigoApySugerido: '779',
        areaResponsable: apy.areaResponsable,
        reglaAplicada: 'Regla Específica para Fallas en Pasarela PSE y Compensación ACH',
        confianza: 96,
        requiereRevisionHumana: false,
        justificacionTecnica: 'La reclamación se origina por una transacción mediante botón PSE que descontó el saldo de la cuenta bancaria sin generar el ticket de compra satisfactorio en la tienda receptora.',
        alertasReglas: alerts,
        tiempoEstimadoSla: `${apy.slaHoras} horas (${apy.slaDiasHabiles} días hábiles)`,
        criterioSuperfinanciera: 'Reglamento del sistema de transferencias interbancarias y plazos máximos de compensación en línea.',
        causalesAprobadas: apy.causales,
        procedimientoSugerido: 'Rastrear número de ciclo ACH y código CUS para solicitar la devolución automática o confirmación bilateral con la pasarela.'
      };
    }

    // 4. CANCELACIÓN DE TARJETA DE CRÉDITO
    if (/\b(cancelar|cancelacion|cancelada|cancelado|dar\s+de\s+baja|terminar\s+contrato)\b.*\btarjeta\b|\btarjeta\b.*\b(cancelar|cancelacion|cancelada|cancelado|dar\s+de\s+baja|terminacion)\b/i.test(lower)) {
      const apy = bankDb.apyCodes.find(a => a.codigo === '807')!;
      return {
        categoriaNormalizada: 'Cancelación de tarjeta',
        intencionReal: 'Petición expresa de terminación de contrato y cancelación definitiva de tarjeta de crédito',
        codigoApySugerido: '807',
        areaResponsable: apy.areaResponsable,
        reglaAplicada: 'Regla APY 807: Cancelación Formal de Tarjeta de Crédito sin Dilataciones Indebidas',
        confianza: 98,
        requiereRevisionHumana: false,
        justificacionTecnica: 'El cliente manifiesta de forma inequívoca su voluntad de rescindir el contrato de tarjeta de crédito. La entidad no puede condicionar la radicación a ofertas forzosas de retención.',
        alertasReglas: alerts,
        tiempoEstimadoSla: `${apy.slaHoras} horas (${apy.slaDiasHabiles} días hábiles)`,
        criterioSuperfinanciera: 'Estatuto Orgánico del Sistema Financiero: Libertad contractual del consumidor para cancelar productos financieros en cualquier momento.',
        causalesAprobadas: apy.causales,
        procedimientoSugerido: 'Validar saldo en ceros ($0), generar liquidación al día y emitir certificación de cancelación formal.'
      };
    }

    // 5. CAMBIO DE TASA O CUOTAS EN TARJETA DE CRÉDITO / REDIFERIDO
    if (/\b(rediferi(r|do)|cambio\s+de\s+(tasa|cuota|plazo)|ampliacion\s+de\s+cuotas|tasa\s+de\s+interes\s+de\s+tarjeta|diferir\s+a\s+\d+\s+cuotas|reestructuracion\s+de\s+tarjeta)\b/i.test(lower)) {
      const apy = bankDb.apyCodes.find(a => a.codigo === '638')!;
      return {
        categoriaNormalizada: 'Cambio de cuotas',
        intencionReal: 'Ajuste, reliquidación o reconsideración del número de cuotas, rediferido o tasa pactada en tarjeta de crédito',
        codigoApySugerido: '638',
        areaResponsable: apy.areaResponsable,
        reglaAplicada: 'Regla APY 638: Gestión de Cuotas y Tasa de Interés en Tarjetas',
        confianza: 94,
        requiereRevisionHumana: false,
        justificacionTecnica: 'El reclamo versa sobre el plan de amortización o la tasa liquidada sobre los consumos diferidos de la tarjeta de crédito del titular.',
        alertasReglas: alerts,
        tiempoEstimadoSla: `${apy.slaHoras} horas (${apy.slaDiasHabiles} días hábiles)`,
        criterioSuperfinanciera: 'Circular Básica Contable y Financiera: Parámetros de modificación de condiciones de créditos y tarjetas.',
        causalesAprobadas: apy.causales,
        procedimientoSugerido: 'Revisar plan de amortización, verificar si hubo rediferido unilateral de oficio y consultar parámetros de la campaña vigente.'
      };
    }

    // 6. FRAUDE Y COMPRAS NO RECONOCIDAS
    if (/\b(fraude|clonacion|suplantacion|hackeo|transaccion(es)?\s+no\s+(reconocida|autorizada)s?|consumo(s)?\s+no\s+(reconocido|autorizado)s?|compras?\s+no\s+reconocidas?|yo\s+no\s+hice\s+esa\s+compra|cargos?\s+desconocidos?|(jamás|jamas|no)\s+(las?\s+)?(autoricé|autorice|hice|reconozco|realicé|realice)|compras\s+en\s+dolares|tiendas\s+de\s+[a-z]+|compras\s+internacionales)\b/i.test(lower)) {
      const apy = bankDb.apyCodes.find(a => a.codigo === '627')!;
      const isCardPurchase = /\b(compra|consumo|datáfono|datafono|tienda|comercio|pos|e-commerce|internet)\b/i.test(lower);
      const cat = isCardPurchase ? 'Compras no reconocidas' : 'Fraude';
      return {
        categoriaNormalizada: cat,
        intencionReal: 'Desconocimiento formal de transacciones monetarias no efectuadas ni consentidas por el titular',
        codigoApySugerido: '627',
        areaResponsable: apy.areaResponsable,
        reglaAplicada: 'Regla APY 627: Fraude sin Suplantación y Transacciones No Reconocidas',
        confianza: 96,
        requiereRevisionHumana: false,
        justificacionTecnica: 'El cliente denuncia cargos monetarios que no reconoce, manteniendo custodia física de sus instrumentos de pago o alegando vulneración de seguridad.',
        alertasReglas: alerts,
        tiempoEstimadoSla: `${apy.slaHoras} horas (${apy.slaDiasHabiles} días hábiles)`,
        criterioSuperfinanciera: 'Circular Externa 029 de 2014 (Capítulo I, Título II): Deber de seguridad y estándares de autenticación reforzada.',
        causalesAprobadas: apy.causales,
        procedimientoSugerido: 'Proceder con el bloqueo preventivo del instrumento, remitir formato de carta juramentada y activar cerco de seguridad bancaria.'
      };
    }

    // 7. SEGUROS Y BCOLOMBIA/BANCASEGUROS
    if (/\b(seguro|poliza|prima|seguro\s+de\s+vida|seguro\s+voluntario|cardif|seguro\s+de\s+desempleo|seguro\s+contra\s+fraude|cobro\s+de\s+seguro)\b/i.test(lower)) {
      const apy = bankDb.apyCodes.find(a => a.codigo === '445') || bankDb.apyCodes[1];
      return {
        categoriaNormalizada: 'Seguros',
        intencionReal: 'Objeción, solicitud de revocatoria o reintegro de primas por cobro de seguros vinculados a productos bancarios',
        codigoApySugerido: '445',
        areaResponsable: apy.areaResponsable,
        reglaAplicada: 'Regla APY 445: Objeción y Devolución de Pólizas y Seguros Bancarios',
        confianza: 95,
        requiereRevisionHumana: false,
        justificacionTecnica: 'El usuario reclama por cobros periódicos de primas de seguros voluntarios o asociados a sus productos financieros sin consentimiento comprobado.',
        alertasReglas: alerts,
        tiempoEstimadoSla: `${apy.slaHoras} horas (${apy.slaDiasHabiles} días hábiles)`,
        criterioSuperfinanciera: 'Estatuto Orgánico del Sistema Financiero: Prohibición de ventas atadas y exigencia de prueba del consentimiento expreso.',
        causalesAprobadas: apy.causales,
        procedimientoSugerido: 'Auditar la grabación de venta telefónica o soporte digital de adhesión; tramitar cancelación inmediata y reintegro retroactivo si no hay soporte.'
      };
    }

    // 8. CUOTA DE MANEJO (SÓLO SI NO ES CUOTA DE CRÉDITO)
    if (!isCreditAmortizationPayment && /\b(cuota\s+de\s+manejo|cobro\s+de\s+manejo|comision\s+de\s+administracion|tarifa\s+de\s+manejo|exoneracion\s+de\s+manejo)\b/i.test(lower)) {
      const apy = bankDb.apyCodes.find(a => a.codigo === '312') || bankDb.apyCodes[0];
      return {
        categoriaNormalizada: 'Cuota de manejo',
        intencionReal: 'Inconformidad o solicitud de exoneración / reintegro de cuota de manejo en tarjeta o cuenta bancaria',
        codigoApySugerido: '312',
        areaResponsable: apy.areaResponsable,
        reglaAplicada: 'Regla de Diferenciación Estricta: Cobro de Cuota de Manejo Institucional',
        confianza: 96,
        requiereRevisionHumana: false,
        justificacionTecnica: 'El reclamo corresponde a la tarifa fija de administración de tarjeta de crédito o cuenta de ahorros, verificando convenios o campañas de exoneración.',
        alertasReglas: alerts,
        tiempoEstimadoSla: `${apy.slaHoras} horas (${apy.slaDiasHabiles} días hábiles)`,
        criterioSuperfinanciera: 'Ley 2009 de 2019: Transparencia tarifaria y gratuidad en paquetes de servicios bancarios.',
        causalesAprobadas: apy.causales,
        procedimientoSugerido: 'Comprobar si el producto cuenta con convenio de nómina, portafolio preferencial o exoneración temporal por campaña.'
      };
    }

    // 9. APLICACIÓN DE PAGO (INCLUYE CUOTA DE PRÉSTAMO / CRÉDITO Y ABONOS MAL REFLEJADOS)
    if (isCreditAmortizationPayment || /\b(pago\s+no\s+(se\s+)?refleja|abono\s+a\s+capital|aplicacion\s+de\s+pago|pague\s+y\s+sigue\s+en\s+mora|comprobante\s+de\s+pago|descuento\s+no\s+acreditado|intereses\s+de\s+mora\s+injustificados)\b/i.test(lower)) {
      const apy = bankDb.apyCodes.find(a => a.codigo === '510') || bankDb.apyCodes[0];
      return {
        categoriaNormalizada: 'Aplicación de pago',
        intencionReal: 'Inconformidad con la aplicación contable, imputación de abono a capital o valor de la cuota de la obligación crediticia',
        codigoApySugerido: '510',
        areaResponsable: apy.areaResponsable,
        reglaAplicada: isCreditAmortizationPayment 
          ? 'Regla de Oro: Reclasificación de Cuota de Amortización de Crédito a Aplicación de Pago' 
          : 'Regla APY 510: Conciliación Contable y Aplicación de Pagos',
        confianza: 95,
        requiereRevisionHumana: false,
        justificacionTecnica: 'El usuario expone un desfase en la acreditación de su pago o discordancia en la liquidación de la cuota de su crédito ordinario, exigiendo corrección del estado de cuenta.',
        alertasReglas: alerts,
        tiempoEstimadoSla: `${apy.slaHoras} horas (${apy.slaDiasHabiles} días hábiles)`,
        criterioSuperfinanciera: 'Código Civil Art. 1653: Derecho de imputación de pagos prioritario a intereses exigibles y capital.',
        causalesAprobadas: apy.causales,
        procedimientoSugerido: 'Revisar extracto contable del recaudo, confrontar contra fecha valor del comprobante aportado y recalcular intereses si hubo mora atribuible al banco.'
      };
    }

    // 10. ERROR EN CANALES ELECTRÓNICOS (CAJEROS / APP / WEB)
    if (/\b(cajero(\s+automatico)?|atm|no\s+entrego\s+el\s+dinero|plata\s+no\s+salio|debito\s+en\s+cajero|app\s+bloqueada|error\s+en\s+la\s+aplicacion|transferencia\s+fallida)\b/i.test(lower)) {
      const apy = bankDb.apyCodes.find(a => a.codigo === '779')!;
      return {
        categoriaNormalizada: 'Error en canales',
        intencionReal: 'Incidencia operativa o fallo transaccional en cajero automático (ATM), App móvil o canal electrónico',
        codigoApySugerido: '779',
        areaResponsable: apy.areaResponsable,
        reglaAplicada: 'Regla APY 779: Error en Canales Electrónicos y Dispensación',
        confianza: 94,
        requiereRevisionHumana: false,
        justificacionTecnica: 'Fallo operativo en la provisión de efectivo o en la ejecución tecnológica de una operación iniciada a través de un canal digital de la entidad.',
        alertasReglas: alerts,
        tiempoEstimadoSla: `${apy.slaHoras} horas (${apy.slaDiasHabiles} días hábiles)`,
        criterioSuperfinanciera: 'Circular Básica Jurídica SFC: Estándares de continuidad operativa y conciliación de saldos en cajeros automáticos.',
        causalesAprobadas: apy.causales,
        procedimientoSugerido: 'Solicitar cuadre contable y arqueo de la gaveta del cajero automático involucrado para acreditar el faltante.'
      };
    }

    // 11. CDT REAL (SÓLO SI EXISTE MENCIÓN EXPLÍCITA DE CDT/INVERSIÓN A PLAZO)
    if (hasExplicitCDT) {
      return {
        categoriaNormalizada: 'CDT e Inversiones',
        intencionReal: 'Reclamación relacionada con Certificado de Depósito a Término (CDT), rendimientos o redención de título valor',
        codigoApySugerido: '779',
        areaResponsable: 'Operaciones de Captación y Tesorería',
        reglaAplicada: 'Regla Específica CDT: Verificación de Título Valor de Captación',
        confianza: 92,
        requiereRevisionHumana: false,
        justificacionTecnica: 'El caso refiere de manera fehaciente a un contrato de captación mediante Certificado de Depósito a Término.',
        alertasReglas: alerts,
        tiempoEstimadoSla: '48 horas hábiles',
        criterioSuperfinanciera: 'Estatuto Orgánico del Sistema Financiero: Normativa sobre captación de recursos a término.',
        causalesAprobadas: ['Tasa de interés pactada vs liquidada', 'Renovación automática objetada', 'Retención indebida al vencimiento'],
        procedimientoSugerido: 'Verificar condiciones de emisión del certificado y registro en el sistema central de depósitos.'
      };
    }

    // 12. EMBARGO JUDICIAL REAL (SÓLO SI HAY ORDEN/JUZGADO COMPROBABLE)
    if (hasRealJudicialEmbargo) {
      return {
        categoriaNormalizada: 'Embargos Judiciales',
        intencionReal: 'Trámite o reclamación por aplicación de medida cautelar de embargo decretada por autoridad judicial o administrativa',
        codigoApySugerido: '779',
        areaResponsable: 'Gerencia Jurídica / Medidas Cautelares',
        reglaAplicada: 'Regla Jurídica: Procesamiento de Embargo con Mandamiento Judicial Verificable',
        confianza: 95,
        requiereRevisionHumana: false,
        justificacionTecnica: 'El expediente incluye mención de radicación de juzgado, oficio formal de embargo o proceso coactivo.',
        alertasReglas: alerts,
        tiempoEstimadoSla: '24 horas hábiles (prioridad legal)',
        criterioSuperfinanciera: 'Código General del Proceso Art. 593 y Ley 100 de 1993 sobre límites de inembargabilidad de cuentas de ahorro y nómina.',
        causalesAprobadas: ['Desembargo no tramitado', 'Embargo sobre monto protegido inembargable', 'Doble retención judicial'],
        procedimientoSugerido: 'Remitir de inmediato a la Dirección Jurídica para validar oficio de desembargo y verificar tope legal de inembargabilidad.'
      };
    }

    // Si ninguna regla determinística previa tipifica con certeza alta, evaluar con criterio explícito y fundamentado
    return {
      categoriaNormalizada: 'REVISIÓN HUMANA',
      intencionReal: 'Caso atípico o multifactorial que requiere evaluación cualitativa especializada',
      codigoApySugerido: 'REVISIÓN_MANUAL',
      areaResponsable: 'Gerencia de Soluciones Especiales',
      reglaAplicada: 'Criterio de Exclusión: No clasificar como OTRAS sin justificación explícita documentada',
      confianza: 48,
      requiereRevisionHumana: true,
      justificacionTecnica: 'El expediente describe una situación que combina múltiples elementos o términos contractuales no tipificados en el catálogo estándar cerrado. Se asigna a analista senior para evitar tipificación inexacta.',
      alertasReglas: [...alerts, 'ALERTA_CRITERIO_REVISION_HUMANA_REQUERIDA'],
      tiempoEstimadoSla: '24 horas para asignación a analista senior',
      criterioSuperfinanciera: 'Deber de debida diligencia en el trámite de solicitudes atípicas de los consumidores financieros.',
      causalesAprobadas: ['Reclamación multicausal', 'Conflicto contractual no contemplado en catálogo estándar'],
      procedimientoSugerido: 'Realizar escucha de llamadas previas o contactar al canal de radicación para precisar los hechos controvertidos.'
    };
  }
}
