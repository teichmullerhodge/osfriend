import os from "os";
import type { UserContext } from "../osfriend/types";

export default function detectWindowsVersion(): string {
  return os.release();
}

export function windowsContext(): UserContext {
  return {
    os: "windows",
    shell: "cmd",
    package_manager: "winget"
  }
}

