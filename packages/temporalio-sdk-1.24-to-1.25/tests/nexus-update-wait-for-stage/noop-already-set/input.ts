import { something } from '@temporalio/nexus';

export async function run(handle: any, updateDef: any) {
  await handle.update(updateDef, { args: [1], waitForStage: 'ACCEPTED' });
}
