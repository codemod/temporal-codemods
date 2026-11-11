import { createEventGroup as makeGroup } from '@temporalio/workflow';

export function groups() {
  return makeGroup('label', { id: 'gid' });
}
