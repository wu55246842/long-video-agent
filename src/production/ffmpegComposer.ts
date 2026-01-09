import { promises as fs } from "fs";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";
import type { StoryboardShot } from "../core/types/storyboard";

const execFileAsync = promisify(execFile);

interface ComposeOptions {
  outputPath: string;
  imageMap: Map<string, string>;
  shots: StoryboardShot[];
  audioPath?: string;
  fps?: number;
  ffmpegPath?: string;
}

export class FfmpegComposer {
  async compose(options: ComposeOptions): Promise<void> {
    const fps = options.fps ?? 30;
    const ffmpegPath = options.ffmpegPath ?? "ffmpeg";
    await fs.mkdir(path.dirname(options.outputPath), { recursive: true });

    const shotInputs = options.shots.map((shot) => {
      const imagePath = options.imageMap.get(shot.shot_id);
      if (!imagePath) {
        throw new Error(`Missing image for shot ${shot.shot_id}`);
      }
      return {
        imagePath,
        duration: Math.max(0.1, shot.dur_sec),
      };
    });

    if (shotInputs.length === 0) {
      throw new Error("No shots provided for composition.");
    }

    const args: string[] = ["-y"];
    for (const shot of shotInputs) {
      args.push("-loop", "1", "-t", shot.duration.toString(), "-i", shot.imagePath);
    }

    let audioIndex: number | null = null;
    if (options.audioPath) {
      audioIndex = shotInputs.length;
      args.push("-i", options.audioPath);
    }

    const concatInputs = shotInputs.map((_, index) => `[${index}:v]`).join("");
    const filterComplex = `${concatInputs}concat=n=${shotInputs.length}:v=1:a=0,format=yuv420p[v]`;
    args.push("-filter_complex", filterComplex, "-map", "[v]");

    if (audioIndex !== null) {
      args.push("-map", `${audioIndex}:a`, "-shortest");
    }

    args.push("-r", fps.toString(), "-movflags", "+faststart", options.outputPath);

    await execFileAsync(ffmpegPath, args);
  }
}
