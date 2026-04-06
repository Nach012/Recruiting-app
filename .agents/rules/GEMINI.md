# 🛡️ REGLAS DE GOBERNANZA: GEMINI

Este documento establece la "Constitución" técnica y operativa para el desarrollo del ecosistema Conecto.

## 1. Stack Tecnológico (Core)
- **Frontend:** React 19.2.0 + Vite 7.2.4 (ESM).
- **Lenguaje:** TypeScript ~5.9.3 (Strict Mode obligatorio).
- **Estilos:** Tailwind CSS 3.4.17 + PostCSS 8.
- **Backend:** Firebase v12.11.0 (Firestore como Single Source of Truth).
- **Gestión de Estado:** Context API + Custom Hooks.

## 2. Protocolos de Seguridad y Operación (AGENT MODE: STRICT)
- ⚠️ **Permisos de Terminal:** El agente DEBE pedir permiso explícito antes de ejecutar cualquier comando en la terminal (run_command) que tenga efectos secundarios o modifique el sistema.
- 🔐 **Variables de Entorno:** Nunca subir archivos `.env` o `.env.local`. El `.gitignore` debe proteger estos secretos.
- ⚡ **Acceso a Datos:** Toda interacción con la base de datos debe realizarse a través de la capa de `services/`.

## 3. Identidad Visual & Design Tokens
### Colores
- `brand-blue-primary`: `#2e509e` (Primario)
- `brand-blue-dark`: `#182643` (Fondo/Texto Dark)
- `brand-sky`: `#89c0df` (Acento Cielo)
- `brand-lime`: `#dbde5c` (Acento Lima)

### Tipografía
- **Display:** `Funnel Display` (Headers)
- **Body:** `Inter Tight` (Texto base)

## 4. Arquitectura de Carpetas
- `src/components/ui/`: Componentes atómicos (botones, inputs, cards).
- `src/components/recruiting/`: Componentes de dominio (Pipeline, CandidateCard).
- `src/context/`: Providers de React.
- `src/hooks/`: Lógica reutilizable.
- `src/services/`: Lógica de integración (Firebase/API).
- `src/types/`: Interfaces y tipos de TS.
- `src/utils/`: Funciones puras de cálculo y formateo.

---
*Confirmación: He asimilado la Constitución y estoy listo para la primera Spec.*
