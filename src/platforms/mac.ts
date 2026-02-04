import { execSync } from "child_process";
import type { UserContext } from "../osfriend/types";

export function detectMacVersion(): string {
    return execSync("sw_vers -productVersion").toString().trim();
}


export function macContext(): UserContext {
  return {
    os: "macos",
    shell: "zsh",
    package_manager: "brew"
  }

}
