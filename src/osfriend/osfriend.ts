import { spawnSync } from "bun";

// this isn't safe. I will sanitize this.
export class OSFriend {
  static exec(command: string){
    return spawnSync(['sh', '-c', command]);
  }
}
