/**
 * File Export utilities supporting directory selection and File System Access API.
 */

export interface SaveFileOptions {
  suggestedName: string;
  content: string;
  directoryHandle?: any | null;
}

export interface SaveFileResult {
  success: boolean;
  cancelled?: boolean;
  savedName?: string;
  directoryName?: string;
  error?: string;
}

/**
 * Check if the browser supports directory picking (window.showDirectoryPicker)
 */
export function isDirectoryPickerSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Check if the browser supports file save picker with directory navigation (window.showSaveFilePicker)
 */
export function isSaveFilePickerSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

/**
 * Prompt user to select a directory
 */
export async function pickDirectory(): Promise<{ handle: any; name: string } | null> {
  if (isDirectoryPickerSupported()) {
    try {
      const handle = await (window as any).showDirectoryPicker();
      return { handle, name: handle.name || 'Selected Folder' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null;
      }
      throw err;
    }
  }
  return null;
}

/**
 * Save file with directory prompt:
 * 1. If directoryHandle is given, save directly into that directory
 * 2. Else use showSaveFilePicker (opens native OS directory & file save dialog)
 * 3. Else fallback to standard HTML anchor download
 */
export async function saveJsonWithDirectoryPrompt(
  options: SaveFileOptions
): Promise<SaveFileResult> {
  const { suggestedName, content, directoryHandle } = options;
  const filename = suggestedName.trim() || 'level.json';

  // 1. If a directory was pre-selected
  if (directoryHandle) {
    try {
      const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return {
        success: true,
        savedName: filename,
        directoryName: directoryHandle.name,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      console.warn('Failed to write to chosen directoryHandle, falling back to picker', err);
    }
  }

  // 2. Use File System Access API (showSaveFilePicker) - Native OS directory selection dialog
  if (isSaveFilePickerSupported()) {
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'JSON Files (*.json)',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return {
        success: true,
        savedName: fileHandle.name || filename,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      console.warn('showSaveFilePicker failed, falling back to <a> download', err);
    }
  }

  // 3. Fallback: Standard browser download
  try {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return {
      success: true,
      savedName: filename,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to download file',
    };
  }
}
