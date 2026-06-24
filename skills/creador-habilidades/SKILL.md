---
name: creador-habilidades
description: Permite al agente crear nuevas habilidades estructuradas para Antigravity en la ruta especificada. Úsalo cuando el usuario te pida crear o estructurar una nueva habilidad.
---

# Creador de Habilidades

Esta habilidad permite la creación, estructuración y estandarización de nuevas habilidades para Google Antigravity en español. El objetivo es automatizar la generación del archivo `SKILL.md`, la carpeta de la habilidad y sus carpetas auxiliares (`scripts/`, `examples/`, `resources/`) en la ruta global de habilidades del usuario.

## Cuándo usar esta habilidad

- Usa esta habilidad cuando el usuario te pida crear una nueva habilidad (e.g., "crea una habilidad para revisar bases de datos", "genera una habilidad de traducción").
- Úsala para asegurar que todas las nuevas habilidades sigan rigurosamente las pautas oficiales de Google Antigravity y mantengan una estructura limpia y profesional en español.

## Ruta Base de Almacenamiento

Por defecto, todas las habilidades creadas por esta herramienta se guardarán en:
`C:\Users\bryan\Documents\Gemini-Proyectos\skills\`

## Cómo usarla (Instrucciones para el Agente)

Cuando se te solicite crear una nueva habilidad, sigue este proceso paso a paso:

### Paso 1: Recopilación de Requisitos
Pregunta al usuario (o infiere a partir de su solicitud) lo siguiente:
1. **Nombre de la habilidad**: Debe ser representativo, en minúsculas y separado por guiones (ej. `analisis-datos`).
2. **Descripción clara**: Debe explicar de forma concisa qué hace la habilidad y cuándo el agente debe activarla.
3. **Objetivos y Reglas**: Qué instrucciones detalladas, reglas o mejores prácticas debe seguir el agente al ejecutar esa habilidad.
4. **Recursos adicionales**: Si requiere scripts de apoyo (`scripts/`), ejemplos de código (`examples/`) o plantillas (`resources/`).

### Paso 2: Creación de la Estructura de Directorios
Crea la carpeta de la nueva habilidad dentro de la ruta base:
`C:\Users\bryan\Documents\Gemini-Proyectos\skills\<nombre-habilidad>/`

Opcionalmente, crea las siguientes subcarpetas si son necesarias:
- `scripts/`
- `examples/`
- `resources/`

### Paso 3: Generación del archivo `SKILL.md`
Crea el archivo `SKILL.md` dentro de la carpeta de la habilidad. Este archivo debe tener obligatoriamente el siguiente formato con YAML frontmatter al principio:

```markdown
---
name: <nombre-habilidad>
description: <Breve descripción en español de cuándo usar y qué hace>
---

# <Nombre Formateado de la Habilidad>

<Introducción y descripción detallada del propósito de la habilidad.>

## Cuándo usar esta habilidad

- Use esta habilidad cuando...
- Es útil para...
- No usar cuando...

## Cómo usarla

<Instrucciones paso a paso y flujos de trabajo que el agente debe seguir.>

## Reglas y Directrices

- <Regla 1>
- <Regla 2>

## Ejemplos

<Ejemplos de interacción, entradas y salidas esperadas.>
```

### Paso 4: Creación de Scripts de Apoyo (Opcional)
Si la habilidad requiere herramientas automatizadas, crea los scripts correspondientes en la carpeta `scripts/` (generalmente en Python o JavaScript) y documéntalos claramente en el `SKILL.md` de la nueva habilidad como "cajas negras" con sus entradas y salidas.

---

## Script Automatizado de Creación

Para facilitar este trabajo, esta habilidad incluye un script de automatización en Python ubicado en `scripts/crear_habilidad.py`. Puedes ejecutarlo para generar la estructura básica de forma instantánea.

### Uso del Script:
```powershell
python C:\Users\bryan\Documents\Gemini-Proyectos\skills\creador-habilidades\scripts\crear_habilidad.py --name "nombre-habilidad" --desc "Descripcion de la habilidad"
```
