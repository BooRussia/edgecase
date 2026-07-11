import { z } from "zod";

export const OutcomeSchema = z.enum(["handled", "disengaged", "incident"]);
export type Outcome = z.infer<typeof OutcomeSchema>;

export const ClipSchema = z.object({
  id: z.string().min(1),
  postUrl: z.string().url(),
  postId: z.string().min(1),
  authorHandle: z.string().min(1),
  authorDisplayName: z.string().min(1),
  authorAvatarUrl: z.string().url().optional(),
  postedAt: z.string(),
  capturedAt: z.string().optional(),
  outcome: OutcomeSchema,
  severity: z.number().int().min(1).max(5),
  maneuverScore: z.number().int().min(1).max(5),
  tags: z.array(z.string()),
  fsdVersion: z.string().optional(),
  hardware: z.string().optional(),
  summary: z.string().min(1),
  sourceNotes: z.string().optional(),
  featured: z.boolean().default(false),
  likes: z.number().int().nonnegative().optional(),
  views: z.number().int().nonnegative().optional(),
  telemetryRef: z.string().optional(),
});

export type Clip = z.infer<typeof ClipSchema>;

export const ClipsFileSchema = z.array(ClipSchema);

export const OUTCOME_BOOST: Record<Outcome, number> = {
  handled: 0,
  disengaged: 2,
  incident: 4,
};

export function rankScore(clip: Pick<Clip, "severity" | "maneuverScore" | "outcome">): number {
  return clip.severity * 2 + clip.maneuverScore + OUTCOME_BOOST[clip.outcome];
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  handled: "Handled",
  disengaged: "Disengaged",
  incident: "Incident",
};

export const TAG_LABELS: Record<string, string> = {
  "unprotected-left": "Unprotected left",
  "cut-in": "Cut-in",
  railroad: "Railroad",
  "phantom-brake": "Phantom brake",
  "emergency-vehicle": "Emergency vehicle",
  construction: "Construction",
  merge: "Merge",
  roundabout: "Roundabout",
  pedestrian: "Pedestrian",
  animal: "Animal",
  weather: "Weather",
  highway: "Highway",
  urban: "Urban",
  parking: "Parking",
  "traffic-light": "Traffic light",
  "lane-change": "Lane change",
  "obstacle-avoidance": "Obstacle avoidance",
  "near-miss": "Near miss",
  "reaction-time": "Reaction time",
  "vulnerable-road-user": "VRU",
};
