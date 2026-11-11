# temporal-codemods

Codemod packages for Temporal SDK version migrations.

## Layout

```text
codemods/
  <sdk>/                 # e.g. sdk-typescript, sdk-java, sdk-go, sdk-python
    <target-version>/    # e.g. 1-25-0
```

Each target-version folder is a Codemod package (`codemod.yaml`, `workflow.yaml`, scripts, fixtures).

## Current packages

| Path | Registry name | Migration |
| --- | --- | --- |
| `codemods/sdk-typescript/1-25-0` | `temporalio-sdk-1-24-to-1-25` | TypeScript SDK 1.24 → 1.25 |
