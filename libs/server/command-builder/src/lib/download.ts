import { createWriteStream, mkdirSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import * as path from 'node:path';

export async function downloadWithProgress(
  url: string,
  destinationPath: string,
  onProgress?: (msg: string) => void,
): Promise<void> {
  const res = await fetch(url);

  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status})`);

  const total = Number(res.headers.get('content-length')) || 0;
  let received = 0;
  let lastStep = -1;

  const source = Readable.fromWeb(res.body as any);
  source.on('data', (chunk: Buffer) => {
    received += chunk.length;
    if (!total) return;
    const step = Math.floor((received / total) * 10);
    if (step > lastStep) {
      lastStep = step;
      onProgress?.(`Downloading server jar... ${step * 10}%`);
    }
  });

  mkdirSync(path.dirname(destinationPath), { recursive: true });
  await pipeline(source, createWriteStream(destinationPath));
}
