import fs from "fs";
import type { UserContext } from "../osfriend/types";

export function detectLinuxDistro() {
  try {
    const data = fs.readFileSync("/etc/os-release", "utf8");
    const id = data.match(/^ID=(.*)$/m)?.[1]?.replace(/"/g, "");
    const version = data.match(/^VERSION_ID=(.*)$/m)?.[1]?.replace(/"/g, "");
    return { distro: id, version: version };
  } catch {
    return {};
  }
}

export function linuxContext(): UserContext {
  const linuxInfo = detectLinuxDistro();
  const distro = linuxInfo.distro;
  const version = linuxInfo.version;
  return {
    os: "linux",
    shell: "bash",
    distro: distro,
    version: version,
    package_manager: distro === "ubuntu" ? "apt" : undefined,
  }
}
