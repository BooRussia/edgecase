import { z } from "zod";

export const OutcomeSchema = z.enum(["handled", "disengaged", "incident"]);
export type Outcome = z.infer<typeof OutcomeSchema>;

/** Who is primarily at fault for a negative outcome */
export const FaultAttributionSchema = z.enum([
  "system", // FSD/Autopilot behavior is the primary issue
  "human-override", // driver pedal/steering override caused or forced the outcome
  "disputed", // logs/community notes conflict with viral framing
  "unknown",
]);
export type FaultAttribution = z.infer<typeof FaultAttributionSchema>;

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
  /** Scenario category for organized browsing */
  category: z
    .enum([
      "safety-critical",
      "impressive",
      "disengagement",
      "false-failure",
      "demo",
      "ui",
    ])
    .optional(),
  faultAttribution: FaultAttributionSchema.default("unknown"),
  /** True when viral "FSD failed" framing is contradicted by logs/notes/override */
  falseFailure: z.boolean().default(false),
  communityNote: z.string().optional(),
  verificationNotes: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  mediaFingerprint: z.string().optional(),
  incidentKey: z.string().optional(),
  relatedPosts: z
    .array(
      z.object({
        postId: z.string(),
        postUrl: z.string().url(),
        authorHandle: z.string(),
        authorDisplayName: z.string().optional(),
        reason: z.string().optional(),
        summary: z.string().optional(),
        hadVideo: z.boolean().optional(),
      }),
    )
    .optional(),
  isRepost: z.boolean().optional(),
  isQuote: z.boolean().optional(),
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

export function rankScore(
  clip: Pick<Clip, "severity" | "maneuverScore" | "outcome" | "falseFailure">,
): number {
  // False failures stay visible but don't dominate the "system failure" ranking
  const boost = clip.falseFailure ? 0 : OUTCOME_BOOST[clip.outcome];
  return clip.severity * 2 + clip.maneuverScore + boost;
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  handled: "Handled",
  disengaged: "Disengaged",
  incident: "Incident",
};

export const FAULT_LABEL: Record<FaultAttribution, string> = {
  system: "System fault",
  "human-override": "Human override",
  disputed: "Disputed",
  unknown: "Unverified",
};

export const CATEGORY_LABEL: Record<NonNullable<Clip["category"]>, string> = {
  "safety-critical": "Safety critical",
  impressive: "Impressive",
  disengagement: "Disengagement",
  "false-failure": "False failure",
  demo: "Demo / test",
  ui: "UI / product",
};

/** Organized tag taxonomy for filters */
export const TAG_GROUPS: Array<{
  id: string;
  label: string;
  tags: string[];
}> = [
  {
    id: "hazard",
    label: "Hazards",
    tags: [
      "railroad",
      "pedestrian",
      "vulnerable-road-user",
      "animal",
      "emergency-vehicle",
      "obstacle-avoidance",
      "near-miss",
    ],
  },
  {
    id: "maneuver",
    label: "Maneuvers",
    tags: [
      "unprotected-left",
      "cut-in",
      "merge",
      "lane-change",
      "roundabout",
      "parking",
      "traffic-light",
      "reaction-time",
    ],
  },
  {
    id: "context",
    label: "Context",
    tags: ["highway", "urban", "weather", "construction", "low-light"],
  },
  {
    id: "verification",
    label: "Verification",
    tags: [
      "human-override",
      "accelerator-override",
      "false-failure",
      "community-note",
      "logs-verified",
      "disputed",
    ],
  },
];

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
  "low-light": "Low light",
  "human-override": "Human override",
  "accelerator-override": "Accelerator override",
  "false-failure": "False failure",
  "community-note": "Community Note",
  "logs-verified": "Logs verified",
  disputed: "Disputed",
};

export function isFalseFailure(clip: Pick<Clip, "falseFailure" | "faultAttribution" | "tags">): boolean {
  return (
    clip.falseFailure ||
    clip.faultAttribution === "human-override" ||
    clip.tags.includes("false-failure")
  );
}
