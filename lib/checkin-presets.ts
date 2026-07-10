import type { QuestionInput } from "@/lib/validations/templates";

export interface CheckInPreset {
  id: string;
  title: string;
  description: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
  questions: QuestionInput[];
}

// A starter library — add one with a click instead of building question by
// question. Once added, each behaves exactly like a manually-built
// check-in: it follows its cadence automatically, no further action needed.
export const CHECKIN_PRESETS: CheckInPreset[] = [
  {
    id: "daily-mood",
    title: "Daily mood check-in",
    description: "A quick daily pulse on mood, sleep, and coping.",
    frequency: "daily",
    questions: [
      {
        type: "scale",
        label: "How would you rate your mood today?",
        isRequired: true,
        min: 1,
        max: 5,
      },
      {
        type: "single_choice",
        label: "How well did you sleep last night?",
        isRequired: true,
        options: ["Excellent", "Good", "Fair", "Poor"],
      },
      {
        type: "multi_choice",
        label: "Which coping skills did you use today?",
        isRequired: false,
        options: ["Deep breathing", "Walking", "Journaling", "Meditation", "Talking to someone", "None"],
      },
      {
        type: "short_reflection",
        label: "Anything on your mind? (optional)",
        isRequired: false,
        maxLength: 250,
      },
    ],
  },
  {
    id: "weekly-anxiety",
    title: "Weekly anxiety scale",
    description: "A short weekly check on anxiety levels and triggers.",
    frequency: "weekly",
    questions: [
      {
        type: "scale",
        label: "How anxious have you felt this week overall?",
        isRequired: true,
        min: 1,
        max: 5,
      },
      {
        type: "yes_no",
        label: "Did anxiety interfere with your daily routine this week?",
        isRequired: true,
      },
      {
        type: "short_reflection",
        label: "What tended to trigger it, if anything?",
        isRequired: false,
        maxLength: 250,
      },
    ],
  },
  {
    id: "weekly-gratitude",
    title: "Weekly gratitude practice",
    description: "A lightweight weekly gratitude prompt.",
    frequency: "weekly",
    questions: [
      {
        type: "short_reflection",
        label: "What's one thing you're grateful for this week?",
        isRequired: true,
        maxLength: 250,
      },
      {
        type: "scale",
        label: "How connected did you feel to others this week?",
        isRequired: true,
        min: 1,
        max: 5,
      },
    ],
  },
  {
    id: "biweekly-progress",
    title: "Biweekly progress reflection",
    description: "A short check-in on progress toward goals every two weeks.",
    frequency: "biweekly",
    questions: [
      {
        type: "scale",
        label: "How much progress do you feel you've made toward your goals?",
        isRequired: true,
        min: 1,
        max: 5,
      },
      {
        type: "short_reflection",
        label: "What's felt hardest lately?",
        isRequired: false,
        maxLength: 300,
      },
      {
        type: "short_reflection",
        label: "What's felt easier or more manageable lately?",
        isRequired: false,
        maxLength: 300,
      },
    ],
  },
  {
    id: "monthly-checkin",
    title: "Monthly big-picture check-in",
    description: "A once-a-month zoom-out on how things are going overall.",
    frequency: "monthly",
    questions: [
      {
        type: "scale",
        label: "Overall, how would you rate this past month?",
        isRequired: true,
        min: 1,
        max: 5,
      },
      {
        type: "single_choice",
        label: "How stable has your routine felt this month?",
        isRequired: true,
        options: ["Very stable", "Mostly stable", "Somewhat unstable", "Very unstable"],
      },
      {
        type: "short_reflection",
        label: "What would you like to focus on next month?",
        isRequired: false,
        maxLength: 300,
      },
    ],
  },
];
