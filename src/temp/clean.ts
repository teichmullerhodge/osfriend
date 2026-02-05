import fs from "fs";
import os from "os";
import path from "path";

export function cleanupTempAudios(signature: string) {
  const isWindows = os.platform() === "win32";

  const baseDir = isWindows ? process.cwd() : os.tmpdir();

  try {
    const files = fs.readdirSync(baseDir);

    for (const file of files) {
      if (
        file.startsWith(signature) &&
        (file.endsWith(".mp3") || file.endsWith(".wav"))
      ) {
        const fullPath = path.join(baseDir, file);

        try {
          fs.unlinkSync(fullPath);
        } catch {
          // files in use, permission errors, etc. We ignore since the max recording time is defined by the user.
        }
      }
    }
  } catch {
  }
}

