import { createEventGroup } from '@temporalio/workflow';

export function groups() {
  const c = createEventGroup('c-id', { label: 'ccc' });
  const d1 = createEventGroup('d-id', { label: 'ddd1' });
  return [c, d1];
}
