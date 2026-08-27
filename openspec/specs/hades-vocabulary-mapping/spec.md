# hades-vocabulary-mapping Specification

## Purpose
Records the correspondence between nimrod's roadmap modules and HADES primitives/contracts, so
future module implementations name their contracts consistently instead of ad hoc, without
implying nimrod is HADES's canonical Mission Control.
## Requirements
### Requirement: Module-to-primitive mapping is documented and discoverable
The system SHALL maintain a table mapping each roadmap module in
`docs/architecture/sidebar-roadmap.md` to its corresponding HADES primitive or contract name,
stored in a location a contributor implementing that module will read before naming its contract.

#### Scenario: Contributor looks up a module's HADES counterpart
- **WHEN** a contributor is about to define the contract for a roadmap module (e.g. `agents`)
- **THEN** they can find, in this capability's spec or the sidebar roadmap doc it augments, the
  HADES primitive that module corresponds to (e.g. `agents` → Actor / Agent Runtime) without
  needing to search external documentation

### Requirement: Mapping does not assert unimplemented status as done
The mapping table SHALL NOT state or imply that a roadmap module already has a HADES-aligned
contract or backend implemented; it records only the intended correspondence for modules still
marked `futuro`/not-yet-implemented in `docs/architecture/sidebar-roadmap.md`.

#### Scenario: Reader checks a still-unimplemented module
- **WHEN** a reader consults the mapping for a module still marked `futuro` in the sidebar roadmap
- **THEN** the mapping entry is presented as a naming target for the future contract, not as an
  existing capability, matching that module's actual status in the roadmap doc

### Requirement: Mapping does not declare nimrod as canonical HADES Mission Control
The mapping capability SHALL explicitly state that nimrod is the control-plane UI for the
Leadsales Design Partner Cell over `rumbor-core`, not Rumbor's canonical HADES Mission Control UI,
consistent with `openspec/changes/archive/2026-08-25-migrate-better-auth/proposal.md`.

#### Scenario: Reader infers product scope from the mapping
- **WHEN** a reader unfamiliar with nimrod's product context reads the vocabulary mapping
- **THEN** they also find the explicit boundary statement distinguishing nimrod (Design Partner
  Cell UI) from HADES's own canonical Mission Control, so they do not misattribute nimrod's scope

### Requirement: Future HADES-aligned module contracts follow the mapped name
When a roadmap module is implemented against a HADES-aligned backend, its contract naming SHALL
use the HADES primitive name recorded in the mapping (e.g. an `agents` module's runtime contract
is named/aligned to the Agent Runtime Contract) rather than an independently invented name.

#### Scenario: Agents module contract is defined
- **WHEN** a future change defines the contract backing the `agents` roadmap module against a
  HADES-aligned backend
- **THEN** that contract's naming is consistent with the Actor / Agent Runtime Contract mapping
  recorded by this capability, rather than introducing an unrelated name for the same concept

