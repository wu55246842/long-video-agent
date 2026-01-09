import { promises as fs } from "fs";
import path from "path";

interface NarrationSegment {
  id: string;
  text: string;
  start_sec?: number;
  end_sec?: number;
  duration_sec?: number;
}

interface TtsAudioResult {
  id: string;
  filePath: string;
  duration_sec: number;
}

const SAMPLE_RATE = 44100;
const BITS_PER_SAMPLE = 16;
const CHANNELS = 1;

export class MockTtsProvider {
  async generateMockAudio(
    segments: NarrationSegment[],
    outputDir: string
  ): Promise<TtsAudioResult[]> {
    await fs.mkdir(outputDir, { recursive: true });

    const results: TtsAudioResult[] = [];
    for (const segment of segments) {
      const duration =
        segment.duration_sec ??
        (segment.end_sec !== undefined && segment.start_sec !== undefined
          ? Math.max(0.1, segment.end_sec - segment.start_sec)
          : estimateDuration(segment.text));
      const filename = `${segment.id}.wav`;
      const filePath = path.join(outputDir, filename);
      const wavBuffer = buildSilentWav(duration);
      await fs.writeFile(filePath, wavBuffer);
      results.push({ id: segment.id, filePath, duration_sec: duration });
    }

    return results;
  }
}

function estimateDuration(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const seconds = words / 2.2;
  return Math.max(0.4, Number(seconds.toFixed(2)));
}

function buildSilentWav(durationSec: number): Buffer {
  const sampleCount = Math.max(1, Math.floor(durationSec * SAMPLE_RATE));
  const byteRate = SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8);
  const blockAlign = CHANNELS * (BITS_PER_SAMPLE / 8);
  const dataSize = sampleCount * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}
