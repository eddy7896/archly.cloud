/**
 * Transform Tool - Translate, rotate, scale nodes
 */

'use client';

import { useEffect } from 'react';
import { useEditor } from '@pascal-app/editor';

export function TransformTool() {
  const editor = useEditor();

  useEffect(() => {
    // Tool activation logic
    console.log('Transform tool activated');

    return () => {
      console.log('Transform tool deactivated');
    };
  }, [editor]);

  return null;
}
