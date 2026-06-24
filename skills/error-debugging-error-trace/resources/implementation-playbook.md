# Implementation Playbook — Error Tracking y Monitoreo

Guía de referencia detallada con patrones, ejemplos por stack y flujos de integración para sistemas de observabilidad.

---

## 1. Patrones de Logging Estructurado por Stack

### Node.js / TypeScript — con `pino`

```typescript
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: ["req.headers.authorization", "body.password", "body.token"],
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: "my-api",
    version: process.env.APP_VERSION,
    env: process.env.NODE_ENV,
  },
});

// Uso con contexto de request
export function createRequestLogger(traceId: string) {
  return logger.child({ trace_id: traceId });
}

// Captura de error con contexto
try {
  await processPayment(orderId);
} catch (error) {
  logger.error({
    err: error,
    order_id: orderId,
    msg: "Payment processing failed",
  });
  throw error;
}
```

### Python — con `structlog`

```python
import structlog
import logging

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.contextvars.merge_contextvars,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.BoundLogger,
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

log = structlog.get_logger()

# Binding de contexto para todo el request
structlog.contextvars.bind_contextvars(
    trace_id=request.headers.get("X-Trace-Id"),
    user_id=current_user.id,
    service="order-service",
)

# Log con contexto automático
log.error("database_query_failed",
    table="orders",
    duration_ms=timeout_ms,
    error=str(e),
)
```

### Go — con `zerolog`

```go
package logger

import (
    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
    "os"
)

func Init() {
    zerolog.TimeFieldFormat = zerolog.TimeFormatUnixMs
    log.Logger = zerolog.New(os.Stdout).
        With().
        Timestamp().
        Str("service", "inventory-service").
        Str("version", os.Getenv("APP_VERSION")).
        Logger()
}

// Uso
log.Error().
    Err(err).
    Str("trace_id", ctx.Value("trace_id").(string)).
    Str("sku", productSKU).
    Msg("inventory update failed")
```

---

## 2. Integración con Servicios de Tracking

### Sentry — Configuración Completa (Next.js App Router)

```javascript
// sentry.server.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Captura de performance
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Filtrado de errores irrelevantes
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    /^Network Error$/,
    "ChunkLoadError",
  ],

  // Sanitización de datos sensibles
  beforeSend(event, hint) {
    // Eliminar datos de usuario identificables
    if (event.user) {
      event.user = { id: event.user.id }; // Solo conservar ID anonimizado
    }

    // Filtrar errores de bots/crawlers
    if (event.request?.headers?.["User-Agent"]?.includes("bot")) {
      return null;
    }

    return event;
  },

  // Tags globales para filtrado en dashboard
  initialScope: {
    tags: {
      component: "web",
      region: process.env.DEPLOY_REGION,
    },
  },
});
```

### Datadog APM — Python Django

```python
# settings.py / wsgi.py
from ddtrace import patch_all, tracer

patch_all()  # Auto-instrumenta Django, requests, psycopg2, redis, etc.

tracer.configure(
    hostname="datadog-agent",
    port=8126,
    analytics_enabled=True,
)

# Traza manual de operación de negocio
from ddtrace import tracer as dd_tracer

@dd_tracer.wrap(service="checkout", resource="process_payment")
def process_payment(order_id: str, amount: float):
    span = dd_tracer.current_span()
    span.set_tag("order.id", order_id)
    span.set_tag("payment.amount", amount)
    # ... lógica
```

### OpenTelemetry — Setup Universal (funciona con Jaeger, Tempo, OTLP)

```python
# otel_setup.py
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.resources import Resource

resource = Resource.create({
    "service.name": "payment-service",
    "service.version": "1.2.3",
    "deployment.environment": "production",
})

# Traces
trace_provider = TracerProvider(resource=resource)
trace_provider.add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter(endpoint="http://otel-collector:4317"))
)
trace.set_tracer_provider(trace_provider)

# Metrics
meter_provider = MeterProvider(resource=resource)
metrics.set_meter_provider(meter_provider)

# Uso
tracer = trace.get_tracer("payment.service")
meter = metrics.get_meter("payment.service")
error_counter = meter.create_counter("payment.errors", unit="1")

with tracer.start_as_current_span("charge-card") as span:
    try:
        result = stripe.charge(amount, card_token)
        span.set_attribute("payment.success", True)
    except stripe.error.CardError as e:
        span.record_exception(e)
        span.set_status(trace.StatusCode.ERROR)
        error_counter.add(1, {"error.type": "card_declined"})
        raise
```

---

## 3. Alertas y Dashboards

### Prometheus — Reglas de Alerta Completas

```yaml
# alerts/application.yml
groups:
  - name: application_errors
    interval: 1m
    rules:
      # Tasa de error HTTP > 5% por 2 minutos
      - alert: HighHttpErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
            /
            sum(rate(http_requests_total[5m])) by (service)
          ) > 0.05
        for: 2m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "Alta tasa de errores en {{ $labels.service }}"
          description: "{{ $value | humanizePercentage }} de requests fallando en los últimos 5 min"
          runbook_url: "https://wiki.empresa.com/runbooks/high-error-rate"
          dashboard_url: "https://grafana.empresa.com/d/xyz?var-service={{ $labels.service }}"

      # Latencia P95 > 2 segundos
      - alert: HighLatencyP95
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
          ) > 2
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "Latencia alta (P95) en {{ $labels.service }}"
          description: "P95 = {{ $value | humanizeDuration }}"

      # Errores no manejados (panic / unhandled exceptions)
      - alert: UnhandledExceptions
        expr: increase(unhandled_exceptions_total[5m]) > 0
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Excepción no manejada en {{ $labels.service }}"
```

### Grafana — Dashboard JSON para Error Rate

```json
{
  "title": "Error Tracking Overview",
  "panels": [
    {
      "title": "Error Rate (5xx)",
      "type": "stat",
      "targets": [{
        "expr": "sum(rate(http_requests_total{status=~'5..'}[5m])) / sum(rate(http_requests_total[5m]))",
        "legendFormat": "Error Rate"
      }],
      "thresholds": {
        "steps": [
          {"color": "green", "value": 0},
          {"color": "yellow", "value": 0.01},
          {"color": "red", "value": 0.05}
        ]
      }
    }
  ]
}
```

---

## 4. Correlation IDs — Trazabilidad entre Servicios

### Middleware Express.js

```typescript
import { v4 as uuidv4 } from "uuid";

export function correlationMiddleware(req, res, next) {
  const traceId = req.headers["x-trace-id"] || uuidv4();
  const spanId = uuidv4().split("-")[0]; // Short ID for span

  // Propagar hacia adelante
  req.traceId = traceId;
  res.setHeader("X-Trace-Id", traceId);

  // Adjuntar al request para logging
  req.log = logger.child({ trace_id: traceId, span_id: spanId });

  next();
}

// Al llamar a servicios externos, propagar el ID
async function callInventoryService(traceId: string, productId: string) {
  return fetch(`${INVENTORY_URL}/product/${productId}`, {
    headers: {
      "X-Trace-Id": traceId, // Propagar trace
      "Content-Type": "application/json",
    },
  });
}
```

---

## 5. Checklist de Validación Pre-Producción

### Validación del Pipeline de Monitoreo

```bash
#!/bin/bash
# validate-monitoring.sh

echo "=== Validando pipeline de monitoreo ==="

# 1. Test de error en Sentry
echo "1. Disparando error de prueba en Sentry..."
curl -X POST "${APP_URL}/api/test/error" \
  -H "X-Test-Error: true" \
  -H "Authorization: Bearer ${TEST_TOKEN}"
echo "   Verifica en: https://sentry.io/organizations/${SENTRY_ORG}/issues/"

# 2. Verificar logs estructurados
echo "2. Verificando formato de logs..."
LOG_SAMPLE=$(docker logs "${SERVICE_NAME}" 2>&1 | tail -1)
echo "${LOG_SAMPLE}" | python3 -c "import sys,json; json.load(sys.stdin)" \
  && echo "   ✅ Logs en formato JSON válido" \
  || echo "   ❌ Logs NO están en formato JSON"

# 3. Verificar métricas Prometheus
echo "3. Verificando endpoint de métricas..."
curl -sf "${APP_URL}/metrics" | grep "http_requests_total" \
  && echo "   ✅ Métricas Prometheus expuestas" \
  || echo "   ❌ Métricas NO disponibles"

# 4. Test de alerta
echo "4. Disparando alerta de prueba..."
curl -X POST "${ALERTMANAGER_URL}/api/v1/alerts" \
  -H "Content-Type: application/json" \
  -d '[{"labels":{"alertname":"TestAlert","severity":"info"},"annotations":{"summary":"Test alert from validate-monitoring.sh"}}]'

echo "=== Validación completada. Revisa dashboards y canales de alerta. ==="
```

---

## 6. Políticas de Retención y Costos

| Dato             | Retención Recomendada | Nota                                      |
|------------------|-----------------------|-------------------------------------------|
| Logs ERROR+      | 90 días               | Reducir a 30 días si hay restricciones    |
| Logs INFO/DEBUG  | 7-14 días             | DEBUG: solo en dev/staging                |
| Traces APM       | 15-30 días            | Sampling 5-10% en producción              |
| Métricas         | 13 meses              | Downsample a 5min después de 7 días       |
| Alertas/eventos  | 1 año                 | Para auditoría y postmortems              |

---

## 7. Runbook Template

```markdown
# Runbook: [Nombre de la Alerta]

## Descripción
Qué significa esta alerta y cuándo se dispara.

## Impacto
- Servicios afectados:
- Usuarios impactados estimados:
- SLA en riesgo: Sí/No

## Diagnóstico Rápido (< 5 minutos)
1. Revisar dashboard: [URL]
2. Verificar logs recientes: `kubectl logs -l app=SERVICE --tail=50`
3. Comprobar dependencias: base de datos, cache, APIs externas

## Remediación
### Si causa A:
  - Acción 1
  - Acción 2

### Si causa B:
  - Acción 1

## Escalación
- Si no se resuelve en 30 min → escalar a [equipo/persona]
- Canal de escalación: #incidentes-criticos

## Post-mortem
- Template: [URL al template de post-mortem]
```
