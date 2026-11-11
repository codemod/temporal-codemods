import { createEventGroup, type EventGroup } from '@temporalio/workflow';

export function take(group: EventGroup) {
  return group;
}

export function make(): EventGroup {
  return createEventGroup('gid', { label: 'label' });
}
