## ADDED Requirements

### Requirement: Not-yet-implemented modules are visible but honestly labeled
The system SHALL expose a not-yet-implemented module in navigation as a real, CASL-gated route
rendering a clearly-labeled "in development" state, rather than omitting it, disabling it, or
linking it to a route that does not exist.

#### Scenario: Navigating to an in-development module
- **WHEN** a user with permission for an in-development module clicks its nav entry
- **THEN** the app navigates to a real route that renders, identifies the module by name, and
  states it is in development — it does not 404, does not silently do nothing, and does not claim
  functionality that does not exist

#### Scenario: In-development route never fakes functionality
- **WHEN** an in-development module's placeholder route renders
- **THEN** it contains no functional form, data entry, or call-to-action implying a working
  feature (e.g. no email capture, no fake submit) — only a name and a short description of what
  the module will cover

### Requirement: Module visibility is gated by CASL like any real route
Each not-yet-implemented module's nav entry and route SHALL require an explicit
`action`/`subject` CASL rule, evaluated the same way as any implemented route — no separate
"draft" or "preview" visibility mechanism outside the existing authorization system.

#### Scenario: Role without the module's ability
- **WHEN** an authenticated user whose session lacks the `read` ability for a given module's
  subject navigates to that module's route directly
- **THEN** they are redirected to the "not authorized" page, identically to any other CASL-gated
  route, and the module's nav entry is not shown in their sidebar

#### Scenario: Role with the module's ability
- **WHEN** an authenticated user whose session grants the `read` ability for a given module's
  subject loads the app
- **THEN** the module's nav entry appears in their sidebar and its route renders normally

### Requirement: In-development placeholder is replaced, not layered, when a module ships
When a not-yet-implemented module gains a real implementation, the system SHALL replace its
placeholder route and content with the real feature under the same nav entry and route path,
rather than adding a second entry or leaving the placeholder reachable alongside the real feature.

#### Scenario: A roadmap module ships its real implementation
- **WHEN** a module previously in "in development" state gets a real backend and UI in a later
  change
- **THEN** the same route path and nav entry now serve the real feature, and the "in development"
  placeholder is no longer reachable under that path
