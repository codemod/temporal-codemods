import { createEventGroup } from '@temporalio/workflow';

export function groups() {
  return createEventGroup('c-id', { label: 'ccc' });
}
