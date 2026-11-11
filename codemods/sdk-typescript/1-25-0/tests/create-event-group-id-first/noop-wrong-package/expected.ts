import { createEventGroup } from 'other-lib';
import type { EventGroupMarker } from 'other-lib';

export function groups(marker: EventGroupMarker) {
  return createEventGroup('label', { id: 'gid' });
}
