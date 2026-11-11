import { createEventGroup } from '@temporalio/workflow';

export function groups() {
  // Single-arg form: string becomes the id in 1.25 (left unchanged).
  return createEventGroup('aaa');
}
