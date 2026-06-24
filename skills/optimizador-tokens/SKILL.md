---
name: optimizador-tokens
description: Ayuda con la optimización de uso de tokens manteniendo la máxima eficiencia y precisión en los resultados. Úsalo cuando el contexto es demasiado grande o cuando se necesite optimizar las respuestas.
---

# Optimizador de Tokens

Esta habilidad proporciona técnicas, patrones y directrices para minimizar el uso de tokens (tanto de entrada como de salida) garantizando que la precisión, claridad y utilidad de las respuestas del agente no se vean comprometidas.

## Cuándo usar esta habilidad

- Cuando estés trabajando con bases de código muy grandes y el contexto amenace con exceder la ventana de tokens.
- Cuando el usuario te pida explícitamente "optimizar tokens", "ser más breve", "reducir el tamaño de la respuesta".
- Al procesar registros (logs) gigantescos, volcados de memoria, o respuestas muy largas de la terminal.
- Al planificar múltiples llamadas a herramientas y necesites enviar la menor cantidad de tokens posible.

## Cómo usarla

Aplica las siguientes estrategias sistemáticamente:

### 1. Minimizar las Salidas (Tokens de Salida)
- **Evitar re-escribir el código sin cambios**: Al usar herramientas de edición de archivos, evita reemplazar funciones o bloques de código enteros si solo cambian unas pocas líneas. Usa `multi_replace_file_content` o modificaciones precisas en lugar de reescribir todo el archivo.
- **No repetir contenido innecesario**: Si vas a citar un error, un log o el contenido de un archivo, no lo imprimas completo de vuelta en tu respuesta de texto. Haz referencia a los números de línea o usa resúmenes.
- **Respuestas directas**: Elimina frases de relleno como "Aquí tienes el código...", "A continuación presento la solución...", "Espero que esto ayude". Ve directo al grano.

### 2. Optimizar el Contexto (Tokens de Entrada)
- **Uso preciso de herramientas de búsqueda**: En vez de leer archivos enteros (`view_file` sin límites), usa búsquedas de expresiones regulares o utilidades como `grep_search` para encontrar solo las líneas relevantes.
- **Limitar la salida de la terminal**: Cuando ejecutes comandos en bash, añade flags que limiten la salida. Por ejemplo, en vez de `git log`, usa `git log -n 5`. En lugar de `cat archivo.log`, usa `tail -n 50 archivo.log` o redirige la salida y procesa solo lo esencial.
- **Evitar lecturas redundantes**: Si ya has analizado un archivo y tienes la información en tu memoria temporal o en un resumen previo, no lo vuelvas a leer completo, a menos que haya sido modificado externamente.

### 3. Técnicas Avanzadas de Compresión de Código
Si tienes que enviar snippets de código en texto (no a través de las herramientas de escritura directa de archivos):
- Elimina comentarios innecesarios, espacios en blanco superfluos y saltos de línea extra si el lenguaje lo permite sin perder legibilidad estricta.
- Muestra únicamente la "firma" o la declaración de la función para el contexto, usando elipses `...` para omitir el cuerpo si este no es relevante para la conversación.

## Reglas Obligatorias (Strict Guidelines)

1. **Eficiencia por encima de la cortesía**: Es preferible una respuesta de una sola frase que solucione el problema, a un párrafo bien redactado.
2. **Priorizar el Diff**: Cuando muestres código al usuario, usa el formato de `diff` estándar solo con las líneas de adición/sustracción más 2-3 líneas de contexto.
3. **Truncamiento activo**: Acostúmbrate a utilizar truncamientos lógicos para datos voluminosos: `[... 500 líneas omitidas ...]`.

## Ejemplos

### Mal Uso (Gasta Tokens):
```markdown
¡Claro! He encontrado el problema en tu archivo `app.js`. Aquí tienes el archivo completo con el cambio en la línea 45:
(Impresión de 200 líneas de código).
```

### Buen Uso (Optimizado):
```markdown
Problema resuelto en `app.js` (Línea 45). Reemplacé `let a = 1;` por `const a = 1;`.
```
