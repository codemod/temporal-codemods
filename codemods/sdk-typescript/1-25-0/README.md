# temporalio-sdk-1.24-to-1.25

Multi-step Codemod workflow for **@temporalio/\*** (sdk-typescript) **1.24 → 1.25**.

Source: https://github.com/temporalio/sdk-typescript/releases/tag/v1.25.0

## What it changes

Runs two sequential JSSG steps:

1. **Nexus Workflow Updates** — in files that import `@temporalio/nexus`, require `waitForStage: 'ACCEPTED'`:
   - `handle.update(def)` → `handle.update(def, { waitForStage: 'ACCEPTED' })`
   - `handle.update(def, { ... })` without `waitForStage` → inserts it
2. **Event Groups** — migrate `createEventGroup` to id-first and rename the type:
   - `createEventGroup('label', { id: 'gid' })` → `createEventGroup('gid', { label: 'label' })`
   - `EventGroupMarker` → `EventGroup`
   - Single-argument `createEventGroup('aaa')` is left unchanged (the string is now the id)

## Usage

```bash
npx codemod temporalio-sdk-1.24-to-1.25 --target .
```

## Out of scope / manual

- Google ADK / Node 22.12 engine cutover
- Undocumented package subpath removals
- Adding `protobufjs` / `long` peer dependencies
- AI integration package renames (old wrappers still work)
- Reconstructing old auto-hashed Event Group ids for single-arg label-only calls
