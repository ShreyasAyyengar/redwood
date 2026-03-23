import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, write } from "bun";

async function convertVideoToMp4(input: Uint8Array): Promise<Uint8Array> {
  const tempDir = await mkdtemp(join(tmpdir(), "media-normalize-"));
  const inputPath = join(tempDir, `input-${randomUUID()}`);
  const outputPath = join(tempDir, `output-${randomUUID()}.mp4`);

  try {
    await write(inputPath, input);

    const proc = spawn(
      [
        "ffmpeg",
        "-y",
        "-i",
        inputPath,
        "-movflags",
        "+faststart",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        outputPath,
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(`ffmpeg failed: ${stderr}`);
    }

    const out = await readFile(outputPath);
    return new Uint8Array(out);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
