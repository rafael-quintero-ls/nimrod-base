# agents Specification

## Purpose
Defines the Agent Catalog: how a user lists, views, and reads the status/configuration summary
of agents, independent of which backend resolves that data. Does not cover triggering or
observing agent runs.
## Requirements
### Requirement: Agent list is discoverable and paginated
The system SHALL let an authorized user list agents with server-side pagination and text search
by name, returning each agent's id, name, and status.

#### Scenario: Listing agents with no filter
- **WHEN** an authorized user opens the Agents catalog
- **THEN** a page of agents is shown with name and status, with pagination controls reflecting
  the total agent count

#### Scenario: Searching agents by name
- **WHEN** an authorized user enters a search term matching one or more agent names
- **THEN** only agents whose name matches the term are shown, with pagination reflecting the
  filtered count

#### Scenario: No agents exist
- **WHEN** an authorized user opens the Agents catalog and no agents are registered
- **THEN** the list renders an explicit empty state, not an error, blank screen, or infinite
  loading indicator

### Requirement: Agent detail shows status and configuration summary
The system SHALL let an authorized user view a single agent's full detail: id, name, status, a
human-readable description, and a summary of its configuration.

#### Scenario: Viewing an existing agent's detail
- **WHEN** an authorized user navigates to a specific agent's detail page
- **THEN** the page shows that agent's name, status, description, and configuration summary

#### Scenario: Viewing a non-existent agent's detail
- **WHEN** a user navigates to a detail page for an agent id that does not exist
- **THEN** the page shows an explicit "not found" state, not a blank page, unhandled error, or
  data from a different agent

### Requirement: Agent status reflects a fixed, known set of values
Every agent SHALL have a status drawn from a fixed set of known values (at minimum: active,
inactive, error), and the system SHALL render that status distinctly (e.g. visually or textually
differentiated) rather than as an opaque or arbitrary string.

#### Scenario: Agent in error status
- **WHEN** an agent's status is "error"
- **THEN** both the list and detail views visually distinguish it from "active"/"inactive" agents

### Requirement: Agent Catalog access is gated by authorization rules
Listing and viewing agents SHALL require the same CASL-based authorization already enforced for
every other route in this application (`read`/`Agent` ability), with no separate access
mechanism.

#### Scenario: User without Agent read permission
- **WHEN** an authenticated user whose session lacks the `read` ability for `Agent` navigates to
  the Agents catalog or a specific agent's detail page
- **THEN** they are redirected to the "not authorized" page, identically to any other CASL-gated
  route

### Requirement: Agent data source is not exposed through the public interface
Whatever system resolves agent data SHALL NOT be named or otherwise identifiable in the user-
facing UI, error messages, environment variable names, or public configuration keys — matching
the existing rule already enforced for the identity backend.

#### Scenario: Agent data fetch fails
- **WHEN** the underlying agent data source is unreachable or returns an error
- **THEN** the error shown to the user is generic and backend-agnostic, naming neither the
  backend nor its underlying technology

### Requirement: Agent Catalog does not present run/execution data
The Agent Catalog SHALL NOT display run history, live execution status, or any run-triggering
action — those belong to a distinct Executions capability not covered here.

#### Scenario: Agent detail page is viewed
- **WHEN** an authorized user views an agent's detail page
- **THEN** no run history, execution log, or "run agent" action is present on that page

