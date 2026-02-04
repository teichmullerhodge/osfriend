import { spawnSync } from "bun";
import os from "os";

export class OSFriend {
  static exec(command: string) {
    const platform = os.platform(); 
    const unix = platform !== "win32";
    const unixArgs = ['sh', '-c', command];
    const winArgs  = ['cmd.exe', '/c', command];
    return spawnSync(unix ? unixArgs : winArgs);
  }
}

