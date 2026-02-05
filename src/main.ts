import OpenAI from "openai";
import fs from "fs";
import { spawn } from "child_process";
import type { OSFriendResponse, RetryContext, UserContext, UserRequest } from "./osfriend/types";
import { OS_FRIEND_AUDIO_SIGNATURE, OSFriend } from "./osfriend/osfriend";
import { Logger } from "./logger/logger";
import os from "os";
import { windowsContext } from "./platforms/windows";
import { macContext } from "./platforms/mac";
import { linuxContext } from "./platforms/linux";
import { getAudioRecordCommand, initAudio, stopAudioProcess } from "./platforms/recording";
import { cleanupTempAudios } from "./temp/clean";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

const log = new Logger("osfriend"); 

async function transcribeAudio(filepath: string): Promise<string> {
  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream(filepath),
    model: process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
    response_format: "text",
    temperature: 0.1
  });
  return transcription as string;
}

async function make(input: UserRequest, systemPrompt: string): Promise<OSFriendResponse> {
  const response = await client.responses.create({ 
    model: process.env.OPENAI_MODEL,
    instructions: systemPrompt,
    input: [
      { role: "user", content: JSON.stringify(input) }
    ]
  });
  const code = response.output_text;
  return JSON.parse(code) as OSFriendResponse;
}

let retryAttempts = 0;

async function processRequest(userPrompt: string, systemPrompt: string, retry?: RetryContext): Promise<void> {
  const platform = os.platform();
  let context: UserContext = { os: platform, shell: "" };
  if (platform === "win32") context = windowsContext();
  if (platform === "darwin") context = macContext();
  if (platform === "linux") context = linuxContext();

  const input: UserRequest = {
    // the retry context is ignored by gpt-4.1-mini, i don't know why 
    // but i use prompt injection to bypass this 'error'
    retry_context: retry, 
    context: context, 
    prompt: userPrompt,
  };

  const response = await make(input, systemPrompt);
  
  log.info(`Executing: ${response.command}`);
  const osres = OSFriend.exec(response.command);
  
  if (!osres.success) {
    const e = osres.stderr.toString();
    log.error(`Error: ${e}`);
    if(retryAttempts > Number(process.env.MAX_RETRY_ATTEMPTS || 1)) return;
    retryAttempts++;
    return await processRequest(`${userPrompt} the command: '${response.command}' failed with error: ${e}, use another command.`, systemPrompt, { last_error: e, last_prompt: userPrompt }); // injection, lol. 
  } 
  console.log(osres.stdout.toString());
}

async function main(): Promise<number> {
  
  if(!process.env.OPENAI_MODEL){
    throw new Error("OPENAI_MODEL env. variable should be set.");
  }
  if(!process.env.OPENAI_API_KEY){
    throw new Error("OPENAI_API_KEY env. variable should be set.");
  }

  cleanupTempAudios(OS_FRIEND_AUDIO_SIGNATURE);

  const onWindows = os.platform() === "win32";
  const systemPromptFile = Bun.file("./prompts/v1.txt");
  const systemPrompt = await systemPromptFile.text();

  
  const args = process.argv;
  const textArgIndex = args.indexOf("--text");
  if (textArgIndex !== -1 && args[textArgIndex + 1] !== undefined) {
    const promptText = args[textArgIndex + 1] as string;
    log.info("Processing text prompt directly...");
    await processRequest(promptText, systemPrompt);
    return 0;
  }
  
  if(onWindows && !process.env.MIC_DEVICE_NAME){
    log.warn("Using the first audio device collected using ffmpeg. Set the MIC_DEVICE_NAME env. variable for a custom option");

  }



  log.info("Press space to start/stop recording.");

  let isRecording = false;
  let audioProcess: any = null;

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  if(onWindows){
    await initAudio(); // get the first audio device using ffmpeg or defined in the .env 
  }

  const audioFile = onWindows ? `${process.cwd()}\\${OS_FRIEND_AUDIO_SIGNATURE}_${Date.now()}.mp3` : `/tmp/${OS_FRIEND_AUDIO_SIGNATURE}_${Date.now()}.mp3`;

  process.stdin.on('data', async (key: string) => {
    if (key === '\u0003') {
      log.info('Exiting.');
      process.exit();
    }
    if(key !== ' ') return;
    if (!isRecording) {
        isRecording = true;
        log.info('Recording...');
        const { cmd, args } = getAudioRecordCommand(audioFile);
        audioProcess = spawn(cmd, args);    
    } else {
        isRecording = false;
        log.success('Processing...');
        await stopAudioProcess(audioProcess, onWindows);
        const userPrompt = await transcribeAudio(audioFile);
        await processRequest(userPrompt, systemPrompt);
        fs.unlinkSync(audioFile);
      }
    }
  );

  return 0;
}

main().catch(console.error);

