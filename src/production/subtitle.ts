import { promises as fs } from "fs";
import path from "path";

interface SubtitleSegment {
  id: string;
  start_sec: number;
  end_sec: number;
  text: string;
}

export class SubtitleGenerator {
  async generateSrt(
    segments: SubtitleSegment[],
    outputPath: string
  ): Promise<string> {
    const sorted = [...segments].sort((a, b) => a.start_sec - b.start_sec);
    const blocks = sorted.map((segment, index) => {
      const start = formatSrtTimestamp(segment.start_sec);
      const end = formatSrtTimestamp(segment.end_sec);
      return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`;
    });

    const contents = `${blocks.join("\n").trim()}\n`;
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, contents, "utf-8");
    return contents;
  }
}

function formatSrtTimestamp(seconds: number): string {
  const totalMillis = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMillis / 3_600_000);
  const minutes = Math.floor((totalMillis % 3_600_000) / 60_000);
  const secs = Math.floor((totalMillis % 60_000) / 1000);
  const millis = totalMillis % 1000;

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${padMillis(millis)}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function padMillis(value: number): string {
  return value.toString().padStart(3, "0");
}
