import type { UpdateDefinition } from '@temporalio/nexus';

export async function run(handle: { update: Function }, updateDef: UpdateDefinition<string>) {
  await handle.update(updateDef);
}
