import * as wf from '@temporalio/workflow';

export function groups() {
  return wf.createEventGroup('gid', { label: 'label' });
}
