### OSFriend 

OSFriend lets you control your system using your voice or text commands.

It records audio with push-to-talk, transcribes speech using OpenAI, converts the request into a structured terminal command through an LLM, and executes it automatically on your system.

It also accepts text arguments. 

Speak a command / use text argument → AI interprets → terminal executes. Currently supports Windows, Linux and MacOS. Tested in linux and Windows. 

Just set your open-ai api and open-ai model on the .env file and run the main.ts script.

Use --text "[message]" to give a text prompt. 

You need to install ffmpeg on Windows / MacOS, on Linux you need arecord.

More detailed infos are going to be provided as the project evolves.
