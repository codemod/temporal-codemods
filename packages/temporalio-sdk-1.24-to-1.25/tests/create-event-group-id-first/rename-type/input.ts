import { createEventGroup, type EventGroupMarker } from '@temporalio/workflow';

export function take(group: EventGroupMarker) {
  return group;
}

export function make(): EventGroupMarker {
  return createEventGroup('label', { id: 'gid' });
}
