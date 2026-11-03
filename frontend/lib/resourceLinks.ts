/**
 * Ustaad Resource Link Resolver & .ics Calendar Generator
 * 
 * Provides guaranteed-working zero-404 learning resource links and
 * an RFC 5545 calendar (.ics) schedule export for 30/60/90-day roadmaps.
 */

export interface ResolvedResourceLink {
  url: string;
  label: string;
  isDirect: boolean;
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
    label: "CS50x Computer Science",
  },
  // Full Stack Open
  {
    matcher: (r) => r.includes("full stack open") || r.includes("fullstack open"),
    url: "https://fullstackopen.com/en/",
    label: "Full Stack Open (Univ. of Helsinki)",
  },
  // SQLBolt & SQL Practice
  {
    matcher: (r) => r.includes("sqlbolt"),
    url: "https://sqlbolt.com/",
    label: "SQLBolt Interactive Lessons",
  },
  // NeetCode & DSA
  {
    matcher: (r) => r.includes("neetcode"),
    url: "https://neetcode.io/practice",
    label: "NeetCode Roadmap & Practice",
  },
  // System Design Primer
  {
    matcher: (r) => r.includes("system design primer"),
    url: "https://github.com/donnemartin/system-design-primer",
    label: "System Design Primer",
  },
  // Fast.ai
  {
    matcher: (r) => r.includes("fast.ai") || r.includes("fastai") || r.includes("practical deep learning"),
    url: "https://course.fast.ai/",
    label: "Practical Deep Learning (fast.ai)",
  },
  // The Odin Project
  {
    matcher: (r) => r.includes("odin project"),
    url: "https://www.theodinproject.com/",
    label: "The Odin Project Curriculum",
  },
  // roadmap.sh
  {
    matcher: (r) => r.includes("roadmap.sh"),
    url: "https://roadmap.sh/",
    label: "Developer Roadmaps (roadmap.sh)",
  },
  // Learn Git Branching
  {
    matcher: (r) => r.includes("learngitbranching") || (r.includes("git") && r.includes("branching")),
    url: "https://learngitbranching.js.org/",
    label: "Learn Git Branching Interactive",
  },
  // Docker Curriculum
  {
    matcher: (r) => r.includes("docker") && (r.includes("curriculum") || r.includes("get started")),
    url: "https://docker-curriculum.com/",
    label: "Docker Curriculum for Beginners",
  },
  // FastAPI Docs
  {
    matcher: (r) => r.includes("fastapi") && (r.includes("docs") || r.includes("tutorial")),
    url: "https://fastapi.tiangolo.com/tutorial/",
    label: "FastAPI Official Tutorial",
  },
  // Next.js Learn
  {
    matcher: (r) => (r.includes("nextjs") || r.includes("next.js")) && (r.includes("learn") || r.includes("docs") || r.includes("dashboard")),
    url: "https://nextjs.org/learn",
    label: "Next.js Official Learn Course",
  },
  // React.dev Learn
  {
    matcher: (r) => r.includes("react") && (r.includes("docs") || r.includes("learn")),
    url: "https://react.dev/learn",
    label: "React Official Documentation",
  },
  // Kaggle Learn Courses
  {
    matcher: (r, p) => (p.includes("kaggle") || r.includes("kaggle")) && r.includes("python"),
    url: "https://www.kaggle.com/learn/python",
    label: "Kaggle Learn: Python",
  },
  {
    matcher: (r, p) => (p.includes("kaggle") || r.includes("kaggle")) && r.includes("pandas"),
    url: "https://www.kaggle.com/learn/pandas",
    label: "Kaggle Learn: Pandas",
  },
  {
    matcher: (r, p) => (p.includes("kaggle") || r.includes("kaggle")) && r.includes("sql"),
    url: "https://www.kaggle.com/learn/intro-to-sql",
    label: "Kaggle Learn: Intro to SQL",
  },
  {
    matcher: (r, p) => (p.includes("kaggle") || r.includes("kaggle")) && (r.includes("intro to ml") || r.includes("intro to machine learning") || (r.includes("machine learning") && !r.includes("intermediate"))),
    url: "https://www.kaggle.com/learn/intro-to-machine-learning",
    label: "Kaggle: Intro to Machine Learning",
  },
  {
    matcher: (r, p) => (p.includes("kaggle") || r.includes("kaggle")) && r.includes("intermediate machine learning"),
    url: "https://www.kaggle.com/learn/intermediate-machine-learning",
    label: "Kaggle: Intermediate ML",
  },
  {
    matcher: (r, p) => (p.includes("kaggle") || r.includes("kaggle")) && r.includes("feature engineering"),
    url: "https://www.kaggle.com/learn/feature-engineering",
    label: "Kaggle: Feature Engineering",
  },
  {
    matcher: (r, p) => (p.includes("kaggle") || r.includes("kaggle")) && (r.includes("deep learning") || r.includes("intro to dl")),
    url: "https://www.kaggle.com/learn/intro-to-deep-learning",
    label: "Kaggle: Intro to Deep Learning",
  },
  {
    matcher: (r, p) => (p.includes("kaggle") || r.includes("kaggle")) && r.includes("computer vision"),
    url: "https://www.kaggle.com/learn/computer-vision",
    label: "Kaggle: Computer Vision",
  },
  {
    matcher: (r, p) => (p.includes("kaggle") || r.includes("kaggle")) && r.includes("time series"),
    url: "https://www.kaggle.com/learn/time-series",
    label: "Kaggle: Time Series",
  },
  {
    matcher: (r, p) => (p.includes("kaggle") || r.includes("kaggle")) && r.includes("data visualization"),
    url: "https://www.kaggle.com/learn/data-visualization",
    label: "Kaggle: Data Visualization",
  },
  // Additional high-frequency resources
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
  {
    matcher: (r) => r.includes("automate the boring stuff"),
    url: "https://automatetheboringstuff.com/",
    label: "Automate the Boring Stuff with Python",
  },
];

/**
 * Resolves a task resource and platform into a guaranteed, zero-404 URL.
 * 
 * 1. Checks curated canonical course directory for an exact permanent match.
 * 2. Falls back to a deterministic, platform-targeted search URL that never 404s.
 */
export function resolveResourceUrl(
  resource: string,
  platform: string
): ResolvedResourceLink {
  const cleanRes = (resource || "").trim();
  const cleanPlat = (platform || "").trim();
  const resLower = cleanRes.toLowerCase();
  const platLower = cleanPlat.toLowerCase();

  // If resource is already an explicit HTTP/HTTPS URL, return directly
  if (cleanRes.startsWith("http://") || cleanRes.startsWith("https://")) {
    return {
      url: cleanRes,
      label: cleanPlat || "Direct Resource",
      isDirect: true,
    };
  }

  // Layer 1: Curated direct courses
  for (const entry of CANONICAL_DIRECT_COURSES) {
    if (entry.matcher(resLower, platLower)) {
      return {
        url: entry.url,
        label: entry.label,
        isDirect: true,
      };
    }
  }

  // Layer 2: Deterministic zero-404 platform searches
  const encodedQuery = encodeURIComponent(cleanRes);

  if (platLower.includes("youtube")) {
    return {
      url: `https://www.youtube.com/results?search_query=${encodedQuery}`,
      label: `Watch on YouTube`,
      isDirect: false,
    };
  }

  if (platLower.includes("kaggle")) {
    return {
      url: `https://www.kaggle.com/search?q=${encodedQuery}`,
      label: `Kaggle Search`,
      isDirect: false,
    };
  }

  if (platLower.includes("freecodecamp")) {
    return {
      url: `https://www.freecodecamp.org/news/search/?query=${encodedQuery}`,
      label: `freeCodeCamp`,
      isDirect: false,
    };
  }

  if (platLower.includes("coursera")) {
    return {
      url: `https://www.coursera.org/search?query=${encodedQuery}`,
      label: `Coursera (Free Audit)`,
      isDirect: false,
    };
  }

  if (platLower.includes("edx")) {
    return {
      url: `https://www.edx.org/search?q=${encodedQuery}`,
      label: `edX (Free Audit)`,
      isDirect: false,
    };
  }

  if (platLower.includes("google") || platLower.includes("codelab")) {
    return {
      url: `https://codelabs.developers.google.com/?s=${encodedQuery}`,
      label: `Google Codelabs`,
      isDirect: false,
    };
  }

  if (platLower.includes("github")) {
    return {
      url: `https://github.com/search?q=${encodedQuery}&type=repositories`,
      label: `GitHub Repositories`,
      isDirect: false,
    };
  }

  // Default web search fallback (never 404s)
  const fullSearch = encodeURIComponent(`${cleanRes} ${cleanPlat} free tutorial course`.trim());
  return {
    url: `https://www.google.com/search?q=${fullSearch}`,
    label: cleanPlat ? `${cleanPlat} Resource` : "Learning Resource",
    isDirect: false,
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
 * Escape text for RFC 5545 values (commas, semicolons, backslashes, newlines)
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Generates and downloads an RFC 5545 (.ics) calendar file containing
 * twice-weekly structured study sessions (Mondays and Thursdays 18:00 - 20:00)
 * for the candidate's learning roadmap.
 */
export function downloadRoadmapICS(
  roadmapData: RoadmapData | null | undefined,
  targetRole: string = "Tech Career"
): void {
  if (!roadmapData) return;

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

  if (allWeeks.length === 0) return;

  // Determine starting Monday (next upcoming Monday at 18:00 local time)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, ...
  const daysUntilNextMonday = ((1 - dayOfWeek + 7) % 7) || 7;
  const startMonday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysUntilNextMonday,
    18,
    0,
    0
  );

  const events: string[] = [];
  const dtstamp = formatICSDate(new Date()) + "Z";

  allWeeks.forEach((week, weekIndex) => {
    // 2 study blocks per week:
    // Session 1: Monday 18:00 - 20:00
    // Session 2: Thursday 18:00 - 20:00 (Monday + 3 days)
    const mondayDate = new Date(startMonday);
    mondayDate.setDate(startMonday.getDate() + weekIndex * 7);

    const thursdayDate = new Date(mondayDate);
    thursdayDate.setDate(mondayDate.getDate() + 3);

    const tasks = week.tasks || [];
    const mid = Math.ceil(tasks.length / 2);
    const session1Tasks = tasks.slice(0, mid);
    const session2Tasks = tasks.slice(mid);

    const sessions = [
      {
        date: mondayDate,
        title: `Ustaad Roadmap [Week ${week.week} - Part 1]: ${week.focus}`,
        tasks: session1Tasks.length > 0 ? session1Tasks : tasks,
        sessionNum: 1,
      },
      {
        date: thursdayDate,
        title: `Ustaad Roadmap [Week ${week.week} - Part 2]: ${week.focus}`,
        tasks: session2Tasks.length > 0 ? session2Tasks : tasks,
        sessionNum: 2,
      },
    ];

    sessions.forEach((s) => {
      const startTime = new Date(s.date);
      const endTime = new Date(s.date);
      endTime.setHours(endTime.getHours() + 2); // 2-hour study block

      const taskDescriptions = s.tasks.map((t, idx) => {
        const link = resolveResourceUrl(t.resource, t.platform);
        return `${idx + 1}. ${t.task} (${t.estimated_hours}h)\n   Resource: ${t.resource} [${t.platform}]\n   Link: ${link.url}`;
      });

      const desc = escapeICSText(
        `Focus: ${week.focus}\n` +
        `Role: ${targetRole}\n\n` +
        `Study Tasks:\n` +
        taskDescriptions.join("\n\n") +
        `\n\nGenerated by Ustaad Career OS (https://www.ustaad.systems)`
      );

      const uid = `ustaad-w${week.week}-s${s.sessionNum}-${startTime.getTime()}@ustaad.systems`;

      events.push(
        [
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
          `DESCRIPTION:Reminder: ${escapeICSText(s.title)}`,
          "END:VALARM",
          "END:VEVENT",
        ].join("\r\n")
      );
    });
  });

  const calendarContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AgenticEra Systems//Ustaad Career OS Roadmap//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Ustaad 90-Day Roadmap (${targetRole})`,
    "X-WR-TIMEZONE:Asia/Karachi",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([calendarContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeRole = targetRole.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "career";
  a.download = `ustaad-roadmap-${safeRole}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

