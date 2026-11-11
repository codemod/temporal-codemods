import { createEventGroup } from '@temporalio/workflow';

export function groups() {
  const c = createEventGroup('ccc', { id: 'c-id' });
  const d1 = createEventGroup('ddd1', { id: 'd-id' });
  return [c, d1];
}
