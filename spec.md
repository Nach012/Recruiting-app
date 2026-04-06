Especificación Técnica: Conectō Recruiting (MVP Gestor)
1. Visión General
Plataforma ágil B2B para centralizar y organizar los procesos de selección. El objetivo es eliminar el uso de hojas de cálculo y estandarizar el flujo de los candidatos preseleccionados.

2. Usuarios del Sistema
Recruiters: Perfil único. Gestionan el ciclo completo de candidatos.

3. Funcionalidades Core (MVP Iteración 3)
A. Pipeline Visual (Kanban Extendido)
- Nuevas Columnas (Orden Estricto):
    1. Preseleccionados (Estilo "Drop Zone" destacado).
    2. Contactados.
    3. Entrevista (Consultora).
    4. Entrevista Técnica (Cliente).
    5. Estudios Preocupacionales.
    6. Oferta.
    7. Contratados.
    8. Descartados.
- Arrastrar y Soltar: Actualiza el estado y persiste en LocalStorage.

B. Lógica de Descarte (Interceptor)
- Interceptor de Movimiento: Al mover un candidato a "Descartados", se dispara un modal de feedback.
- Modal de Feedback: Captura obligatorio:
    - Instancia de descarte: (Primer contacto, Primera entrevista, Técnica, etc.).
    - Motivo: Texto libre detallando el porqué.
- Confirmación/Cancelación: Si se cancela, el candidato vuelve a su estado anterior.
- Almacenamiento: La información de descarte se guarda dentro del registro del candidato.

C. Gestión de Candidatos
- Visualización de Motivo de Descarte: En la ficha del candidato descartado se debe ver el feedback.
- Resto de funciones de la Iteración 2 (Edición, Tags, etc.) se mantienen.

4. Persistencia de Datos (LocalStorage / Mock Mode)
- Estructura extendida para soportar metadatos de descarte.
