import os
import argparse
import re
from pathlib import Path

def validate_name(name):
    # Validar que el nombre de la habilidad solo contenga letras minúsculas, números y guiones
    if not re.match(r'^[a-z0-9\-]+$', name):
        raise ValueError("El nombre de la habilidad debe contener solo letras minúsculas, números y guiones (ej. 'mi-habilidad').")
    return name

def main():
    parser = argparse.ArgumentParser(description="Script para automatizar la creación de habilidades en Antigravity.")
    parser.add_argument("-n", "--name", required=True, type=validate_name, help="Nombre de la habilidad (ej: analisis-datos)")
    parser.add_argument("-d", "--desc", required=True, help="Descripción breve del propósito de la habilidad")
    
    args = parser.parse_args()
    
    base_path = Path(r"C:\Users\bryan\Documents\Gemini-Proyectos\skills")
    skill_path = base_path / args.name
    
    print(f"Creando la habilidad '{args.name}' en {skill_path}...")
    
    try:
        # Crear estructura de carpetas
        os.makedirs(skill_path, exist_ok=True)
        os.makedirs(skill_path / "scripts", exist_ok=True)
        os.makedirs(skill_path / "examples", exist_ok=True)
        os.makedirs(skill_path / "resources", exist_ok=True)
        
        # Crear archivo SKILL.md
        skill_md_content = f"""---
name: {args.name}
description: {args.desc}
---

# {args.name.replace('-', ' ').title()}

Escribe una introducción detallada sobre qué hace esta habilidad.

## Cuándo usar esta habilidad

- Use esta habilidad cuando...
- Es útil para...
- No usar cuando...

## Cómo usarla

Describe paso a paso cómo el agente debe ejecutar esta habilidad, las directrices y reglas a seguir.

## Ejemplos

Proporciona ejemplos de uso de esta habilidad.
"""
        
        skill_md_path = skill_path / "SKILL.md"
        with open(skill_md_path, "w", encoding="utf-8") as f:
            f.write(skill_md_content)
            
        print(f"¡Habilidad '{args.name}' creada exitosamente!")
        print(f"Archivos creados:")
        print(f" - {skill_md_path}")
        print(f" - {skill_path / 'scripts'}")
        print(f" - {skill_path / 'examples'}")
        print(f" - {skill_path / 'resources'}")
        
    except Exception as e:
        print(f"Error al crear la habilidad: {e}")

if __name__ == "__main__":
    main()
