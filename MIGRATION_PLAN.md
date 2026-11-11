# Migration plan: @temporalio/* (sdk-typescript) 1.24.0 → 1.25.0

- Author: alexbit-codemod <alex@codemod.com>
- Registry: access=public, visibility=public
- Layout: `codemods/<sdk>/<target-version>/`
- Path: `codemods/sdk-typescript/1-25-0/`
- Sources:
  - https://github.com/temporalio/sdk-typescript/releases/tag/v1.25.0
  - https://github.com/temporalio/sdk-typescript/compare/v1.24.0...v1.25.0
- Package (single multi-step workflow):
  1. `temporal-ts-sdk-1-24-to-1-25` (no dots in registry name — use hyphens for versions)
     - Step: require `waitForStage: 'ACCEPTED'` on Nexus Workflow Updates
     - Step: migrate `createEventGroup(label, { id })` → `createEventGroup(id, { label })` and rename `EventGroupMarker` → `EventGroup`
- Out of scope / manual:
  - Google ADK / Node 22.12 engine cutover
  - Undocumented package subpath removals
  - Adding `protobufjs` / `long` peer dependencies
  - AI integration package renames (old wrappers still work)
  - Rebuilding old auto-hashed Event Group ids for single-arg label-only calls
- Test plan: fixtures + `workflow validate` + `validate_codemod_package` + package `npm test`
