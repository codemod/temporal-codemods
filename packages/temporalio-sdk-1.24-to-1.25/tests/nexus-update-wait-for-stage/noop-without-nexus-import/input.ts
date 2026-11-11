export async function run(handle: any, updateDef: any) {
  await handle.update(updateDef);
  await handle.update(updateDef, { args: [1] });
}
