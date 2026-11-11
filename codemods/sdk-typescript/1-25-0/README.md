# temporalio-sdk-1.24-to-1.25

Multi-step Codemod workflow for **@temporalio/\*** (sdk-typescript) **1.24 → 1.25**.

Source: https://github.com/temporalio/sdk-typescript/releases/tag/v1.25.0

## What it changes

Runs two sequential JSSG steps (`semantic_analysis: file`):

1. **Nexus Workflow Updates** — in files that import `@temporalio/nexus` (or a subpath), require `waitForStage: 'ACCEPTED'`:
   - `handle.update(def)` → `handle.update(def, { waitForStage: 'ACCEPTED' })`
   - `handle.update(def, { ... })` without `waitForStage` → inserts it (quote style from `@jssg/utils` `getFileStyle`)
2. **Event Groups** — only for symbols bound to `@temporalio/workflow` (or a subpath), via `@jssg/utils` `importBindingOf` / `renameReferences` / `updateImport`:
   - `createEventGroup('label', { id: 'gid' })` → `createEventGroup('gid', { label: 'label' })`
   - Aliased and namespace calls (`makeGroup(...)`, `wf.createEventGroup(...)`)
   - `EventGroupMarker` → `EventGroup`
   - Single-argument `createEventGroup('aaa')` is left unchanged (the string is now the id)
   - Same-named APIs from other packages are left alone

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
- Distinguishing non-Nexus `.update` calls in files that also import `@temporalio/nexus` (file-level import gate only)
