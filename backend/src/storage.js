import { mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
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
}
