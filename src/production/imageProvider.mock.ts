import { promises as fs } from "fs";
import path from "path";
import type { StoryboardShot } from "../core/types/storyboard";

const PLACEHOLDER_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAACqaXHeAAAANElEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPBtB0QAAQnX4O8AAAAASUVORK5CYII=";

interface ImagePlaceholderResult {
  shot_id: string;
  filePath: string;
}

export class MockImageProvider {
  async generatePlaceholders(
    shots: StoryboardShot[],
    outputDir: string
  ): Promise<ImagePlaceholderResult[]> {
    await fs.mkdir(outputDir, { recursive: true });
    const pngBuffer = Buffer.from(PLACEHOLDER_PNG_BASE64, "base64");

    const results: ImagePlaceholderResult[] = [];
    for (const shot of shots) {
      const filename = `${shot.shot_id}.png`;
      const filePath = path.join(outputDir, filename);
      await fs.writeFile(filePath, pngBuffer);
      results.push({ shot_id: shot.shot_id, filePath });
    }

    return results;
  }
}
