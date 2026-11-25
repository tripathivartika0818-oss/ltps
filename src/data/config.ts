import type { MarkCardConfig, QuickAction, Unit } from './types';

function getDefaultExamAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00:00`;
}

// Editable exam timestamp (local time). Default: tomorrow 9:00 AM local.
export const EXAM_AT = getDefaultExamAt();

export const APP_CONFIG = {
  appName: 'LTPS Night',
  wordmark: 'ltps',
  courseTitle: 'Logical Thinking & Problem Solving',
  courseCode: '25CSH-107',
  altCourseCode: '26CSH-107',
  semester: 'Semester 1',
  totalMarks: 60,
  durationHours: 3,
  nightWindow: {
    startLabel: '5:00 PM',
    endLabel: '9:00 AM',
    startHour: 17,
    endHour: 9,
  },
  examShape: [
    { section: 'Section A', formula: '5 × 2 = 10', note: 'All 5 questions compulsory' },
    { section: 'Section B', formula: '4 × 5 = 20', note: 'All 4 questions compulsory' },
    { section: 'Section C', formula: '3 × 10 = 30', note: 'Q10 and Q11 compulsory; attempt Q12 or Q13' },
  ],
  outputReminder: 'Write the sample output under every program.',
  honestNotes: [
    'The 2025-26 paper is the only real paper. Practice sets 1 and 2 and the Noteify sample are unofficial.',
    'The Armstrong program is not in your notes (Noteify or handwritten); the template here is the one to rely on.',
    'Not official: mark splits and "seen" counts include unofficial papers where noted.',
  ],
};

export const UNITS: Unit[] = [
  {
    n: 1,
    name: 'Basic concepts of C (problem solving, flowcharts, C basics, operators, decision control)',
    marks: 17,
    color: '#2F7D6B',
  },
  {
    n: 2,
    name: 'Loops, arrays, strings, functions',
    marks: 17,
    color: '#C98A12',
  },
  {
    n: 3,
    name: 'Pointers, structures, union, dynamic memory',
    marks: 26,
    color: '#F0501E',
  },
];

export const UNIT_MAP: Record<1 | 2 | 3, Unit> = {
  1: UNITS[0],
  2: UNITS[1],
  3: UNITS[2],
};

export const MARK_SPLIT = {
  heading: "Last year's mark split",
  subtext:
    'From the 2025-26 End Sem, counting Q12 and skipping Q13. Call by reference (Q8) is counted under Unit 3. Not official for this paper.',
  detailNote:
    'How it was counted (2025-26 paper): Unit 1 = Q1, Q6, Q10 (2+5+10). Unit 2 = Q2, Q7, Q11 (2+5+10). Unit 3 = Q3, Q4, Q5, Q8, Q9, Q12 (2+2+2+5+5+10). If Q8 is counted under Unit 2 instead, it is 17 / 22 / 21.',
};

export const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Recall the Armstrong program', route: '/code?template=t-armstrong' },
  { label: 'Drill 2-mark cards', route: '/drill' },
  { label: 'Open Q13 student records', route: '/code?template=t-students' },
  { label: 'Print cheat sheet', route: '/sheet' },
];

export const MARK_CARDS: MarkCardConfig[] = [
  {
    id: 'mc-q10',
    title: 'Q10 flowcharts of decision statements',
    subtitle: '10M · Unit 1 · 4 flowcharts + syntax + example',
    unit: 1,
    templateId: 't-flowcharts',
  },
  {
    id: 'mc-q11',
    title: 'Q11 Armstrong numbers in a range',
    subtitle: '10M · Unit 2 · Count digits, power, sum, compare',
    unit: 2,
    templateId: 't-armstrong',
  },
  {
    id: 'mc-q12-q13',
    title: 'Q12 or Q13: DMA or array of structures',
    subtitle: '10M · Unit 3 · Preview Q13 student records',
    unit: 3,
    templateId: 't-students',
    altTemplateId: 't-dma',
    altLabel: 'Open Q12 DMA',
  },
];
