import fs from 'node:fs';
import xlsx from 'xlsx';

export function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function readTextFile(filePath: string) {
  return fs.readFileSync(filePath, 'utf8');
}

export function readWorkbookRows<T>(filePath: string, sheetName?: string) {
  const workbook = xlsx.readFile(filePath);
  const targetSheet = sheetName ?? workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheet];

  if (!worksheet) {
    throw new Error(`Workbook sheet "${targetSheet}" not found in ${filePath}.`);
  }

  return xlsx.utils.sheet_to_json<T>(worksheet, { defval: null });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(1)} ${units[index]}`;
}
