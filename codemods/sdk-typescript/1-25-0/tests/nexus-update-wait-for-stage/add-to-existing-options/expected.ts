import { something } from '@temporalio/nexus';

export async function run(handle: any, updateDef: any) {
  await handle.update(updateDef, { waitForStage: 'ACCEPTED', args: [1], updateId: 'u1' });
}
