## Purpose
Defines the Nuxt builder (bundler) this application uses for `pnpm dev`/`pnpm build`, and the internal path-alias convention its module resolution depends on.

## ADDED Requirements

### Requirement: Dev server and production build use the Rspack builder
The system SHALL use `@nuxt/rspack-builder` as the Nuxt `builder` for both `pnpm dev` and `pnpm build`.

#### Scenario: Cold dev-server start
- **WHEN** `pnpm dev` is run with a clean cache (`rm -rf node_modules/.cache .nuxt/dev`)
- **THEN** the server starts under Rspack and serves an authenticated route with a real Vuetify-rendered UI, not an empty SSR shell

### Requirement: Internal path aliases resolve identically to before the builder switch
The system SHALL resolve every internal path alias (`@core`, `@layouts`, `@images`, `@styles`, `@configured-variables`, `@db`, `@api-utils`, and their `#`-prefixed equivalents used in JS/TS `import` statements) to the same underlying file as before this change, in both server-side rendering and client-side bundles.

#### Scenario: Server-side render of an aliased import
- **WHEN** a page or component that imports from `#core`, `#layouts`, or any other internal alias is server-rendered
- **THEN** the response is a real rendered page (not a `500` error and not an `Invalid module`/`Cannot find module` failure for that alias)

#### Scenario: Sass `@use`/`@forward` statement referencing an alias
- **WHEN** a `.scss` file or `<style lang="scss">` block contains `@use "@core/..."` or `@forward "@core/..."` (the pre-existing `@name` form, not the JS-side `#name` rename)
- **THEN** the stylesheet compiles without a "Can't find stylesheet to import" error

### Requirement: Vuetify components render under the Rspack builder
The system SHALL register Vuetify's per-component styles and auto-import behavior (previously provided by `vite-plugin-vuetify`) through an Rspack-compatible mechanism, so every Vuetify component used in this application resolves and renders identically to the Vite-based build.

#### Scenario: Login page renders a real Vuetify form
- **WHEN** `/login` is requested under the Rspack builder
- **THEN** the response body contains a rendered `VApp`/`VLocaleProvider` tree with visible form fields, not an empty `<div id="__nuxt"><!----></div>` and not a `Failed to resolve component` warning for any Vuetify component

### Requirement: SVG-as-icon-component imports resolve under the Rspack builder
The system SHALL render every SVG imported as a Vue icon component (previously provided by `vite-svg-loader`) identically after the import mechanism is replaced with an Rspack-compatible loader.

#### Scenario: A page using an SVG icon component
- **WHEN** a page or component that imports an SVG as an icon component is rendered
- **THEN** the same icon renders visually as it did before the builder switch
