/**
 * Base de datos institucional y catálogo maestro
 * Plataforma Inteligente de Gestión PQR y Radicaciones Bancarias
 */

export interface APYCode {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  causales: string[];
  areaResponsable: string;
  slaHoras: number;
  slaDiasHabiles: number;
  requisitos: string[];
  activo: boolean;
  version: number;
  estadoAprobacion: 'APROBADO' | 'PENDIENTE_APROBACION';
}

export interface PQRCategory {
  id: string;
  nombre: string;
  codigoIdentificador: string;
  descripcion: string;
  codigoApyDefault: string;
  areaDefault: string;
  palabrasClave: string[];
  reglasExclusion: string[];
  criterioSuperfinanciera: string;
  activa: boolean;
}

export interface BusinessRule {
  id: string;
  nombre: string;
  descripcion: string;
  categoriaAfectada: string;
  patronDeteccion: string;
  accion: 'EXCLUIR' | 'REASIGNAR' | 'EXIGIR_REVISION' | 'FORZAR_CATEGORIA';
  categoriaDestino?: string;
  codigoApySugerido?: string;
  activa: boolean;
  version: number;
  justificacionNormativa: string;
}

export interface GoldenTestCase {
  id: string;
  titulo: string;
  descripcionDetallada: string;
  subcategoriaInicialErronea?: string;
  categoriaEsperada: string;
  codigoApyEsperado: string;
  reglaVerificada: string;
  justificacion: string;
  casoTipo: 'CRITICO_SIN_EMBARGO' | 'CRITICO_CUOTA_CREDITO_VS_MANEJO' | 'CRITICO_NO_CDT_POR_MENCION_CUENTA' | 'GMF' | 'PSE' | 'FRAUDE_SIN_SUPLANTACION';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  usuario: string;
  rol: string;
  accion: string;
  entidad: string;
  detalle: string;
  metadata?: any;
}

export interface UserRole {
  id: string;
  nombre: string;
  email: string;
  rol: 'ADMIN_CALIDAD' | 'PROMOTOR_N1' | 'PROMOTOR_N2' | 'ASESOR_COMERCIAL' | 'AUDITOR';
  cargo: string;
  permisos: string[];
}

export interface RuleVersion {
  id: string;
  fecha: string;
  usuario: string;
  version: number;
  cambios: string;
}

class BankDataStore {
  public apyCodes: APYCode[] = [
    {
      id: 'apy-807',
      codigo: '807',
      nombre: 'Cancelación de Tarjeta de Crédito',
      descripcion: 'Procedimiento formal de cancelación y bloqueo definitivo de tarjeta de crédito a solicitud del cliente o causales operativas.',
      causales: [
        'Voluntaria del cliente por insatisfacción de producto o costos',
        'Retención preventiva no aceptada por el cliente',
        'Inactividad prolongada con saldo en cero',
        'Fallecimiento del titular (con certificado de defunción)',
        'Sustitución por upgrade de producto'
      ],
      areaResponsable: 'Operaciones Tarjetas / Soluciones',
      slaHoras: 48,
      slaDiasHabiles: 2,
      requisitos: [
        'Saldo total en $0 (sin consumos diferidos pendientes ni cargos flotantes)',
        'Validación de titularidad mediante autenticación biométrica o doble factor',
        'Paz y salvo generado o certificación de cancelación de cobros automáticos',
        'Tarjeta desvinculada de pasarelas de pago recurrentes'
      ],
      activo: true,
      version: 3,
      estadoAprobacion: 'APROBADO'
    },
    {
      id: 'apy-627',
      codigo: '627',
      nombre: 'Fraude sin Suplantación',
      descripcion: 'Investigación y radicación de operaciones no autorizadas realizadas con el producto del titular sin que haya existido pérdida total de identidad.',
      causales: [
        'Transacción no presencial en e-commerce sin entrega voluntaria de OTP',
        'Clonación o copiado de banda/chip en cajero automático o datáfono alterado',
        'Phishing o malware sin consentimiento del cliente',
        'Débito no reconocido con tarjeta física aún en custodia del cliente'
      ],
      areaResponsable: 'Seguridad Bancaria / Prevención de Fraude',
      slaHoras: 72,
      slaDiasHabiles: 5,
      requisitos: [
        'Bloqueo preventivo inmediato del plástico o credencial digital',
        'Diligenciamiento de carta juramentada de no reconocimiento de transacción',
        'Relación detallada de consumos no reconocidos (fecha, valor, comercio)',
        'Verificación de bitácora de envío de OTP y geolocalización IP'
      ],
      activo: true,
      version: 4,
      estadoAprobacion: 'APROBADO'
    },
    {
      id: 'apy-267',
      codigo: '267',
      nombre: 'Devolución de FGA (Fondo de Garantías)',
      descripcion: 'Gestión de reintegro o liquidación proporcional de comisiones del Fondo de Garantías cobradas en operaciones de crédito.',
      causales: [
        'Cobro improcedente por pago anticipado total del crédito antes del plazo pactado',
        'Error en el cálculo de la tarifa FGA en la originación del crédito',
        'Refinanciación o novación de obligación donde no se descontó el remanente no causado',
        'Doble cobro de fianza o garantía institucional'
      ],
      areaResponsable: 'Créditos y Cartera / Gestión FGA',
      slaHoras: 96,
      slaDiasHabiles: 7,
      requisitos: [
        'Comprobante de pago total o certificación de liquidación anticipada',
        'Número de pagaré o libranza asociado al crédito',
        'Extracto de cancelación y paz y salvo del crédito',
        'Certificación bancaria de la cuenta del titular para abono del reintegro'
      ],
      activo: true,
      version: 2,
      estadoAprobacion: 'APROBADO'
    },
    {
      id: 'apy-779',
      codigo: '779',
      nombre: 'Error en Canales Electrónicos',
      descripcion: 'Reclamaciones por incidentes técnicos, débitos no correspondidos o transacciones fallidas en cajeros automáticos, App móvil, Web o pasarelas PSE.',
      causales: [
        'Débito en cuenta de ahorros/corriente sin dispensación de efectivo en cajero',
        'Transacción PSE debitada de la cuenta pero con estado rechazado o pendiente en el comercio',
        'Error en transferencia interbancaria (ACH) sin abono oportuno',
        'Fallo en recarga o pago de servicios en App Móvil con cargo duplicado'
      ],
      areaResponsable: 'Soporte Canales Digitales / Compensación Operativa',
      slaHoras: 24,
      slaDiasHabiles: 3,
      requisitos: [
        'Código CUS o RRN de la transacción digital o número de cajero/ATM',
        'Fecha, hora exacta y valor exacto de la operación debitada',
        'Extracto o movimiento contable donde se evidencie el débito',
        'Respuesta o soporte de rechazo emitido por el comercio si aplica PSE'
      ],
      activo: true,
      version: 5,
      estadoAprobacion: 'APROBADO'
    },
    {
      id: 'apy-638',
      codigo: '638',
      nombre: 'Cambio de Tasa o Cuota en Tarjeta de Crédito',
      descripcion: 'Ajuste, reliquidación o reconsideración de tasas de interés y plan de amortización o número de cuotas en tarjetas de crédito.',
      causales: [
        'Rediferido automático no informado ni pactado de saldos de tarjeta',
        'Inconformidad por tasa de interés superior a la ofertada en campaña promocional',
        'Solicitud de modificación de plazo/cuotas por reestructuración comercial',
        'Error en aplicación de tasa preferencial por compra de cartera'
      ],
      areaResponsable: 'Gestión de Cartera / Tarjetas de Crédito',
      slaHoras: 72,
      slaDiasHabiles: 5,
      requisitos: [
        'Extracto bancario del periodo en controversia',
        'Evidencia de la oferta comercial o soporte de la tasa pactada (correo, SMS, contrato)',
        'Solicitud expresa del cliente con indicación de las cuotas requeridas',
        'Validación de estado al día de la obligación al momento del reclamo'
      ],
      activo: true,
      version: 3,
      estadoAprobacion: 'APROBADO'
    },
    {
      id: 'apy-312',
      codigo: '312',
      nombre: 'Exoneración y Reintegro de Cuota de Manejo',
      descripcion: 'Revisión de cobros de comisión de administración o cuota de manejo en tarjetas o cuentas con beneficio de exoneración.',
      causales: [
        'Incumplimiento de condición comercial de cuota de manejo $0',
        'Cobro posterior a solicitud de congelamiento o reclamo previo',
        'Cobro en tarjeta no activada o no entregada al cliente'
      ],
      areaResponsable: 'Soluciones Comerciales / Facturación',
      slaHoras: 48,
      slaDiasHabiles: 3,
      requisitos: [
        'Extracto con el cobro de la cuota de manejo objeto de reclamo',
        'Certificación del convenio de nómina o campaña de exoneración vigente'
      ],
      activo: true,
      version: 1,
      estadoAprobacion: 'APROBADO'
    },
    {
      id: 'apy-445',
      codigo: '445',
      nombre: 'Objeción y Cancelación de Seguros Voluntarios',
      descripcion: 'Trámite de cancelación inmediata y restitución de primas de pólizas no autorizadas o vinculadas sin consentimiento.',
      causales: [
        'Inclusión de seguro de vida, fraude o desempleo no solicitado',
        'Cobro persistente posterior a solicitud de cancelación de póliza',
        'Objeción a cláusulas de renovación automática de seguros'
      ],
      areaResponsable: 'Gerencia de Seguros / Operaciones Bancaseguros',
      slaHoras: 72,
      slaDiasHabiles: 5,
      requisitos: [
        'Número de certificado o póliza vinculada',
        'Identificación del cobro en el extracto mensual',
        'Grabación de venta o consentimiento firmado si el cliente alega no autorización'
      ],
      activo: true,
      version: 2,
      estadoAprobacion: 'APROBADO'
    },
    {
      id: 'apy-510',
      codigo: '510',
      nombre: 'Aplicación y Corrección de Pagos',
      descripcion: 'Ajuste contable por pagos no acreditados, pagos a créditos erróneos o mala distribución de abono a capital e intereses.',
      causales: [
        'Pago realizado en ventanilla o corresponsal no acreditado a la obligación',
        'Abono a capital indebidamente aplicado a intereses futuros',
        'Pago cruzado entre dos productos del mismo titular'
      ],
      areaResponsable: 'Operaciones Contables / Aplicación de Pagos',
      slaHoras: 48,
      slaDiasHabiles: 3,
      requisitos: [
        'Comprobante original de pago o timbre bancario legible',
        'Número de cuenta o crédito destinatario correcto',
        'Certificación de fecha y canal del recaudo'
      ],
      activo: true,
      version: 1,
      estadoAprobacion: 'APROBADO'
    },
    {
      id: 'apy-198',
      codigo: '198',
      nombre: 'Exención y Ajuste de GMF (4x1000)',
      descripcion: 'Marcación de cuenta única exenta del Gravamen a los Movimientos Financieros y devolución de cobros indebidos de 4x1000.',
      causales: [
        'Cobro de 4x1000 en cuenta marcada previamente como exenta bajo topes legales',
        'Demora en el levantamiento o marcación de exención entre entidades financieras',
        'Cobro del tributo en traslados entre cuentas del mismo titular'
      ],
      areaResponsable: 'Tributaria y Cumplimiento Operativo',
      slaHoras: 48,
      slaDiasHabiles: 4,
      requisitos: [
        'Formulario de solicitud de marcación de cuenta exenta',
        'Certificado de no tener otra cuenta exenta activa en el sistema financiero',
        'Extractos con los débitos tributarios a reliquidar'
      ],
      activo: true,
      version: 2,
      estadoAprobacion: 'APROBADO'
    }
  ];

  public categories: PQRCategory[] = [
    {
      id: 'cat-cuota-manejo',
      nombre: 'Cuota de manejo',
      codigoIdentificador: 'CUOTA_MANEJO',
      descripcion: 'Cobro periódico por administración de tarjetas de crédito o débito y cuentas bancarias.',
      codigoApyDefault: '312',
      areaDefault: 'Soluciones Comerciales / Facturación',
      palabrasClave: ['cuota de manejo', 'cobro de manejo', 'comision de administracion', 'tarifa mensual de manejo', 'exoneracion de manejo'],
      reglasExclusion: ['No clasificar si la cuota corresponde al valor mensual de amortización de un préstamo o crédito de consumo'],
      criterioSuperfinanciera: 'Comisiones financieras pactadas vs exenciones comerciales ofrecidas.',
      activa: true
    },
    {
      id: 'cat-seguros',
      nombre: 'Seguros',
      codigoIdentificador: 'SEGUROS',
      descripcion: 'Primas de seguros de vida, desempleo, fraude o protección de cartera vinculados a productos bancarios.',
      codigoApyDefault: '445',
      areaDefault: 'Gerencia de Seguros / Bancaseguros',
      palabrasClave: ['seguro', 'poliza', 'prima', 'seguro de vida', 'seguro voluntario', 'seguro cardif', 'bancaseguros', 'seguro deudor'],
      reglasExclusion: ['Verificar si se trata de seguro obligatorio deudor en crédito de vivienda o seguro voluntario'],
      criterioSuperfinanciera: 'Venta atada prohibida; consentimiento expreso e informado del consumidor.',
      activa: true
    },
    {
      id: 'cat-aplicacion-pago',
      nombre: 'Aplicación de pago',
      codigoIdentificador: 'APLICACION_PAGO',
      descripcion: 'Inconformidad con la recepción, fecha valor o distribución de abonos a capital, intereses y comisiones.',
      codigoApyDefault: '510',
      areaDefault: 'Operaciones Contables / Aplicación de Pagos',
      palabrasClave: ['abono a capital', 'pago no aplicado', 'pago no se refleja', 'comprobante de pago', 'recaudo', 'intereses cobrados indebidamente'],
      reglasExclusion: ['No confundir con cuota de manejo ni con fraude'],
      criterioSuperfinanciera: 'Derecho a la imputación de pagos conforme a los artículos 1653 y 1654 del Código Civil.',
      activa: true
    },
    {
      id: 'cat-gmf',
      nombre: 'GMF (4x1000)',
      codigoIdentificador: 'GMF',
      descripcion: 'Gravamen a los Movimientos Financieros, exenciones legales y reliquidación tributaria.',
      codigoApyDefault: '198',
      areaDefault: 'Tributaria y Cumplimiento Operativo',
      palabrasClave: ['gmf', '4x1000', 'cuatro por mil', 'gravamen movimientos financieros', 'cuenta exenta', 'retencion 4 por mil'],
      reglasExclusion: ['No confundir con retención en la fuente por rendimientos ni comisiones bancarias'],
      criterioSuperfinanciera: 'Artículo 879 del Estatuto Tributario y normatividad DIAN.',
      activa: true
    },
    {
      id: 'cat-pse',
      nombre: 'PSE',
      codigoIdentificador: 'PSE',
      descripcion: 'Transacciones mediante el botón de pagos seguros en línea PSE debitadas pero fallidas en comercio.',
      codigoApyDefault: '779',
      areaDefault: 'Soporte Canales Digitales / Compensación Operativa',
      palabrasClave: ['pse', 'pago seguro en linea', 'boton pse', 'transaccion no confirmada', 'cus', 'debito pse'],
      reglasExclusion: ['No clasificar transacciones físicas o cajeros como PSE'],
      criterioSuperfinanciera: 'Trazabilidad y conciliación interbancaria ACH/ACH Colombia.',
      activa: true
    },
    {
      id: 'cat-cambio-cuotas',
      nombre: 'Cambio de cuotas / Rediferido',
      codigoIdentificador: 'CAMBIO_CUOTAS',
      descripcion: 'Modificación del plazo de consumos de tarjeta de crédito, rediferidos automáticos o acuerdos de pago.',
      codigoApyDefault: '638',
      areaDefault: 'Gestión de Cartera / Tarjetas de Crédito',
      palabrasClave: ['rediferir', 'rediferido', 'cambio de cuotas', 'plazo de compras', 'diferir compras', 'ampliacion de cuotas'],
      reglasExclusion: ['No confundir con cuota de manejo mensual'],
      criterioSuperfinanciera: 'Circular Básica Jurídica CE 029 de 2014.',
      activa: true
    },
    {
      id: 'cat-fraude',
      nombre: 'Fraude',
      codigoIdentificador: 'FRAUDE',
      descripcion: 'Vulneración de credenciales, clonación o suplantación en canales electrónicos o presenciales.',
      codigoApyDefault: '627',
      areaDefault: 'Seguridad Bancaria / Prevención de Fraude',
      palabrasClave: ['fraude', 'clonacion', 'hackeo', 'suplantacion', 'estafa', 'transferencia no reconocida', 'robo de datos'],
      reglasExclusion: ['No confundir con compras autorizadas por el cliente que tuvieron inconformidad con el vendedor'],
      criterioSuperfinanciera: 'Deber de custodia y responsabilidad patrimonial de la entidad financiera.',
      activa: true
    },
    {
      id: 'cat-compras-no-reconocidas',
      nombre: 'Compras no reconocidas',
      codigoIdentificador: 'COMPRAS_NO_RECONOCIDAS',
      descripcion: 'Consumos en comercios físicos o virtuales con tarjeta débito o crédito no efectuados por el titular.',
      codigoApyDefault: '627',
      areaDefault: 'Seguridad Bancaria / Prevención de Fraude',
      palabrasClave: ['compra no reconocida', 'cargo no reconocido', 'consumo no realizado', 'yo no compre', 'desconocimiento de compra'],
      reglasExclusion: ['Diferenciar de suscripciones recurrentes previamente autorizadas (ej. Netflix, Spotify)'],
      criterioSuperfinanciera: 'Ley 1480 de 2011 (Estatuto del Consumidor) y reversión del pago.',
      activa: true
    },
    {
      id: 'cat-cancelacion-tarjeta',
      nombre: 'Cancelación de tarjeta',
      codigoIdentificador: 'CANCELACION_TARJETA',
      descripcion: 'Solicitud de terminación de contrato y cancelación definitiva de tarjeta de crédito.',
      codigoApyDefault: '807',
      areaDefault: 'Operaciones Tarjetas / Soluciones',
      palabrasClave: ['cancelar tarjeta', 'cancelacion de tarjeta', 'cancelar mi tarjeta de credito', 'terminacion de tarjeta', 'bloqueo definitivo por cancelacion'],
      reglasExclusion: ['No confundir con suspensión temporal por mora'],
      criterioSuperfinanciera: 'Derecho a terminar el contrato de apertura de crédito.',
      activa: true
    },
    {
      id: 'cat-devolucion-fga',
      nombre: 'Devolución de FGA',
      codigoIdentificador: 'DEVOLUCION_FGA',
      descripcion: 'Devolución de fianza o comisión del Fondo de Garantías Agropecuarias o Financieras por prepago.',
      codigoApyDefault: '267',
      areaDefault: 'Créditos y Cartera / Gestión FGA',
      palabrasClave: ['fga', 'fondo de garantias', 'devolucion fga', 'comision de garantia', 'fianza'],
      reglasExclusion: ['Aplica exclusivamente a préstamos con garantía FGA pagados anticipadamente'],
      criterioSuperfinanciera: 'Regulación de comisiones por fianzas y prepago de crédito.',
      activa: true
    },
    {
      id: 'cat-cdt',
      nombre: 'CDT e Inversiones',
      codigoIdentificador: 'CDT',
      descripcion: 'Certificados de Depósito a Término, tasas de captación, redención de intereses y renovación.',
      codigoApyDefault: '779',
      areaDefault: 'Operaciones de Captación y Tesorería',
      palabrasClave: ['cdt', 'certificado de deposito a termino', 'titulo valor cdt', 'redencion de cdt', 'tasa del cdt'],
      reglasExclusion: ['PROHIBIDO clasificar como CDT solo porque el cliente mencione una cuenta de ahorros o corriente'],
      criterioSuperfinanciera: 'Títulos valores y contratos de captación a término.',
      activa: true
    },
    {
      id: 'cat-embargos',
      nombre: 'Embargos Judiciales',
      codigoIdentificador: 'EMBARGOS',
      descripcion: 'Aplicación o desembargo de medidas cautelares decretadas por despachos judiciales o entidades coactivas.',
      codigoApyDefault: '779',
      areaDefault: 'Gerencia Jurídica / Medidas Cautelares',
      palabrasClave: ['oficio de embargo', 'embargo judicial', 'juzgado decreto embargo', 'desembargo', 'coactiva dian', 'medida cautelar'],
      reglasExclusion: ['PROHIBIDO clasificar si el cliente usa la expresión idiomática "sin embargo"'],
      criterioSuperfinanciera: 'Código General del Proceso y límites de inembargabilidad.',
      activa: true
    }
  ];

  public rules: BusinessRule[] = [
    {
      id: 'regla-sin-embargo',
      nombre: 'Exclusión de Conector "Sin embargo" en Embargos',
      descripcion: 'Detecta y anula clasificaciones erróneas de embargo judicial cuando la palabra embargo proviene del conector lingüístico adversativo "sin embargo".',
      categoriaAfectada: 'EMBARGOS',
      patronDeteccion: '\\bsin\\s+embargo\\b',
      accion: 'REASIGNAR',
      categoriaDestino: 'ANALIZAR_INTENCION_SECUNDARIA',
      activa: true,
      version: 3,
      justificacionNormativa: 'Evita falsos positivos en área jurídica. La frase "sin embargo" es una locución conjuntiva adversativa, no una orden de embargo judicial (CGP Art. 593).'
    },
    {
      id: 'regla-cuota-credito-vs-manejo',
      nombre: 'Diferenciación de Cuota de Crédito vs Cuota de Manejo',
      descripcion: 'Si el cliente habla de cuota de su crédito, préstamo, libranza o valor a pagar del mes de su obligación, jamás debe clasificarse como cuota de manejo.',
      categoriaAfectada: 'CUOTA_MANEJO',
      patronDeteccion: '\\b(cuota\\s+del?\\s+(credito|prestamo|libranza|hipotecario|vehicular)|valor\\s+de\\s+la\\s+cuota\\s+mensual\\s+del?\\s+prestamo)\\b',
      accion: 'REASIGNAR',
      categoriaDestino: 'APLICACION_PAGO',
      codigoApySugerido: '510',
      activa: true,
      version: 4,
      justificacionNormativa: 'La cuota de amortización de un préstamo es un pago de capital e intereses, mientras que la cuota de manejo es una tarifa por disponibilidad de plástico/cupo.'
    },
    {
      id: 'regla-cuenta-no-cdt',
      nombre: 'Exclusión de CDT por Mención Incidental de Cuenta',
      descripcion: 'Prohíbe clasificar como CDT reclamaciones donde solo se menciona cuenta de ahorros, débito de cuenta o número de cuenta sin que exista un título valor CDT en litigio.',
      categoriaAfectada: 'CDT',
      patronDeteccion: '\\b(cuenta\\s+de\\s+ahorros|cuenta\\s+corriente|mi\\s+cuenta)\\b',
      accion: 'EXCLUIR',
      categoriaDestino: 'REVISAR_INTENCION_REAL',
      activa: true,
      version: 2,
      justificacionNormativa: 'Un CDT es un contrato de captación especial con título valor. La mención de una cuenta corriente o de ahorros corresponde al producto operativo ordinario.'
    },
    {
      id: 'regla-prioridad-descripcion-detallada',
      nombre: 'Prevalencia de Descripción Detallada sobre Resumen',
      descripcion: 'Obliga a tomar la intencionalidad desde la descripción detallada del cliente, anulando categorizaciones previas del front o del resumen simplificado.',
      categoriaAfectada: 'TODAS',
      patronDeteccion: 'SIEMPRE_APLICAR',
      accion: 'FORZAR_CATEGORIA',
      activa: true,
      version: 2,
      justificacionNormativa: 'Principio de verdad material y debido proceso en la atención de quejas ante la Superintendencia Financiera de Colombia (Circular Básica Jurídica).'
    },
    {
      id: 'regla-gmf-especifica',
      nombre: 'Regla Específica de Marcación GMF 4x1000',
      descripcion: 'Si se menciona 4x1000, cuatro por mil o gravamen a movimientos financieros, asignar exclusivamente a tributaria con APY 198.',
      categoriaAfectada: 'GMF',
      patronDeteccion: '\\b(4x1000|cuatro\\s+por\\s+mil|gmf|gravamen\\s+a\\s+los\\s+movimientos)\\b',
      accion: 'FORZAR_CATEGORIA',
      categoriaDestino: 'GMF',
      codigoApySugerido: '198',
      activa: true,
      version: 2,
      justificacionNormativa: 'Artículo 879 del Estatuto Tributario colombiano.'
    },
    {
      id: 'regla-pse-especifica',
      nombre: 'Regla Específica para Fallas en Pasarela PSE',
      descripcion: 'Cuando la transacción involucra botón de pago PSE, código CUS o débito en línea con rechazo en comercio, asociar a Error en Canales APY 779.',
      categoriaAfectada: 'PSE',
      patronDeteccion: '\\b(pse|boton\\s+pse|codigo\\s+cus|pasarela\\s+pse)\\b',
      accion: 'FORZAR_CATEGORIA',
      categoriaDestino: 'PSE',
      codigoApySugerido: '779',
      activa: true,
      version: 2,
      justificacionNormativa: 'Reglamento del sistema de transferencias electrónicas y compensación ACH.'
    }
  ];

  public goldenTestCases: GoldenTestCase[] = [
    {
      id: 'tc-01',
      titulo: 'Trampa del conector lingüístico "sin embargo"',
      descripcionDetallada: 'El mes pasado pagué puntualmente la cuota de mi tarjeta de crédito, sin embargo me suspendieron el servicio y me están cobrando intereses de mora injustificados.',
      subcategoriaInicialErronea: 'Embargo de cuenta',
      categoriaEsperada: 'Aplicación de pago',
      codigoApyEsperado: '510',
      reglaVerificada: 'Exclusión de Conector "Sin embargo" en Embargos',
      justificacion: 'El cliente utiliza "sin embargo" como conjunción adversativa. No existe orden judicial ni embargo real. El reclamo es por pago no acreditado.',
      casoTipo: 'CRITICO_SIN_EMBARGO'
    },
    {
      id: 'tc-02',
      titulo: 'Cuota de crédito confundida con cuota de manejo',
      descripcionDetallada: 'Buenos días, estoy muy inconforme porque la cuota de mi crédito de libre inversión subió de $450.000 a $530.000 sin previo aviso en el extracto de octubre.',
      subcategoriaInicialErronea: 'Cobro de cuota de manejo',
      categoriaEsperada: 'Aplicación de pago',
      codigoApyEsperado: '510',
      reglaVerificada: 'Diferenciación de Cuota de Crédito vs Cuota de Manejo',
      justificacion: 'Se trata de la amortización mensual de un crédito de libre inversión, no de la cuota de manejo de una tarjeta o cuenta.',
      casoTipo: 'CRITICO_CUOTA_CREDITO_VS_MANEJO'
    },
    {
      id: 'tc-03',
      titulo: 'Mención incidental de cuenta no corresponde a CDT',
      descripcionDetallada: 'Hice una transferencia desde mi cuenta de ahorros para pagar los servicios públicos y el dinero fue debitado pero nunca llegó a la empresa.',
      subcategoriaInicialErronea: 'CDT - Certificado de depósito',
      categoriaEsperada: 'PSE',
      codigoApyEsperado: '779',
      reglaVerificada: 'Exclusión de CDT por Mención Incidental de Cuenta',
      justificacion: 'Mencionar "cuenta de ahorros" no guarda relación con un Certificado de Depósito a Término; se trata de una falla de canal electrónico.',
      casoTipo: 'CRITICO_NO_CDT_POR_MENCION_CUENTA'
    },
    {
      id: 'tc-04',
      titulo: 'Reclamación específica de GMF 4x1000 en cuenta exenta',
      descripcionDetallada: 'Solicité la marcación de mi cuenta de ahorros número 245100 como cuenta exenta del cuatro por mil ya que no tengo más cuentas en el banco, pero me siguen descontando el 4x1000 en cada retiro.',
      subcategoriaInicialErronea: 'Comisiones de cuenta',
      categoriaEsperada: 'GMF (4x1000)',
      codigoApyEsperado: '198',
      reglaVerificada: 'Regla Específica de Marcación GMF 4x1000',
      justificacion: 'Se fundamenta en el derecho legal de exoneración de Gravamen a los Movimientos Financieros (Estatuto Tributario Art. 879).',
      casoTipo: 'GMF'
    },
    {
      id: 'tc-05',
      titulo: 'Falla transaccional en pasarela PSE con código CUS',
      descripcionDetallada: 'Compré unos pasajes aéreos a través del botón PSE, me llegó el mensaje de texto de confirmación del débito de $780.000 de mi cuenta pero en la aerolínea salió error de pasarela. El código CUS es 4598124.',
      subcategoriaInicialErronea: 'Compras no reconocidas',
      categoriaEsperada: 'PSE',
      codigoApyEsperado: '779',
      reglaVerificada: 'Regla Específica para Fallas en Pasarela PSE',
      justificacion: 'Transacción realizada voluntariamente por el usuario que falló en la compensación de la pasarela PSE con código CUS comprobable.',
      casoTipo: 'PSE'
    },
    {
      id: 'tc-06',
      titulo: 'Fraude sin suplantación en compra internacional web',
      descripcionDetallada: 'Tengo mi tarjeta física en la billetera y acaban de llegarme tres notificaciones de compras en dólares en tiendas de Singapur que jamás autoricé ni conozco.',
      subcategoriaInicialErronea: 'Petición comercial general',
      categoriaEsperada: 'Fraude',
      codigoApyEsperado: '627',
      reglaVerificada: 'Detección de Transacciones No Autorizadas APY 627',
      justificacion: 'Transacción fraudulenta en e-commerce sin entrega de credenciales con custodia física del plástico. Requiere bloqueo y carta juramentada.',
      casoTipo: 'FRAUDE_SIN_SUPLANTACION'
    },
    {
      id: 'tc-07',
      titulo: 'Devolución de comisión de fianza FGA por cancelación anticipada',
      descripcionDetallada: 'Cancelé anticipadamente en su totalidad mi crédito de consumo mediante pago extraordinario. Solicito la devolución del saldo proporcional no causado del Fondo de Garantías FGA que me cobraron al desembolso.',
      subcategoriaInicialErronea: 'Paz y Salvo',
      categoriaEsperada: 'Devolución de FGA',
      codigoApyEsperado: '267',
      reglaVerificada: 'Reintegro de FGA por Prepago de Obligación',
      justificacion: 'El cliente liquidó el préstamo antes del plazo pactado; legalmente tiene derecho a la restitución proporcional de la comisión FGA no causada.',
      casoTipo: 'CRITICO_SIN_EMBARGO'
    },
    {
      id: 'tc-08',
      titulo: 'Cancelación formal de tarjeta con saldo en cero',
      descripcionDetallada: 'Ya pagué la totalidad de mi tarjeta Visa terminada en 4410, no debo ni un peso y deseo que sea cancelada definitivamente de inmediato porque no deseo pagar más costos.',
      subcategoriaInicialErronea: 'Consulta de saldo',
      categoriaEsperada: 'Cancelación de tarjeta',
      codigoApyEsperado: '807',
      reglaVerificada: 'Cancelación Formal de Producto Tarjetas APY 807',
      justificacion: 'Petición expresa de terminación de contrato bancario con saldo verificado en cero. No debe ser desviada a retención obligatoria sin consentimiento.',
      casoTipo: 'CRITICO_SIN_EMBARGO'
    }
  ];

  public ruleVersions: RuleVersion[] = [
    {
      id: 'rv-01',
      fecha: '2026-10-15 08:30:00',
      usuario: 'valearicano@bancolima.com (Admin Calidad)',
      version: 1,
      cambios: 'Definición de catálogo inicial de códigos APY obligatorios: 807, 627, 267, 779, 638.'
    },
    {
      id: 'rv-02',
      fecha: '2026-10-22 14:15:00',
      usuario: 'valearicano@bancolima.com (Admin Calidad)',
      version: 2,
      cambios: 'Implementación de regla de oro: exclusión de "sin embargo" para evitar falsos positivos en Embargos Judiciales.'
    },
    {
      id: 'rv-03',
      fecha: '2026-10-28 11:00:00',
      usuario: 'valearicano@bancolima.com (Admin Calidad)',
      version: 3,
      cambios: 'Diferenciación estricta entre cuota de crédito de consumo y cuota de manejo; ajuste de prevalencia de descripción detallada.'
    }
  ];

  public auditLogs: AuditLog[] = [
    {
      id: 'log-001',
      timestamp: '2026-10-30 08:00:15',
      usuario: 'sistema@bancolima.com',
      rol: 'SISTEMA',
      accion: 'INICIALIZACION_MOTOR',
      entidad: 'MotorReglasPQR',
      detalle: 'Catálogo institucional cargado exitosamente con 9 códigos APY, 12 categorías y 6 reglas de negocio activas.'
    }
  ];

  public users: UserRole[] = [
    {
      id: 'user-01',
      nombre: 'Valeria Arcano (Tú)',
      email: 'valearicano@gmail.com',
      rol: 'ADMIN_CALIDAD',
      cargo: 'Líder de Calidad y Operaciones PQR',
      permisos: ['ADMIN_RULES', 'EXECUTE_BATCH', 'PROMOTER_CHAT', 'COMMERCIAL_TRIAGE', 'AUDIT_VIEW', 'MANAGE_CATALOG']
    },
    {
      id: 'user-02',
      nombre: 'Carlos Mendoza',
      email: 'cmendoza@bancolima.com',
      rol: 'PROMOTOR_N1',
      cargo: 'Promotor de Soluciones Nivel 1',
      permisos: ['PROMOTER_CHAT', 'COMMERCIAL_TRIAGE']
    },
    {
      id: 'user-03',
      nombre: 'Diana Gómez',
      email: 'dgomez@bancolima.com',
      rol: 'PROMOTOR_N2',
      cargo: 'Asesor Especializado de Radicaciones Nivel 2',
      permisos: ['PROMOTER_CHAT', 'EXECUTE_BATCH', 'COMMERCIAL_TRIAGE']
    },
    {
      id: 'user-04',
      nombre: 'Fernando Rivas',
      email: 'frivas@bancolima.com',
      rol: 'ASESOR_COMERCIAL',
      cargo: 'Asesor de Canales Comerciales y Sucursales',
      permisos: ['COMMERCIAL_TRIAGE', 'PROMOTER_CHAT']
    },
    {
      id: 'user-05',
      nombre: 'Beatriz Salazar',
      email: 'bsalazar@bancolima.com',
      rol: 'AUDITOR',
      cargo: 'Auditora Senior de Cumplimiento Normativo',
      permisos: ['AUDIT_VIEW', 'VIEW_RULES']
    }
  ];

  public addAuditLog(usuario: string, rol: string, accion: string, entidad: string, detalle: string, metadata?: any) {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      usuario,
      rol,
      accion,
      entidad,
      detalle,
      metadata
    };
    this.auditLogs.unshift(newLog);
    // keep max 500 logs
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return newLog;
  }
}

export const bankDb = new BankDataStore();
