export interface StoryboardMetadata {
  id: string;
  version: string;
  created_at: string;
  source: string;
  params: Record<string, unknown>;
  hash: string;
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

export interface Storyboard extends StoryboardMetadata {
  shots: StoryboardShot[];
}
