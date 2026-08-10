// Thin wrapper around the Electron preload bridge (see Desktop/preload.js).
// Everything here is a safe no-op when running in a plain browser tab
// (e.g. `next dev` in the Browser pane) — only the desktop app exposes
// window.electronAPI.

export interface DocumentBackupMeta {
  clientName: string;
  customerName: string;
  jobNumber: string;
  applianceType: string;
  docType: 'Inspection' | 'Quotation' | 'Invoice';
  docNumber: string;
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron: true;
      getBackupFolder: () => Promise<string>;
      chooseBackupFolder: () => Promise<string>;
      saveDocumentPdf: (meta: DocumentBackupMeta) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      openInBrowser: () => Promise<void>;
    };
  }
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
}

export async function saveDocumentBackup(meta: DocumentBackupMeta) {
  if (!isElectron()) return null;
  try {
    return await window.electronAPI!.saveDocumentPdf(meta);
  } catch {
    return null;
  }
}

export async function getBackupFolder(): Promise<string | null> {
  if (!isElectron()) return null;
  try {
    return await window.electronAPI!.getBackupFolder();
  } catch {
    return null;
  }
}

export async function chooseBackupFolder(): Promise<string | null> {
  if (!isElectron()) return null;
  try {
    return await window.electronAPI!.chooseBackupFolder();
  } catch {
    return null;
  }
}

export async function openInBrowser(): Promise<void> {
  if (!isElectron()) return;
  try {
    await window.electronAPI!.openInBrowser();
  } catch {
    // ignore — non-critical convenience action
  }
}
