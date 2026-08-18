import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export class LocalFileStorage {
  constructor(rootDirectory) {
    this.rootDirectory = resolve(rootDirectory);
  }

  async save({ projectId, originalName, buffer }) {
    const projectDirectory = resolve(this.rootDirectory, projectId);
    await mkdir(projectDirectory, { recursive: true });
    const extension = extname(originalName).slice(0, 12);
    const fileName = `${randomUUID()}${extension}`;
    await writeFile(resolve(projectDirectory, fileName), buffer, { flag: 'wx' });
    return `${projectId}/${fileName}`;
  }

  async read(storageKey) {
    const normalizedKey = String(storageKey || '').replace(/\\/g, '/');
    const filePath = resolve(this.rootDirectory, normalizedKey);
    const relativePath = relative(this.rootDirectory, filePath);
    if (!normalizedKey || relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw Object.assign(new Error('文件存储路径无效。'), { code: 'STORAGE_KEY_INVALID' });
    }
    return readFile(filePath);
  }
}
