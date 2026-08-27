# Sidebar — Estado actual y roadmap de módulos

> Mapa completo del sidebar: qué existe hoy (post `simplify-sidebar-navigation`) y qué
> módulos futuros se suman, uno por uno, solo cuando cada uno tenga backend/contrato real
> detrás — nunca como placeholder.

## Esquema completo

```mermaid
flowchart TD
    Sidebar["Sidebar"]

    Sidebar --> Dashboard["📊 Dashboard<br/><i>existe</i>"]

    Sidebar --> Agents["🤖 Agents<br/><i>futuro</i>"]
    Agents --> AgentsCatalog["Catálogo<br/>(lista, estado, config)"]
    Agents --> AgentsRuns["Ejecuciones<br/>(runs activos/históricos)"]

    Sidebar --> Workflows["🔀 Workflows<br/><i>futuro</i>"]
    Workflows --> WorkflowsCatalog["Definiciones"]
    Workflows --> WorkflowsRuns["Ejecuciones"]

    Sidebar --> Tools["🛠️ Tools<br/><i>futuro</i>"]
    Tools --> ToolsCatalog["Catálogo de tools"]
    Tools --> ToolsScopes["Scopes por agente"]

    Sidebar --> ModelProviders["🧠 Model Providers<br/><i>futuro</i>"]

    Sidebar --> Memory["💾 Context & Memory<br/><i>futuro</i>"]

    Sidebar --> Observability["📈 Observability<br/><i>futuro</i>"]
    Observability --> ObsTraces["Trazas / eventos"]
    Observability --> ObsEvals["Evaluaciones"]

    Sidebar --> Users["👤 Users<br/><i>existe</i>"]
    Users --> UsersList["Lista"]
    Users --> UsersDetail["Detalle"]

    Sidebar --> RolesPerms["🔐 Roles & Permissions<br/><i>existe</i><br/>(+ aprobaciones humanas, futuro)"]

    classDef existing fill:#123524,stroke:#2ecc71,color:#eafaf1
    classDef future fill:#2a2a3d,stroke:#7f8fa6,color:#dcdde1,stroke-dasharray: 4 3

    class Dashboard,Users,UsersList,UsersDetail,RolesPerms existing
    class Agents,AgentsCatalog,AgentsRuns,Workflows,WorkflowsCatalog,WorkflowsRuns,Tools,ToolsCatalog,ToolsScopes,ModelProviders,Memory,Observability,ObsTraces,ObsEvals future
```

**Leyenda:** verde sólido = existe hoy (post-cutover de `simplify-sidebar-navigation`).
Gris punteado = módulo futuro, entra solo cuando su contrato tenga adapter real detrás.

## Detalle por módulo

| # | Módulo | Estado | Ruta base | Capability OpenSpec | Contrato(s) que cubre | HADES primitive |
|---|---|---|---|---|---|---|
| 1 | Dashboard | ✅ Existe | `/dashboards/analytics` | `dashboard` *(implícito, sin spec propio aún)* | — | — |
| 2 | Agents | 🔲 Futuro | `/agents` | `agents` | Agent Contract, Agent Runtime Contract | Actor / Agent Runtime |
| 3 | Workflows | 🔲 Futuro | `/workflows` | `workflows` | Workflow Contract | Workflow Engine |
| 4 | Tools | 🔲 Futuro | `/tools` | `tools` | Tool Contract, Tool Execution Contract, Capability Contract | Tool/Capability Plane |
| 5 | Model Providers | 🔲 Futuro | `/model-providers` | `model-providers` | Model Provider Contract | Model Gateway |
| 6 | Context & Memory | 🔲 Futuro | `/memory` | `memory` | Context Contract, Memory Contract | CRANE |
| 7 | Observability | 🔲 Futuro | `/observability` | `observability` | Event Contract, Telemetry Contract, Evaluation Contract | LENS |
| 8 | Users | ✅ Existe | `/apps/user/list` | `auth` | Identity Contract | — |
| 9 | Roles & Permissions | ✅ Existe | `/apps/roles`, `/apps/permissions` | `auth` | Policy Contract *(+ Human Interaction Contract, futuro — como nuevo tipo de regla, no módulo aparte)* | — |

**HADES primitive:** referencia cruzada al primitive/contrato correspondiente en la arquitectura
HADES externa (ver `openspec/specs/hades-vocabulary-mapping/spec.md`). Es solo un
nombre-objetivo para cuando ese módulo se implemente contra un backend HADES-aligned — no
implica que el módulo, su contrato o su backend ya existan; el estado real de cada módulo sigue
siendo el de la columna "Estado" de esta tabla.

**Nota de alcance:** este mapeo no convierte a nimrod en el Mission Control canónico de HADES.
nimrod es la UI de control-plane de la célula Leadsales (Design Partner Cell) sobre `rumbor-core`
— ver `openspec/changes/archive/2026-08-25-migrate-better-auth/proposal.md`. El mapeo solo evita
que cada módulo futuro invente un nombre de contrato independiente cuando su backend termine
siendo HADES-aligned.

## Orden de entrada (dependencias funcionales, no jerarquía de sidebar)

Todos son grupos **hermanos** en el sidebar (ver esquema arriba) — este diagrama solo dice
qué debe tener backend real antes de que el siguiente tenga sentido, no quién contiene a
quién. Ej.: "Agents depende de Auth" significa que un agente necesita una identidad/rol
que lo autorice, no que "Agents" viva dentro del grupo "Users".

```mermaid
flowchart LR
    Auth["Users / Roles & Permissions<br/>(existe)"] -. "requisito de" .-> Agents2["Agents"]
    Agents2 -. "requisito de" .-> Tools2["Tools"]
    Agents2 -. "requisito de" .-> ModelP2["Model Providers"]
    Agents2 -. "requisito de" .-> Workflows2["Workflows"]
    Tools2 -. "requisito de" .-> Workflows2
    Agents2 -. "requisito de" .-> Observability2["Observability"]
    Tools2 -. "requisito de" .-> Observability2
    Workflows2 -. "requisito de" .-> Observability2
    Agents2 -. "requisito de" .-> Memory2["Context & Memory"]
```

`Agents` es el primer módulo nuevo viable (depende solo de auth, ya resuelto).
`Observability` va último — necesita ejecución real de agentes/tools/workflows para tener
algo que trazar.

## Regla de entrada (sin excepción)

Un módulo entra al sidebar cuando:

1. Su contrato (familia de la tabla) tiene un adapter concreto real implementado detrás
   (intercambiable, nunca nombrado en la UI/rutas/config — mismo patrón que ya usa hoy el
   adapter de identidad de este repo).
2. Tiene su propia capability en `openspec/specs/<módulo>/spec.md`, con su propio ciclo de
   proposal → design → approval-gate → implementación, igual que `auth`.
3. Nunca se agrega nav apuntando a una página vacía o "coming soon" — viola el contrato de
   entrega de este repo (`AGENTS.md`: no placeholders, no stubs).

Los nombres de módulo/ruta son de dominio (`agents`, `tools`, `observability`), nunca de
proveedor o framework concreto — mantiene el sidebar agnóstico de qué implementación hay
detrás.
