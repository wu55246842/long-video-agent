import { promises as fs } from "fs";
import path from "path";

export type StageName =
  | "Brief"
  | "Outline"
  | "Script"
  | "Storyboard"
  | "RenderPlan"
  | "Production"
  | "QA";

export interface StageRunOptions {
  force?: boolean;
  shot_id?: string;
}

export interface StageResult<T = unknown> {
  name: StageName;
  artifact: T;
}

export interface StageContext {
  artifacts: Map<StageName, unknown>;
}

export interface Stage<T = unknown> {
  name: StageName;
  run(context: StageContext, options?: StageRunOptions): Promise<StageResult<T>>;
}

export interface OrchestratorOptions {
  artifactsDir?: string;
  stages?: Stage[];
}

export interface StoryboardShot {
  shot_id: string;
  chapter_id: string;
  start_sec: number;
  dur_sec: number;
  visual_desc: string;
  camera_desc: string;
  motion: string;
  mood: string;
  narration_ref: string;
  dialogue_ref: string;
  assets_ref: string;
  transition: string;
  status: string;
}

export interface StoryboardArtifact {
  id: string;
  version: string;
  created_at: string;
  source: string;
  params: Record<string, unknown>;
  hash: string;
  shots: StoryboardShot[];
}

const PIPELINE: StageName[] = [
  "Brief",
  "Outline",
  "Script",
  "Storyboard",
  "RenderPlan",
  "Production",
  "QA",
];

const DEFAULT_ARTIFACTS_DIR = "artifacts";

export class Orchestrator {
  private readonly artifactsDir: string;
  private readonly stages: Map<StageName, Stage>;

  constructor(options: OrchestratorOptions = {}) {
    this.artifactsDir = options.artifactsDir ?? DEFAULT_ARTIFACTS_DIR;
    const stageList = options.stages ?? createMockStages();
    this.stages = new Map(stageList.map((stage) => [stage.name, stage]));
  }

  async runAll(): Promise<Map<StageName, unknown>> {
    const artifacts = new Map<StageName, unknown>();

    for (const stageName of PIPELINE) {
      const result = await this.runStage(stageName, { artifacts });
      artifacts.set(stageName, result);
    }

    return artifacts;
  }

  async runStage(
    stageName: StageName,
    contextOverrides?: { artifacts?: Map<StageName, unknown> },
    options: StageRunOptions = {}
  ): Promise<unknown> {
    const stage = this.stages.get(stageName);
    if (!stage) {
      throw new Error(`Stage ${stageName} is not configured`);
    }

    const artifacts = contextOverrides?.artifacts ?? new Map<StageName, unknown>();
    const context: StageContext = { artifacts };

    if (!options.force) {
      const existing = await this.readArtifact(stageName);
      if (existing) {
        artifacts.set(stageName, existing);
        return existing;
      }
    }

    const result = await stage.run(context, options);
    artifacts.set(stageName, result.artifact);
    await this.writeArtifact(stageName, result.artifact);
    return result.artifact;
  }

  async redoShot(shot_id: string): Promise<StoryboardArtifact> {
    const storyboard = (await this.readArtifact(
      "Storyboard"
    )) as StoryboardArtifact | null;

    if (!storyboard) {
      throw new Error("Storyboard artifact not found; run pipeline first.");
    }

    const shot = storyboard.shots.find((item) => item.shot_id === shot_id);
    if (!shot) {
      throw new Error(`Shot ${shot_id} not found in storyboard.`);
    }

    shot.status = "redo";
    storyboard.created_at = new Date().toISOString();
    storyboard.hash = `redo-${shot_id}-${Date.now()}`;

    await this.writeArtifact("Storyboard", storyboard);
    return storyboard;
  }

  private artifactPath(stageName: StageName): string {
    const filename = `${stageName.toLowerCase()}.json`;
    return path.join(this.artifactsDir, filename);
  }

  private async readArtifact(stageName: StageName): Promise<unknown | null> {
    try {
      const filePath = this.artifactPath(stageName);
      const contents = await fs.readFile(filePath, "utf-8");
      return JSON.parse(contents) as unknown;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  private async writeArtifact(stageName: StageName, artifact: unknown): Promise<void> {
    await fs.mkdir(this.artifactsDir, { recursive: true });
    const filePath = this.artifactPath(stageName);
    const payload = JSON.stringify(artifact, null, 2);
    await fs.writeFile(filePath, payload, "utf-8");
  }
}

class MockStage implements Stage {
  constructor(public readonly name: StageName) {}

  async run(context: StageContext, options?: StageRunOptions): Promise<StageResult> {
    const baseArtifact = context.artifacts.get(this.name);
    if (baseArtifact && !options?.force) {
      return { name: this.name, artifact: baseArtifact };
    }

    if (this.name === "Storyboard") {
      return { name: this.name, artifact: buildMockStoryboard(options?.shot_id) };
    }

    return {
      name: this.name,
      artifact: {
        id: `${this.name.toLowerCase()}-artifact`,
        version: "1.0.0",
        created_at: new Date().toISOString(),
        source: "mock",
        params: {},
        hash: `${this.name.toLowerCase()}-hash`,
      },
    };
  }
}

function createMockStages(): Stage[] {
  return PIPELINE.map((stage) => new MockStage(stage));
}

function buildMockStoryboard(shot_id?: string): StoryboardArtifact {
  const id = shot_id ?? "shot-001";
  return {
    id: "storyboard-001",
    version: "1.0.0",
    created_at: new Date().toISOString(),
    source: "mock",
    params: {},
    hash: `storyboard-hash-${Date.now()}`,
    shots: [
      {
        shot_id: id,
        chapter_id: "chapter-001",
        start_sec: 0,
        dur_sec: 5,
        visual_desc: "Wide establishing shot.",
        camera_desc: "Locked-off camera.",
        motion: "None",
        mood: "Calm",
        narration_ref: "narration-001",
        dialogue_ref: "dialogue-001",
        assets_ref: "assets-001",
        transition: "cut",
        status: "ready",
      },
    ],
  };
}
