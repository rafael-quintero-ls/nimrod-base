# Arquitectura del Ecosistema Agéntico Abierto

> Big picture de un estándar abierto para productos agénticos: contratos, protocolos y
> capas que cualquier implementación puede consumir. Agnóstico de framework, modelo,
> storage, observabilidad e infraestructura — ninguna tecnología concreta es dependencia
> obligatoria del estándar.

## 1. Dirección de dependencia (regla central)

Las aplicaciones dependen de adapters; los adapters dependen de contratos abiertos —
nunca al revés. Un contrato abierto nunca requiere ni asume una aplicación concreta.

```mermaid
flowchart LR
    App["Aplicación<br/>(cualquier producto agéntico)"]
    Adapter["Adapter / Implementación concreta<br/>(intercambiable)"]
    Contract["Contrato Abierto<br/>(estable, agnóstico de tecnología)"]

    App --> Adapter --> Contract

    NoWay["✗ Un Contrato Abierto NUNCA<br/>depende de una aplicación concreta"]
    style NoWay fill:#3a1414,stroke:#c0392b,color:#e74c3c
```

**Regla de prueba:** cualquier aplicación concreta debe poder desaparecer del diagrama del
estándar y este debe seguir teniendo sentido por sí solo.

## 2. Familias de contratos

El activo principal no es una implementación — es un **modelo común de
interoperabilidad**. Familias candidatas (nombres y límites no son API estable todavía;
emergen de experimentos y evidencia):

```mermaid
flowchart TD
    subgraph runtime["Ejecución"]
        AgentC["Agent Contract"]
        RuntimeC["Agent Runtime Contract"]
        WorkflowC["Workflow Contract"]
    end

    subgraph access["Acceso y capacidad"]
        ToolC["Tool Contract"]
        ToolExecC["Tool Execution Contract"]
        CapC["Capability Contract"]
        ModelC["Model Provider Contract"]
    end

    subgraph state["Contexto y memoria"]
        ContextC["Context Contract"]
        MemoryC["Memory Contract"]
    end

    subgraph control["Gobernanza y control humano"]
        PolicyC["Policy Contract"]
        IdentityC["Identity Contract"]
        HumanC["Human Interaction Contract"]
    end

    subgraph obs["Observabilidad"]
        EventC["Event Contract"]
        TelemetryC["Telemetry Contract"]
        EvalC["Evaluation Contract"]
    end

    runtime --> access --> state
    control -.-> runtime
    control -.-> access
    obs -.-> runtime
    obs -.-> access
```

## 3. Contratos vs. implementaciones intercambiables

Una tecnología concreta puede adoptarse como **implementación de referencia** para
acelerar experimentos, sin volverse dependencia obligatoria del contrato:

```mermaid
flowchart LR
    RuntimeC["Agent Runtime Contract"]
    RuntimeC -.-> R1["Runtime A"]
    RuntimeC -.-> R2["Runtime B"]
    RuntimeC -.-> R3["Runtime C"]

    ModelC["Model Provider Contract"]
    ModelC -.-> M1["Proveedor 1"]
    ModelC -.-> M2["Proveedor 2"]
    ModelC -.-> M3["Modelo local"]

    ObsC["Telemetry Contract"]
    ObsC -.-> O1["Collector A"]
    ObsC -.-> O2["Collector B"]

    MemC["Memory Contract"]
    MemC -.-> S1["Storage relacional"]
    MemC -.-> S2["Storage clave-valor"]
    MemC -.-> S3["Vector store"]

    ToolC["Tool Contract"]
    ToolC -.-> T1["HTTP"]
    ToolC -.-> T2["Protocolo de tools estándar"]
```

El contrato permanece estable aunque la implementación de referencia por debajo cambie.

## 4. De problema real a contrato

```mermaid
flowchart LR
    P["Problema real"] --> E["Experimento"] --> C["Contrato genérico"]
    C --> I["Implementación de referencia"] --> V["Validación real"] --> Ev["Evidencia"] --> D["Decisión"]
```

La pregunta que importa no es solo "¿funciona esta tecnología?", sino "¿definimos
correctamente el contrato que permitiría sustituirla?".

## 5. Pipeline de nuevas ideas

```mermaid
flowchart LR
    Idea["Idea"] --> Backlog["Research Backlog"]
    Backlog --> Spike["Spike / Experimento"]
    Spike --> Evidence["Evidencia"]
    Evidence --> Class{"Clasificación"}

    Class -->|"utilidad independiente,<br/>contrato estable"| OSSc["Estándar Abierto"]
    Class -->|"prometedora,<br/>sin evidencia suficiente"| Researchc["Research"]
    Class -->|"no viable"| Discardc["Pause / Discard"]
```

## 6. Criterios para que una capacidad entre al estándar

```mermaid
flowchart TD
    C1["¿Tiene utilidad independiente?"]
    C2["¿Es implementable con<br/>más de una tecnología razonable?"]
    C3["¿Su contrato permanece estable<br/>aunque cambie la implementación?"]
    C4["¿Se puede documentar y probar<br/>sin depender de un sistema concreto?"]
    OK["Candidata al estándar abierto"]

    C1 --> C2 --> C3 --> C4 --> OK
```

## 7. Roadmap fundacional (fases)

```mermaid
flowchart LR
    F0["F0<br/>Charter y alcance"] --> F1["F1<br/>Inventario de contratos"]
    F1 --> F2["F2<br/>Primer slice interoperable<br/>(≥2 implementaciones<br/>intercambiables)"]
    F2 --> F3["F3<br/>SDK de referencia +<br/>tests de conformidad"]
    F3 --> F4["F4<br/>Validación en escenarios reales"]
    F4 --> F5["F5<br/>Gobernanza<br/>(licencia, RFC/ADR, versionado)"]
    F5 --> F6["F6<br/>Adopción independiente<br/>(un tercero lo usa sin<br/>conocer implementación interna)"]
```

## 8. Principio de éxito

El estándar es exitoso si permite: validar contratos antes de industrializarlos, reducir
riesgo arquitectónico, probar tecnologías sustituibles, colaborar con terceros, detectar
acoplamientos incorrectos, crear herramientas útiles fuera de cualquier producto
específico, y aprender de sistemas reales.

El éxito **no** se mide por reproducir ningún producto concreto en abierto — se mide por
la utilidad y estabilidad del contrato en sí mismo, independiente de quién lo implemente.
