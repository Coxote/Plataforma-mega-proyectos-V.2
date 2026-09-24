# AUDITORÍA INTEGRAL DE LA PLATAFORMA (SISTEMA DE GESTIÓN DE PROYECTOS Y FASES)

> **Fecha de Auditoría:** 2026-09-22  
> **Versión de Arquitectura:** v5.0 Clean  
> **Tipo de Aplicación:** Plataforma Integral SaaS de Gestión de Proyectos, Fases, Horas y Finanzas

---

## 1. RESUMEN EJECUTIVO Y ARQUITECTURA GENERAL

La plataforma está diseñada como un sistema centralizado de control de operaciones para agencias y equipos creativos/técnicos. Proporciona control de ciclo de vida completo de proyectos (Fases 0 a N), registro y auditoría de horas imputadas, gestión de capacidad de equipo, control de órdenes de venta (OVs), cálculo de Valor Ganado (EVM), simulación predictiva de márgenes, y vinculación inteligente de Brand Bibles con Google Gemini.

### 1.1. Pila Tecnológica
- **Frontend:** React 18+ con TypeScript, Tailwind CSS, Vite.
- **Gráficos e Iconografía:** Lucide React, Recharts y SVGs de precisión matemática para velocímetros y gauges.
- **Motor de Inteligencia Artificial:** `@google/genai` (Gemini 3.6-Flash) para extracción de briefs y Brand Bibles.
- **Persistencia de Datos:** Almacenamiento local persistente (`localStorage`) con llaves versionadas y modelos normalizados tolerantes a esquemas heredados.

---

## 2. ROLES DE USUARIO, TARIFAS Y CONTROL DE ACCESO (RBAC)

La plataforma define **8 roles específicos** con tarifas internas horarias para cálculo de costos directos (`ROLE_HOURLY_RATES`) y niveles de visualización protegidos:

| Rol | Identificador (`role`) | Tarifa Interna | Puesto Típico | Nivel de Acceso y Alcance |
| :--- | :--- | :--- | :--- | :--- |
| **Director Financiero** | `director_financiero` | **$65.00 / h** | Directora Financiera | **Dirección y Finanzas:** Acceso pleno a Salud Financiera, Simulador Predictivo, Clientes, Integraciones, Expedientes de Proyectos y Perfil. |
| **Supervisor** | `supervisor` | **$45.00 / h** | Supervisor de Operaciones | **Dirección y Supervisión:** Acceso a Salud Financiera (consulta), Simulador Predictivo, Clientes, Planer, Línea de Tiempo, Expedientes y Perfil. |
| **Coordinador** | `coordinador` | **$40.00 / h** | Coordinador PM | **Administrador Operativo Total:** Acceso sin restricciones a todas las secciones, asignación de tareas, aprobación de fases, gestión de usuarios y creación de proyectos. |
| **PM / SAC** | `sac` | **$35.50 / h** | Project Manager / Servicio al Cliente | **Operativo Cuentas:** Acceso a Planer Diario, Línea de Tiempo, Expediente de Fase, carga de entregables, anotaciones y registro de horas. |
| **Diseñador** | `contentd` | **$33.19 / h** | Diseñador Gráfico / UI | **Operativo Técnico:** Acceso a Planer Diario, Línea de Tiempo, Checklist de Fases, carga de entregables y registro de horas personales. |
| **Social Media** | `contents` | **$28.11 / h** | Content & Social Media | **Operativo Contenido:** Acceso a Planer Diario, Línea de Tiempo, Checklist de Fases, carga de entregables y registro de horas personales. |
| **Proveedor Externo** | `proveedor` | **$50.00 / h** *(conf.)* | Desarrollador / Especialista Externo | **Restringido:** Solo visualiza proyectos expresamente asignados (`proyectosAsignados`). No tiene acceso al Planer general ni a métricas de rentabilidad. |
| **Invitado / Cliente** | `invitado` | **$0.00 / h** | Cliente / Stakeholder | **Portal Externo:** Redirigido o limitado a la visualización de entregables públicos para revisión, anotaciones y aprobación formal. |

---

## 3. MAPA DE NAVEGACIÓN Y SECCIONES

El sistema divide su navegación en **5 módulos temáticos principales** más el **Portal Externo**:

```
├── 1. OPERACIÓN
│   ├── [1.1] Dashboard Proyectos (CoordinatorDashboard)
│   ├── [1.2] Dashboard Ejecutivo C-Level (ExecutiveDashboard)
│   ├── [1.3] Planer Diario (PlannerGrid)
│   ├── [1.4] Línea de Tiempo (GanttView)
│   └── [1.5] Inspector de Colaborador (UserInspectorPanel)
├── 2. PROYECTO
│   └── [2.1] Expediente del Proyecto (PhaseContent)
│       ├── Pestaña 1: Fases & Checklist
│       ├── Pestaña 2: Ficha & Marca (Gemini IA)
│       └── Pestaña 3: Entregables & Feedback
├── 3. DIRECCIÓN
│   ├── [3.1] Salud Financiera (FinancialDashboard)
│   └── [3.2] Simulador Predictivo (PredictiveAnalyticsPanel)
├── 4. ADMINISTRACIÓN
│   ├── [4.1] Gestión de Equipo (TeamManagement)
│   ├── [4.2] Clientes y Marca IA (ClientsManagement)
│   └── [4.3] Integraciones & Webhooks (IntegrationsPanel)
├── 5. MI ESPACIO
│   └── [5.1] Mi Perfil y Horas (MyProfileView)
└── 6. PORTAL EXTERNO
    └── [6.1] Portal de Cliente (ClientPortal)
```

---

## 4. DETALLE FUNCIONAL Y CONTENIDO POR SECCIÓN

### 4.1. OPERACIÓN: Dashboard de Proyectos (`CoordinatorDashboard`)
* **Acceso:** Exclusivo `coordinador`.
* **Propósito:** Monitor central de proyectos activos, desviaciones de cronograma y finanzas.
* **Componentes clave:**
  1. **Selector y Resumen de Proyectos:** Búsqueda rápida, estado de salud (En Tiempo, Desviado, Crítico) y selección activa.
  2. **Salud Financiera y Control de Alcance (Finanzas & Scope):**
     - **Velocímetro / Gauge Numérico (EAC vs. BAC):** Calibración semicircular elevada neumórfica, escala segmentada (0% a 1%), arco de avance gradual en verde, lectura central de ratio porcentual y etiqueta de diagnóstico (*Acceptable* / *Alert*).
     - **Curva S Financiera (Burn Rate Trend):** Gráfico horizontal de líneas que grafica el Presupuesto Planificado (PV), Costo Real (AC) y Valor Ganado (EV) a lo largo del tiempo.
     - **Volatilidad del Alcance (Scope Creep):** Seguimiento de horas agregadas fuera de línea base y canalización (pipeline) de Solicitudes de Cambio (CRs: Aprobadas, En Revisión, Propuestas).
  3. **Decisiones Pendientes y Acciones Críticas:** Bandeja de bloqueos operativos con botón de notificación a ejecutivos de cuenta.
  4. **Carga y Desempeño del Equipo:** Porcentaje de saturación mensual de horas por colaborador y alertas tempranas de sobrecarga (>100%).

---

### 4.2. OPERACIÓN: Dashboard Ejecutivo C-Level (`ExecutiveDashboard`)
* **Acceso:** `coordinador`, `director_financiero`, `supervisor` (con selector de proyecto e informe descargable).
* **Propósito:** Vista de alto nivel para comités directivos y sponsors de proyecto.
* **Componentes clave:**
  1. **Banda de Ficha Ejecutiva:** Proyecto, fecha de corte en tiempo real, Sponsor institucional y Project Manager a cargo.
  2. **Banda de Estado Ejecutiva (StatBar):** Estado general en control, % de avance vs. planificado, índice de cronograma SPI e índice de costo CPI.
  3. **Línea de Tiempo - Hitos Principales:** Seguimiento mensual (ENE - SEP) con nodos de hito por fase del proyecto.
  4. **Distribución del Avance por Área:** Gráfico circular Donut (`recharts`) segmentado por áreas clave con avance promedio central.
  5. **Matriz de Riesgos Críticos (Top 5):** Tabla de riesgos con impacto, probabilidad, tendencia y acceso directo a RAID Log.
  6. **Resumen de Gobernanza RAID:** Contadores de riesgos críticos, asuntos pendientes (issues), decisiones pendientes y oportunidades.
  7. **Desempeño SPI vs CPI:** Gráfico de evolución temporal de índices de valor ganado comparado contra el benchmark ideal de 1.0.
  8. **Próximos Hitos (60 días):** Tarjetas con fecha límite y entregables asociados en proceso de revisión.
  9. **Decisiones Requeridas de Dirección:** Solicitudes explícitas que requieren resolución C-Level.
  10. **Exportación de Reporte (`ExportReportModal`):** Exportación ejecutiva en PDF y Markdown.

---

### 4.3. OPERACIÓN: Planer Diario (`PlannerGrid`)
* **Acceso:** Roles internos (`coordinador`, `supervisor`, `director_financiero`, `sac`, `contentd`, `contents`).
* **Propósito:** Asignación visual y balanceo de carga diaria y semanal del equipo.
* **Componentes clave:**
  - Selector semanal interactivo con visualización de días hábiles.
  - Celdas de asignación por proyecto y usuario.
  - Indicador de capacidad diaria por colaborador con tope de 8 horas.
  - Filtro por proyecto o vista consolidada de la agencia.

---

### 4.4. OPERACIÓN: Línea de Tiempo (`GanttView`)
* **Acceso:** Roles internos.
* **Propósito:** Carta Gantt interactiva con fases, hitos y cronograma contractual.
* **Componentes clave:**
  - Desglose temporal por fases (Kickoff, Requerimientos, Diseño, Revisión, Cierre).
  - Indicadores visuales de hitos alcanzados, tareas críticas y fechas de vencimiento.
  - Detección de desfases temporales y cuellos de botella.

---

### 4.5. OPERACIÓN: Inspector de Colaborador (`UserInspectorPanel`)
* **Acceso:** Accesible mediante click en cualquier colaborador del equipo.
* **Propósito:** Panel lateral deslizable (Flyout / Drawer) con el perfil integral de desempeño.
* **Componentes clave:**
  - **Ficha de Identidad:** Nombre, rol, correo, teléfono y avatar con halo de estado de conexión.
  - **Métricas de Capacidad Mensual:** Total de horas trabajadas vs. capacidad estándar (176h), porcentaje de ocupación y cálculo de costo devengado en base a su tarifa horaria.
  - **Radar de Habilidades:** Gráfico Radar interactivo (`recharts`) evaluando 5 competencias clave (Velocidad, Calidad, Comunicación, Precisión, Autonomía).
  - **Historial de Proyectos Asignados:** Desglose de horas por proyecto con barras de distribución relativa.
  - **Últimos Registros de Horas:** Lista detallada de imputaciones con tipo de tarea (normal o retrabajo).

---

### 4.6. PROYECTO: Expediente del Proyecto (`PhaseContent`)
* **Acceso:** Todos los roles (adaptado según rol).
* **Propósito:** Centro neurálgico de ejecución de cada proyecto individual.
* **Estructura en 3 pestañas principales:**

#### Pestaña 1: Fases & Checklist
- **Selector de Fase:** Barra horizontal de etapas del proyecto con estado (*En progreso* / *Completada*).
- **Tarjetas KPI Superiores:**
  - *Salud del Proyecto:* Indicador de riesgo y progreso.
  - *Horas Consumidas:* Horas registradas vs. presupuesto vendido.
  - *Costo Actual:* Valor monetizado en USD en base a tarifas por rol.
  - *Retrabajos:* Total de horas de retrabajo diferenciadas por causa raíz (Cliente, Interno, Proveedor).
- **Checklist Operativo de Fase:**
  - Tareas con checkbox interactivo.
  - Registro de hitos, fechas y lecciones aprendidas por tarea.
  - Botón de **Finalizar Fase** con candado de validación (requiere 100% o excepción autorizada).
  - Descarga de la fase en archivo Markdown (`.md`).

#### Pestaña 2: Ficha & Marca (IA)
- **Sub-pestaña Brand Bible:**
  - Conector inteligente con **Gemini 3.6-Flash**. Permite ingresar un brief o notas de cliente y extrae de forma automática:
    - *Fundamentos:* Misión, visión, propuesta de valor (UVP).
    - *Posicionamiento:* Arquetipo de marca, público objetivo.
    - *Voz y Tono:* Rasgos de personalidad, qué hacer y qué evitar.
    - *Identidad Visual:* Paleta Hexagonal, reglas de logotipo, enlaces a Drive y Figma.
- **Sub-pestaña Perfil General (`PerfilGeneral`):**
  - Ficha técnica: Cliente, contacto, teléfono, correo, fechas clave y descripción comercial.

#### Pestaña 3: Entregables & Feedback
- **Formulario de Publicación:** Título, tipo de recurso (Video, Audio, PDF, Word, Imagen, Markdown, Link) y toggle de visibilidad para el cliente.
- **Historial de Entregables:** Estados (Pendiente, En Revisión, Aprobado, Requiere Corrección).
- **Feedback y Anotaciones:** Hilos de discusión bidireccionales con resolución de observaciones.
- **Bitácora de Decisiones (`decisionLog`) y Matriz RACI (`RaciMatrix`):** Registro formal de aprobaciones de alcance, diseño y acuerdos de proyecto.

---

### 4.7. DIRECCIÓN: Salud Financiera (`FinancialDashboard`)
* **Acceso:** `coordinador`, `director_financiero`, `supervisor`.
* **Propósito:** Análisis de rentabilidad real, márgenes operativos y facturación.
* **Componentes clave:**
  - **Métricas Globales:** Facturación total (Ingresos), Costo devengado por roles y Margen de Utilidad Bruta (%).
  - **Gestor de Órdenes de Venta (Multi-OV):** Múltiples OVs por proyecto con monto, moneda (USD / GTQ), horas asociadas y estado.
  - **Costo Real por Rol:** Tabla de horas consumidas multiplicadas por la tarifa oficial de cada colaborador.
  - **Métricas de Valor Ganado (EVM):** BAC (Presupuesto al cierre), EAC (Estimación al cierre), CPI y SPI.

---

### 4.8. DIRECCIÓN: Simulador Predictivo (`PredictiveAnalyticsPanel`)
* **Acceso:** `coordinador`, `director_financiero`, `supervisor`.
* **Propósito:** Análisis de escenarios hipotéticos (What-If) para prever desviaciones financieras.
* **Componentes clave:**
  - Controles deslizantes (Sliders) para:
    - Incremento esperado de retrabajos (0% a 50%).
    - Variación en tarifas horarias de personal.
    - Días de desvío en plazos pactados (SLA).
    - Fondo de reserva para contingencias.
  - Resultados proyectados en tiempo real: Nuevo costo proyectado, impacto directo en margen bruto y recomendación de emisión de nueva OV correctiva.

---

### 4.9. ADMINISTRACIÓN: Gestión de Equipo (`TeamManagement`)
* **Acceso:** Exclusivo `coordinador`.
* **Propósito:** Control de plantilla, roles, capacidades y estados de colaboradores.
* **Componentes clave:**
  - Listado de usuarios con avatar, cargo, rol y credenciales.
  - Capacidad mensual configurable (estándar: 176 horas mensuales).
  - Medidor de ocupación (% asignado vs. horas reales registradas).
  - Acciones: Agregar usuario, editar datos, alternar estado (activo / inactivo) o eliminar.

---

### 4.10. ADMINISTRACIÓN: Clientes y Marca IA (`ClientsManagement`)
* **Acceso:** `coordinador`, `director_financiero`, `supervisor`.
* **Propósito:** Directorio unificado de empresas cliente y relación contractual.
* **Componentes clave:**
  - Lista de clientes comerciales con categoría, contacto principal, correo y teléfono.
  - Proyectos vinculados a cada cuenta.
  - Creación de nuevos clientes y vinculación directa a plantillas de marca.

---

### 4.11. ADMINISTRACIÓN: Integraciones & Webhooks (`IntegrationsPanel`)
* **Acceso:** `coordinador`, `director_financiero`.
* **Propósito:** Enlaces con sistemas externos y automatizaciones disparadas por eventos.
* **Componentes clave:**
  - **Conectores Empresariales:** Odoo ERP (sincronización de OVs y partes de tiempo), Microsoft Teams, SharePoint y Outlook.
  - **Reglas de Automatización (`AutomationRules`):** Disparadores cuando una fase se completa, cuando un entregable entra en retrabajo o ante vencimiento de SLAs.
  - **Monitor de Webhooks:** Registro de llamadas HTTP salientes con código de estado, latencia y payload JSON de prueba.

---

### 4.12. MI ESPACIO: Mi Perfil y Horas (`MyProfileView`)
* **Acceso:** Todos los usuarios autenticados.
* **Propósito:** Panel individual de control de horas trabajadas y rendimiento personal.
* **Componentes clave:**
  - Total de horas registradas en el día, semana y mes.
  - Barra de cumplimiento contra la meta diaria (8 horas).
  - Desglose cronológico de partes de horas con proyecto, fase y tipo (normal / retrabajo).
  - Configuración de preferencias y gestión de ausencias o permisos (`UserLeave`).

---

### 4.13. PORTAL EXTERNO: Portal de Cliente (`ClientPortal`)
* **Acceso:** Exclusivo `invitado`.
* **Propósito:** Experiencia transparente y aislada para clientes sin acceso a finanzas ni checklists internos.
* **Componentes clave:**
  - Catálogo de entregables marcados como públicos.
  - Descarga y visualización directa de recursos multimedia.
  - Caja de comentarios y feedback por entregable.

---

## 5. MODALES Y HERRAMIENTAS GLOBALES

1. **Registro Rápido de Horas (`GlobalLogTimeModal`):** Disponible en la barra de navegación superior. Permite imputar horas a cualquier proyecto y fase activa, especificando si corresponde a trabajo normal o retrabajo (y su causa: cliente, interno o proveedor).
2. **Asistente IA Flotante (`AIAssistantModal`):** Chat contextual alimentado con la información del proyecto para formular consultas operativas o de alcance.
3. **Asistente de Nuevo Proyecto (`NewProjectWizard`):** Formulario guiado que configura cliente, tipo de servicio, presupuesto de horas, fechas y plantilla de fases recomendada.
4. **Onboarding Guiado (`OnboardingModal`):** Ventana de configuración inicial para nuevos usuarios (proyectos prioritarios y vistas predeterminadas).
5. **Selector de Disponibilidad (Status Halo):** Selector en avatar con 3 estados: *En línea* (halo verde), *Ausente* (halo amarillo) y *No molestar* (halo rojo).

---

## 6. MATRIZ DE PERMISOS (RBAC SUMMARY)

| Sección / Acción | `coordinador` | `director_financiero` | `supervisor` | `sac` | `contentd` / `contents` | `proveedor` | `invitado` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dashboard Proyectos** | **Total** | Solo lectura | Solo lectura | — | — | — | — |
| **Planer Diario** | **Total** | Consulta | Consulta | **Total** | **Total** | — | — |
| **Línea de Tiempo (Gantt)** | **Total** | Consulta | Consulta | **Total** | **Total** | — | — |
| **Expediente de Fase** | **Total** | Consulta | Consulta | **Total** | Solo tareas | Solo asignados | — |
| **Finalizar Fases** | **Sí** | — | — | Requiere VoBo | — | — | — |
| **Salud Financiera & OVs** | **Total** | **Total** | Consulta | — | — | — | — |
| **Simulador Predictivo** | **Total** | **Total** | Consulta | — | — | — | — |
| **Gestión de Equipo** | **Total** | Consulta | — | — | — | — | — |
| **Clientes** | **Total** | **Total** | Consulta | — | — | — | — |
| **Integraciones** | **Total** | **Total** | — | — | — | — | — |
| **Registro de Horas** | **Sí** | **Sí** | **Sí** | **Sí** | **Sí** | Proyectos asignados | — |
| **Portal de Cliente** | — | — | — | — | — | — | **Exclusivo** |

---

## 7. PERSISTENCIA Y MODELOS DE DATOS

Todos los estados se administran de forma reactiva y se respaldan en el almacenamiento local del cliente (`localStorage`):

* `saas_phase_system_projects_v5`: Arreglo de proyectos, fases, checklists, presupuestos por rol, entregables, bitácora de auditoría y OVs.
* `saas_phase_system_users_list_v5`: Catálogo de usuarios, roles, cargos, tarifas de proveedor y capacidades mensuales.
* `saas_phase_system_clients_v5`: Registro de clientes comerciales y contactos.
* `saas_phase_system_active_project_v5`: Identificador del proyecto activo en el espacio de trabajo.
* `saas_phase_system_pinned_projects_v2`: Lista de IDs de proyectos anclados por el usuario.
* `saas_user_platform_status_v1`: Estado de disponibilidad del usuario (`en_linea`, `ausente`, `no_molestar`).

---

## 8. SISTEMA DE DISEÑO UI/UX ("WARM CANVAS") & NORMAS DE CODIFICACIÓN

La interfaz ha sido refactorizada bajo los estándares de diseño y accesibilidad de alta gama:

1. **Lienzo y Atmósfera de Fondo (Warm Canvas):**
   - Color base global del lienzo: Tono crema cálido natural `#F4F5F0` (`bg-[#F4F5F0]` / `bg-stone-50`), reduciendo la fatiga visual de los fondos blancos crudos o grises fríos.
2. **Superficie de Tarjetas y Contenedores:**
   - Fondo blanco puro contrastado (`bg-white`).
   - Radio de curvatura generoso y moderno (`rounded-3xl` en tarjetas principales y paneles; `rounded-2xl` en módulos internos).
   - Eliminación total de bordes duros (`border-slate-200`, `border-gray-200`), reemplazados por sombras sutiles y naturales (`shadow-xs` / `shadow-2xs`).
3. **Control de Codificación Estricta (UTF-8 Puro):**
   - Sanitización al 100% de caracteres rotos (mojibake) en todos los componentes del sistema (sustitución garantizada de tildes, eñes, guiones tipográficos `—`, flechas `↗`, `↘`, `➔` y viñetas `●`).
4. **Respeto de Lógica y Estado:**
   - La arquitectura reactiva, persistencia en `localStorage`, cálculo de Valor Ganado (EVM), integración con Gemini y reglas de negocio permanecen completamente intactas.

