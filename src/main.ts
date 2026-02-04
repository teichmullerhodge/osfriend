import OpenAI from "openai";
import fs from "fs";
import { spawn } from "child_process";
import type { OSFriendResponse, UserRequest } from "./osfriend/types";
import { OSFriend } from "./osfriend/osfriend";
import { Logger } from "./logger/logger";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

const log = new Logger("osfriend"); 

async function transcribeAudio(filepath: string): Promise<string> {
  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream(filepath),
    model: "gpt-4o-mini-transcribe",
    response_format: "text",
    temperature: 0.1
  });
  return transcription as string;
}

async function make(input: UserRequest, systemPrompt: string): Promise<OSFriendResponse> {
  const response = await client.responses.create({ 
    model: "gpt-4.1-mini",
    instructions: systemPrompt,
    max_output_tokens: 100,
    input: [
      { role: "user", content: JSON.stringify(input) }
    ]
  });
  const code = response.output_text;
  return JSON.parse(code) as OSFriendResponse;
}

async function processRequest(userPrompt: string, systemPrompt: string): Promise<void> {

  const input: UserRequest = {
    context: {}, 
    prompt: userPrompt,
  };

  const response = await make(input, systemPrompt);
  
  log.info(`Executing: ${response.command}`);
  const osres = OSFriend.exec(response.command);
  
  if (!osres.success) {
    log.error(`Error: ${osres.stderr.toString()}`);
    return;
  } 
  console.log(osres.stdout.toString());
}

async function main(): Promise<void> {
  const systemPromptFile = Bun.file("./prompts/v1.txt");
  const systemPrompt = await systemPromptFile.text();

  log.info("Press space to start/stop recording.");

  let isRecording = false;
  let audioProcess: any = null;
  let audioFile = "";

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', async (key: string) => {
    if (key === '\u0003') {
      log.info('Exiting.');
      process.exit();
    }
    if(key !== ' ') return;
    if (!isRecording) {
        isRecording = true;
        audioFile = `/tmp/audio_${Date.now()}.wav`;
        log.info('Recording...');
        audioProcess = spawn('arecord', ['-f', 'cd', '-t', 'wav', audioFile]);
    } else {
        isRecording = false;
        log.success('Processing...');
        audioProcess.kill('SIGINT');

        await new Promise(resolve => setTimeout(resolve, 500));
        const userPrompt = await transcribeAudio(audioFile);
        await processRequest(userPrompt, systemPrompt);
        fs.unlinkSync(audioFile);

      }
    }
  );
}

main().catch(console.error);

