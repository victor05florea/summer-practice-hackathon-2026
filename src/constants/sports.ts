export const SPORTS = [
  "Football",
  "Basketball",
  "Tennis",
  "Running",
  "Cycling",
  "Volleyball",
  "Swimming",
  "Padel",
  "Golf",
  "Hiking",
  "Yoga",
  "Gym",
  "Calisthenics",
  "Skateboarding",
  "Skiing",
  "Boxing",
  "Badminton",
] as const;

export const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export const GENDERS = ["Male", "Female"] as const;

export const SPORT_SIZES: Record<string, number> = {
  Football: 10,
  Basketball: 10,
  Tennis: 4,
  Volleyball: 12,
  Padel: 4,
  Running: 8,
  Cycling: 8,
  Swimming: 6,
  Golf: 4,
  Hiking: 10,
  Yoga: 15,
  Gym: 6,
  Calisthenics: 8,
  Skateboarding: 6,
  Skiing: 8,
  Boxing: 4,
  Badminton: 4,
};

export const SPORT_ICONS: Record<string, string> = {
  Football: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  Volleyball: "🏐",
  Padel: "🎾",
  Running: "🏃",
  Cycling: "🚴",
  Swimming: "🏊",
  Golf: "⛳",
  Hiking: "🥾",
  Yoga: "🧘",
  Gym: "💪",
  Calisthenics: "🤸",
  Skateboarding: "🛹",
  Skiing: "⛷️",
  Boxing: "🥊",
  Badminton: "🏸",
};

export const sportSize = (sport: string) => SPORT_SIZES[sport] || 10;
export const sportIcon = (sport: string) => SPORT_ICONS[sport] || "🏃";
