/**
 * Ustaad Resource Link Resolver & .ics Calendar Generator
 * 
 * Provides deterministic learning resource links and
 * an RFC 5545 calendar (.ics) schedule export for 30/60/90-day roadmaps.
 */

export interface ResolvedResourceLink {
  url: string;
  label: string;
  isDirect: boolean;
  isCurated: boolean;
}

export interface TaskDetail {
  task: string;
  resource: string;
  platform: string;
  estimated_hours: number;
}

export interface WeekPlan {
  week: number;
  focus: string;
  tasks: TaskDetail[];
}

export interface RoadmapData {
  thirty_day_plan?: WeekPlan[];
  sixty_day_plan?: WeekPlan[];
  ninety_day_plan?: WeekPlan[];
  quick_wins?: Array<{ action: string; impact: string; time_required: string }>;
  portfolio_projects_to_build?: Array<{
    project_name: string;
    description: string;
    skills_demonstrated: string[];
    estimated_days: number;
  }>;
}

/**
 * Curated map of verified, canonical free learning courses & documentation.
 */
const CANONICAL_DIRECT_COURSES: Array<{
  matcher: (res: string, plat: string) => boolean;
  url: string;
  label: string;
}> = [
  // CS50 series
  {
    matcher: (r) => r.includes("cs50p") || r.includes("cs50 python"),
    url: "https://cs50.harvard.edu/python/",
    label: "CS50 Python (Harvard)",
  },
  {
    matcher: (r) => r.includes("cs50w") || r.includes("cs50 web"),
    url: "https://cs50.harvard.edu/web/",
    label: "CS50 Web (Harvard)",
  },
  {
    matcher: (r) => r.includes("cs50x") || r === "cs50",
    url: "https://cs50.harvard.edu/x/",
    label: "CS50 Computer Science (Harvard)",
  },
  // Full Stack Open (University of Helsinki)
  {
    matcher: (r, p) => r.includes("full stack open") || p.includes("helsinki"),
    url: "https://fullstackopen.com/en/",
    label: "Full Stack Open (Univ. of Helsinki)",
  },
  // SQL
  {
    matcher: (r) => r.includes("sqlbolt") || r.includes("sql bolt"),
    url: "https://sqlbolt.com/",
    label: "SQLBolt Interactive Lessons",
  },
  // LeetCode / Algorithms practice
  {
    matcher: (r) => r.includes("neetcode"),
    url: "https://neetcode.io/practice",
    label: "NeetCode Practice",
  },
  // System Design
  {
    matcher: (r) => r.includes("system design primer") || r.includes("system-design-primer"),
    url: "https://github.com/donnemartin/system-design-primer",
    label: "System Design Primer (GitHub)",
  },
  // Fast.ai
  {
    matcher: (r, p) => r.includes("fast.ai") || p.includes("fast.ai") || r.includes("practical deep learning"),
    url: "https://course.fast.ai/",
    label: "Practical Deep Learning (fast.ai)",
  },
  // The Odin Project
  {
    matcher: (r, p) => r.includes("odin project") || p.includes("odin"),
    url: "https://www.theodinproject.com/",
    label: "The Odin Project",
  },
  // Roadmap.sh
  {
    matcher: (r, p) => r.includes("roadmap.sh") || p.includes("roadmap.sh"),
    url: "https://roadmap.sh/",
    label: "Developer Roadmaps (roadmap.sh)",
  },
  // Git
  {
    matcher: (r) => r.includes("learngitbranching") || r.includes("learn git branching"),
    url: "https://learngitbranching.js.org/",
    label: "Learn Git Branching",
  },
  // Docker
  {
    matcher: (r) => r.includes("docker curriculum") || r.includes("docker-curriculum"),
    url: "https://docker-curriculum.com/",
    label: "Docker for Beginners",
  },
  // FastAPI
  {
    matcher: (r) => r.includes("fastapi tutorial") || r.includes("fastapi docs"),
    url: "https://fastapi.tiangolo.com/tutorial/",
    label: "FastAPI Official Tutorial",
  },
  // Next.js
  {
    matcher: (r) => r.includes("next.js learn") || r.includes("nextjs learn"),
    url: "https://nextjs.org/learn",
    label: "Learn Next.js (Official)",
  },
  // React
  {
    matcher: (r) => r.includes("react dev") || r.includes("react.dev"),
    url: "https://react.dev/learn",
    label: "React Official Docs (react.dev)",
  },
  // Kaggle micro-courses
  {
    matcher: (r) => r.includes("kaggle python"),
    url: "https://www.kaggle.com/learn/python",
    label: "Kaggle Python Course",
  },
  {
    matcher: (r) => r.includes("kaggle pandas"),
    url: "https://www.kaggle.com/learn/pandas",
    label: "Kaggle Pandas Course",
  },
  {
    matcher: (r) => r.includes("kaggle sql"),
    url: "https://www.kaggle.com/learn/intro-to-sql",
    label: "Kaggle SQL Course",
  },
  {
    matcher: (r) => r.includes("kaggle intro to machine learning") || r.includes("kaggle ml"),
    url: "https://www.kaggle.com/learn/intro-to-machine-learning",
    label: "Kaggle Intro to ML",
  },
  {
    matcher: (r) => r.includes("kaggle intermediate machine learning"),
    url: "https://www.kaggle.com/learn/intermediate-machine-learning",
    label: "Kaggle Intermediate ML",
  },
  {
    matcher: (r) => r.includes("kaggle feature engineering"),
    url: "https://www.kaggle.com/learn/feature-engineering",
    label: "Kaggle Feature Engineering",
  },
  {
    matcher: (r) => r.includes("kaggle deep learning"),
    url: "https://www.kaggle.com/learn/intro-to-deep-learning",
    label: "Kaggle Deep Learning",
  },
  {
    matcher: (r) => r.includes("kaggle computer vision"),
    url: "https://www.kaggle.com/learn/computer-vision",
    label: "Kaggle Computer Vision",
  },
  {
    matcher: (r) => r.includes("kaggle time series"),
    url: "https://www.kaggle.com/learn/time-series",
    label: "Kaggle Time Series",
  },
  {
    matcher: (r) => r.includes("kaggle data visualization"),
    url: "https://www.kaggle.com/learn/data-visualization",
    label: "Kaggle Data Visualization",
  },
  // JavaScript
  {
    matcher: (r) => r.includes("javascript30") || r.includes("javascript 30"),
    url: "https://javascript30.com/",
    label: "JavaScript30 (Wes Bos)",
  },
  {
    matcher: (r) => r.includes("eloquent javascript"),
    url: "https://eloquentjavascript.net/",
    label: "Eloquent JavaScript (Free Book)",
  },
  // Python Automate
  {
    matcher: (r) => r.includes("automate the boring stuff"),
    url: "https://automatetheboringstuff.com/",
    label: "Automate the Boring Stuff with Python",
  },
];

/**
 * Resolves a task resource and platform into a direct or search URL.
 * 
 * 1. Validates explicit URLs for safety (http/https only, no credentials).
 * 2. Checks curated canonical course directory for an exact match.
 * 3. Falls back to a deterministic, platform-targeted search URL.
 */
export function resolveResourceUrl(
  resource: string,
  platform: string
): ResolvedResourceLink {
  const cleanRes = (resource || "").trim();
  const cleanPlat = (platform || "").trim();
  const resLower = cleanRes.toLowerCase();
  const platLower = cleanPlat.toLowerCase();

  // If resource is an explicit HTTP/HTTPS URL, validate and return
  if (cleanRes.startsWith("http://") || cleanRes.startsWith("https://")) {
    try {
      const parsed = new URL(cleanRes);
      if (
        (parsed.protocol === "http:" || parsed.protocol === "https:") &&
        !parsed.username &&
        !parsed.password
      ) {
        return {
          url: parsed.toString(),
          label: cleanPlat || "Suggested Resource",
          isDirect: true,
          isCurated: false,
        };
      }
    } catch {
      // Invalid URL falls through to search fallbacks
    }
  }

  // Layer 1: Curated direct courses
  for (const entry of CANONICAL_DIRECT_COURSES) {
    if (entry.matcher(resLower, platLower)) {
      return {
        url: entry.url,
        label: entry.label,
        isDirect: true,
        isCurated: true,
      };
    }
  }

  // Layer 2: Deterministic search URLs
  const encodedQuery = encodeURIComponent(cleanRes);

  if (platLower.includes("youtube")) {
    return {
      url: `https://www.youtube.com/results?search_query=${encodedQuery}`,
      label: `Watch on YouTube`,
      isDirect: false,
      isCurated: false,
    };
  }

  if (platLower.includes("kaggle")) {
    return {
      url: `https://www.kaggle.com/search?q=${encodedQuery}`,
      label: `Kaggle Search`,
      isDirect: false,
      isCurated: false,
    };
  }

  if (platLower.includes("freecodecamp")) {
    return {
      url: `https://www.freecodecamp.org/news/search/?query=${encodedQuery}`,
      label: `freeCodeCamp`,
      isDirect: false,
      isCurated: false,
    };
  }

  if (platLower.includes("coursera")) {
    return {
      url: `https://www.coursera.org/search?query=${encodedQuery}`,
      label: `Coursera (Free Audit)`,
      isDirect: false,
      isCurated: false,
    };
  }

  if (platLower.includes("edx")) {
    return {
      url: `https://www.edx.org/search?q=${encodedQuery}`,
      label: `edX (Free Audit)`,
      isDirect: false,
      isCurated: false,
    };
  }

  if (platLower.includes("google") || platLower.includes("codelab")) {
    return {
      url: `https://codelabs.developers.google.com/?s=${encodedQuery}`,
      label: `Google Codelabs`,
      isDirect: false,
      isCurated: false,
    };
  }

  if (platLower.includes("github")) {
    return {
      url: `https://github.com/search?q=${encodedQuery}&type=repositories`,
      label: `GitHub Repositories`,
      isDirect: false,
      isCurated: false,
    };
  }

  // Default web search fallback
  const fullSearch = encodeURIComponent(`${cleanRes} ${cleanPlat} free tutorial course`.trim());
  return {
    url: `https://www.google.com/search?q=${fullSearch}`,
    label: cleanPlat ? `${cleanPlat} Resource` : "Learning Resource",
    isDirect: false,
    isCurated: false,
  };
}

/**
 * Format Date to RFC 5545 local datetime string YYYYMMDDTHHMMSS
 */
function formatICSDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Format Date to RFC 5545 true UTC datetime string YYYYMMDDTHHMMSSZ
 */
export function formatICSUTC(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape text for RFC 5545 values (commas, semicolons, backslashes, newlines)
 */
export function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Fold lines at 75 UTF-8 bytes per RFC 5545 Section 3.1.
 * Continuation lines start with a single space.
 */
export function foldICSLine(line: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;

  const decoder = new TextDecoder();
  let result = "";
  let start = 0;
  let isFirst = true;

  while (start < bytes.length) {
    const maxLen = isFirst ? 75 : 74; // continuation lines begin with a single space
    let end = Math.min(start + maxLen, bytes.length);

    // Never split in the middle of a multi-byte UTF-8 sequence (continuation byte: 10xxxxxx)
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end--;
    }

    const chunk = decoder.decode(bytes.slice(start, end));
    if (isFirst) {
      result += chunk;
      isFirst = false;
    } else {
      result += "\r\n " + chunk;
    }
    start = end;
  }
  return result;
}

/**
 * Pure generator for RFC 5545 (.ics) calendar content.
 * Generates twice-weekly study sessions (Mondays and Thursdays 18:00 - 20:00).
 */
export function buildRoadmapICS(
  roadmapData: RoadmapData | null | undefined,
  targetRole: string = "Tech Career",
  now: Date = new Date()
): string | null {
  if (!roadmapData) return null;

  const allWeeks: WeekPlan[] = [];
  if (Array.isArray(roadmapData.thirty_day_plan)) {
    allWeeks.push(...roadmapData.thirty_day_plan);
  }
  if (Array.isArray(roadmapData.sixty_day_plan)) {
    allWeeks.push(...roadmapData.sixty_day_plan);
  }
  if (Array.isArray(roadmapData.ninety_day_plan)) {
    allWeeks.push(...roadmapData.ninety_day_plan);
  }

  if (allWeeks.length === 0) return null;

  const cleanRole = targetRole.replace(/[\r\n]+/g, " ").trim() || "Tech Career";

  // Determine starting Monday (next upcoming Monday at 18:00 local time)
  const dayOfWeek = now.getDay();
  const daysUntilNextMonday = ((1 - dayOfWeek + 7) % 7) || 7;
  const startMonday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysUntilNextMonday,
    18,
    0,
    0
  );

  const rawEvents: string[] = [];
  const dtstamp = formatICSUTC(now);

  allWeeks.forEach((week, weekIndex) => {
    const mondayDate = new Date(startMonday);
    mondayDate.setDate(startMonday.getDate() + weekIndex * 7);

    const thursdayDate = new Date(mondayDate);
    thursdayDate.setDate(mondayDate.getDate() + 3);

    const tasks = Array.isArray(week.tasks) ? week.tasks : [];
    const mid = Math.ceil(tasks.length / 2);
    const session1Tasks = tasks.slice(0, mid);
    const session2Tasks = tasks.slice(mid);

    const sessions = [
      {
        date: mondayDate,
        title: `Ustaad Roadmap [Week ${week.week || weekIndex + 1} - Part 1]: ${week.focus || "Core Skills"}`,
        tasks: session1Tasks.length > 0 ? session1Tasks : tasks,
        sessionNum: 1,
      },
      {
        date: thursdayDate,
        title: `Ustaad Roadmap [Week ${week.week || weekIndex + 1} - Part 2]: ${week.focus || "Core Skills"}`,
        tasks: session2Tasks.length > 0 ? session2Tasks : tasks,
        sessionNum: 2,
      },
    ];

    sessions.forEach((s) => {
      const startTime = new Date(s.date);
      const endTime = new Date(s.date);
      endTime.setHours(endTime.getHours() + 2);

      const taskDescriptions = s.tasks.map((t, idx) => {
        const link = resolveResourceUrl(t.resource, t.platform);
        return `${idx + 1}. ${t.task || "Task"} (${t.estimated_hours || 2}h)\n   Resource: ${t.resource || "Resource"} [${t.platform || "Online"}]\n   Link: ${link.url}`;
      });

      const desc = escapeICSText(
        `Focus: ${week.focus || "Skill development"}\n` +
        `Role: ${cleanRole}\n\n` +
        `Study Tasks:\n` +
        taskDescriptions.join("\n\n") +
        `\n\nGenerated by Ustaad Career OS (https://www.ustaad.systems)`
      );

      const uid = `ustaad-w${week.week || weekIndex + 1}-s${s.sessionNum}-${startTime.getTime()}@ustaad.systems`;

      const lines = [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${formatICSDate(startTime)}`,
        `DTEND:${formatICSDate(endTime)}`,
        `SUMMARY:${escapeICSText(s.title)}`,
        `DESCRIPTION:${desc}`,
        "LOCATION:Online Learning",
        "STATUS:CONFIRMED",
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeICSText(`Reminder: ${s.title}`)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
      rawEvents.push(...lines);
    });
  });

  const calendarLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AgenticEra Systems//Ustaad Career OS Roadmap//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICSText(`Ustaad 90-Day Roadmap (${cleanRole})`)}`,
    ...rawEvents,
    "END:VCALENDAR",
  ];

  return calendarLines.map(foldICSLine).join("\r\n");
}

/**
 * Generates and downloads an RFC 5545 (.ics) calendar file.
 */
export function downloadRoadmapICS(
  roadmapData: RoadmapData | null | undefined,
  targetRole: string = "Tech Career"
): void {
  const content = buildRoadmapICS(roadmapData, targetRole);
  if (!content) return;

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeRole = targetRole.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "career";
  a.download = `ustaad-roadmap-${safeRole}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
