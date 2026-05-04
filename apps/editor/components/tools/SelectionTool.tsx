/**
 * Selection Tool - Select and highlight nodes
 */

'use client';

import { useEffect } from 'react';
import { useEditor } from '@pascal-app/editor';

export function SelectionTool() {
  const editor = useEditor();

  useEffect(() => {
    // Tool activation logic
    console.log('Selection tool activated');

    return () => {
      console.log('Selection tool deactivated');
    };
  }, [editor]);

  // Tool UI can be rendered here or as overlay
  return null;
}
