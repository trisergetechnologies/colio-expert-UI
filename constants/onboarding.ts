/** Mirrors backend User model enums */
export const CONSULTANT_CATEGORIES = [
  "Loneliness",
  "Breakup",
  "Feeling Low",
  "Stress",
  "Overthinking",
] as const;

export const CONSULTANT_SKILLS = [
  "active-listening",
  "empathy",
  "stress-management",
  "relationship-advice",
  "career-guidance",
  "general-chat",
  "anxiety-support",
  "motivation",
  "life-coaching",
] as const;

export const SKILL_LABELS: Record<string, string> = {
  "active-listening": "Active listening",
  empathy: "Empathy",
  "stress-management": "Stress management",
  "relationship-advice": "Relationship advice",
  "career-guidance": "Career guidance",
  "general-chat": "General chat",
  "anxiety-support": "Anxiety support",
  motivation: "Motivation",
  "life-coaching": "Life coaching",
};

export const LANGUAGE_OPTIONS: { label: string; value: string }[] = [
  { label: "English", value: "english" },
  { label: "Hindi", value: "hindi" },
  { label: "Kannada", value: "kannada" },
  { label: "Marathi", value: "marathi" },
  { label: "Telugu", value: "telugu" },
  { label: "Bengali", value: "bengali" },
  { label: "Malayalam", value: "malayalam" },
  { label: "Punjabi", value: "punjabi" },
];

export const API_BASE_URL = "https://api.colio.in/api";
