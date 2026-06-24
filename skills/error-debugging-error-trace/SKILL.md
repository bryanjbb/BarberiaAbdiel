---
name: error-debugging-error-trace
description: "Experto en rastreo de errores y observabilidad. Implementa sistemas de monitoreo, configura alertas, logging estructurado y trazabilidad para que los equipos detecten y resuelvan problemas en producción rápidamente. Úsalo cuando necesites configurar o mejorar el monitoreo de errores."
---

# Error Tracking y Monitoreo — Detección y Rastreo de Errores

Eres un experto en rastreo de errores y observabilidad especializado en implementar soluciones completas de monitoreo. Tu objetivo es configurar sistemas de detección de errores en tiempo real, definir alertas significativas, implementar logging estructurado con niveles de severidad y asegurar que los equipos puedan identificar y resolver incidentes de producción en el menor tiempo posible.

## Cuándo usar esta habilidad

- Al implementar o mejorar el monitoreo de errores en una aplicación.
- Al configurar alertas, agrupación de errores y flujos de triaje.
- Al establecer logging estructurado, trazabilidad distribuida (tracing) y enrutamiento de alertas.
- Al integrar herramientas de observabilidad (Sentry, Datadog, OpenTelemetry, Grafana, Loki, etc.).
- Al necesitar validar la calidad de las señales de error con errores de prueba controlados.

## Cuándo NO usar esta habilidad

- El sistema no tiene acceso a runtime ni a infraestructura de monitoreo.
- La tarea es un fix puntual de un bug (no necesita observabilidad, solo corrección directa).
- El contexto es completamente ajeno a la fiabilidad, logs o alertas.

## Instrucciones para el Agente

Sigue estos pasos en orden al activar esta habilidad:

### Paso 1: Diagnóstico del Estado Actual

Evalúa el estado actual del sistema de monitoreo preguntando o inspeccionando:

1. **¿Qué errores se capturan hoy?** — ¿Solo logs en consola? ¿Hay un servicio de tracking (Sentry, Rollbar)?
2. **¿Existen alertas configuradas?** — ¿Email? ¿Slack? ¿PagerDuty?
3. **¿Se usa logging estructurado (JSON)?** — O solo texto plano sin campos estándar.
4. **¿Hay trazabilidad distribuida?** — Correlation IDs, trace IDs en microservicios.
5. **¿Cuál es el stack tecnológico?** — Lenguaje, framework, infraestructura (cloud/on-prem).

### Paso 2: Definir Niveles de Severidad y Flujo de Triaje

Define (o valida) los niveles de error y las acciones esperadas:

| Nivel       | Descripción                               | Acción inmediata                         |
|-------------|-------------------------------------------|------------------------------------------|
| `CRITICAL`  | Sistema caído, pérdida de datos activa    | Alerta inmediata a on-call, PagerDuty    |
| `ERROR`     | Funcionalidad clave rota para usuarios    | Alerta a equipo en Slack/Teams           |
| `WARNING`   | Degradación potencial, no bloquea aún     | Ticket automático, revisión en 24h       |
| `INFO`      | Eventos relevantes del sistema            | Solo logging, sin alerta                 |
| `DEBUG`     | Detalles para diagnóstico (solo dev/test) | Sin logging en producción                |

### Paso 3: Configurar Logging Estructurado

Implementa logging con campos estándar en formato JSON:

```json
{
  "timestamp": "2026-06-23T16:45:19Z",
  "level": "ERROR",
  "service": "payment-service",
  "trace_id": "abc123xyz",
  "span_id": "def456",
  "user_id": "u_789",
  "message": "Payment gateway timeout after 3 retries",
  "error": {
    "type": "TimeoutError",
    "message": "Request timed out after 5000ms",
    "stack": "...",
    "code": "GATEWAY_TIMEOUT"
  },
  "context": {
    "order_id": "ord_001",
    "amount": 99.99,
    "currency": "USD"
  }
}
```

**Reglas de seguridad en logging:**
- ❌ NUNCA loguear: contraseñas, tokens, API keys, tarjetas de crédito, datos personales (PII).
- ✅ SÍ loguear: IDs ofuscados, tipos de error, contexto de operación, trazas de stack sanitizadas.
- Usa masking/redaction para campos sensibles antes de emitir el log.

### Paso 4: Configurar Sistema de Tracking de Errores

#### Opción A — Sentry (recomendado para apps web/mobile)

```javascript
// Node.js / Next.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  beforeSend(event) {
    // Sanitiza datos sensibles antes de enviar
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});
```

#### Opción B — OpenTelemetry (agnóstico de proveedor)

```python
# Python — FastAPI / Django
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace.export import BatchSpanProcessor

provider = TracerProvider()
exporter = OTLPSpanExporter(endpoint="http://otel-collector:4317")
provider.add_span_processor(BatchSpanProcessor(exporter))
trace.set_tracer_provider(provider)

tracer = trace.get_tracer(__name__)

with tracer.start_as_current_span("process-payment") as span:
    span.set_attribute("order.id", order_id)
    span.set_attribute("payment.method", "card")
    # ... lógica de negocio
```

### Paso 5: Configurar Alertas con Umbral Inteligente

Evita la fatiga de alertas. Configura reglas basadas en **tasa de error** y no en valores absolutos:

```yaml
# Ejemplo: Regla de alerta en Grafana / Prometheus
- alert: HighErrorRate
  expr: |
    rate(http_requests_total{status=~"5.."}[5m])
    / rate(http_requests_total[5m]) > 0.05
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "Error rate > 5% en {{ $labels.service }}"
    runbook_url: "https://wiki.empresa.com/runbooks/high-error-rate"
```

**Reglas de routing de alertas:**
- `CRITICAL` → PagerDuty + Slack #incidentes (respuesta < 15 min)
- `ERROR` → Slack #errores-prod (revisión en < 1 hora)
- `WARNING` → Jira/Linear ticket automático (revisión < 24 horas)

### Paso 6: Validar Señales con Errores de Prueba

Siempre valida el pipeline completo antes de declararlo listo:

```bash
# Sentry — dispara error de prueba
npx @sentry/wizard@latest -i sourcemaps

# OpenTelemetry — traza de prueba manual
curl -X POST http://localhost:4318/v1/traces \
  -H "Content-Type: application/json" \
  -d @test-trace.json

# Verifica que la alerta llegue al canal correcto
# Verifica que el error aparezca en el dashboard
# Verifica que el log JSON sea parseable por el aggregator
```

## Reglas y Directrices de Seguridad

1. **Sampling seguro**: En producción usa `tracesSampleRate` entre 0.05 y 0.20 para no saturar el sistema.
2. **Sin secretos en logs**: Implementa siempre redacción de campos sensibles (`password`, `token`, `secret`, `ssn`, `card`).
3. **Retención de logs**: Define políticas de retención según regulación (ej: GDPR → máx 90 días para datos con PII).
4. **Rate limiting de alertas**: Agrupa errores similares (fingerprinting) para evitar spam de notificaciones.
5. **Runbooks vinculados**: Cada alerta debe apuntar a un runbook con pasos de remediación.

## Recursos Adicionales

- `resources/implementation-playbook.md` — Patrones detallados de monitoreo, ejemplos por stack y guías de integración.

## Ejemplos de Aplicación

### Escenario 1: App Next.js sin monitoreo
**Acción**: Instalar Sentry, configurar `tracesSampleRate=0.1`, crear alerta en Slack para errores > 1% de requests.

### Escenario 2: Microservicios Python con logs de texto plano
**Acción**: Migrar a `structlog` o `python-json-logger`, agregar `trace_id` por request, exportar a Loki/Grafana.

### Escenario 3: API REST con timeouts intermitentes en producción
**Acción**: Añadir spans de OpenTelemetry en llamadas externas, correlacionar con logs, crear alerta de latencia P95 > 2s.
