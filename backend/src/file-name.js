function latin1Bytes(value) {
  const characters = [...value];
  if (characters.some((character) => character.codePointAt(0) > 0xff)) return null;
  return Buffer.from(characters.map((character) => character.codePointAt(0)));
}

export function normalizeUtf8FileName(value) {
  const fileName = String(value || '');
  if (!fileName) return fileName;
  const bytes = latin1Bytes(fileName);
  if (!bytes) return fileName;
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (decoded === fileName || !/[^\x00-\x7f]/.test(decoded)) return fileName;
    return Buffer.from(decoded, 'utf8').equals(bytes) ? decoded : fileName;
  } catch (_error) {
    return fileName;
  }
}

export function normalizeTenderFileRecord(file) {
  if (!file) return file;
  return { ...file, original_name: normalizeUtf8FileName(file.original_name) };
}
