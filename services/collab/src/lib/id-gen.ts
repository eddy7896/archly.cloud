/**
 * ID generation utilities
 */

import { randomBytes } from 'crypto';

export function generateDocId(): string {
  return randomBytes(8).toString('hex');
}

export function generateUserId(): string {
  return randomBytes(8).toString('hex');
}
