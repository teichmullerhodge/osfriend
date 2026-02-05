import os from "os";
import { spawn } from "child_process";

let AUDIO_DEVICE: string | undefined = process.env.MIC_DEVICE_NAME;

export async function initAudio(){
  return await getFirstAudioDevice();
}

export function getFirstAudioDevice(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", ["-list_devices", "true", "-f", "dshow", "-i", "dummy"]);

    let output = "";
    ffmpeg.stderr.on("data", (data) => {
      output += data.toString();
    });

    ffmpeg.on("exit", () => {
      const lines = output.split("\n");
      const audioLines = lines.filter(line => line.includes("(audio)"));
      if (audioLines.length === 0) return reject(null);
      const match = audioLines[0]?.match(/"(.+)"/);
      if (!match) return reject(null);
      AUDIO_DEVICE = match[1];
      resolve(match[1] !== undefined ? match[1] : null);
    });
  });
}



export function getAudioRecordCommand(outputFile: string): { cmd: string; args: string[] } {
  const platform = os.platform();


  const commonArgs = [
    "-t", process.env.MAX_RECORDING_TIME_S || "60",          
    "-ac", "1",       
    "-ar", "16000",     
    "-c:a", "libmp3lame",
    "-y",               
    outputFile
  ];

  if (platform === "win32") {
    return {
      cmd: "ffmpeg",
      args: [
        "-f", "dshow",
        "-i", `audio=${AUDIO_DEVICE}`,
        ...commonArgs
      ]
    };
  }

  if (platform === "darwin") {
    return {
      cmd: "ffmpeg",
      args: [
        "-f", "avfoundation",
        "-i", ":0",
        ...commonArgs
      ]
    };
  }

  return {
    cmd: "ffmpeg",
    args: [
      "-f", "alsa",
      "-i", "default",
      ...commonArgs
    ]
  };
}


export async function stopAudioProcess(audioProcess: unknown | any, onWindows: boolean) {
    if (onWindows) {
      const killer = spawn("taskkill", ["/pid", audioProcess.pid.toString(), "/f"]);
      await new Promise(resolve => killer.on("exit", resolve));
      return;
    }

    audioProcess.kill("SIGINT");
    await new Promise(resolve => audioProcess.on("exit", resolve));
  
}


