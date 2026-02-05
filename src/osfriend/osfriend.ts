import { spawnSync } from "bun";
import os from "os";


export const OS_FRIEND_AUDIO_SIGNATURE: string = "osfriend_record";


export class OSFriend {
  static exec(command: string) {
    const platform = os.platform(); 
    const unix = platform !== "win32";
    const unixArgs = ['sh', '-c', command];
    const winArgs  = ['cmd.exe', '/c', command];
    return spawnSync(unix ? unixArgs : winArgs);
  }
}

