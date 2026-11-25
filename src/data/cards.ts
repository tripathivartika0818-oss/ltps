import { TRICKS } from './tricks';
import type { Card } from './types';

export const TWOMARK_CARDS: Card[] = [
  {
    id: 'tm-1',
    unit: 1,
    source: 'twomark',
    front: 'Use of #include?',
    back: "A preprocessor directive that copies a header file's declarations into the program before compilation so library functions like printf are known. <> for system headers, \"\" for your own.",
  },
  {
    id: 'tm-2',
    unit: 2,
    source: 'twomark',
    front: 'Syntax of for loop?',
    back: 'for (init; condition; update) { body } Init runs once, condition is checked before every pass, update runs after each pass. Example: for (i = 1; i <= 5; i++) printf("%d ", i);',
  },
  {
    id: 'tm-3',
    unit: 3,
    source: 'twomark',
    front: 'What is a NULL pointer?',
    back: 'A pointer holding no valid address (value 0): int *p = NULL; Dereferencing it crashes the program.',
  },
  {
    id: 'tm-4',
    unit: 3,
    source: 'twomark',
    front: 'Need of structure and its syntax?',
    back: 'To group different data types as one record. struct Student { int roll; char name[50]; float marks; }; struct Student s1;',
  },
  {
    id: 'tm-5',
    unit: 3,
    source: 'twomark',
    front: 'Purpose of calloc?',
    back: 'Allocates memory for n elements of a given size and sets all of it to zero: p = (int *) calloc(n, sizeof(int)); returns NULL on failure.',
  },
  {
    id: 'tm-6',
    unit: 3,
    source: 'twomark',
    front: 'Purpose of malloc and calloc?',
    back: 'malloc(bytes) gives uninitialised memory; calloc(n, size) gives zero-initialised memory for n elements. Both come from the heap and return NULL on failure.',
  },
  {
    id: 'tm-7',
    unit: 2,
    source: 'twomark',
    front: 'while vs do-while?',
    back: 'while checks the condition first and may run zero times; do-while runs the body once, then checks, so it runs at least once and ends with a semicolon.',
  },
  {
    id: 'tm-8',
    unit: 1,
    source: 'twomark',
    front: 'Algorithm and two characteristics?',
    back: 'A finite step-by-step procedure to solve a problem. Characteristics: finite (it ends), unambiguous (each step is clear), has input and output, effective.',
  },
  {
    id: 'tm-9',
    unit: 3,
    source: 'twomark',
    front: 'Structure vs union?',
    back: 'Structure: each member has its own memory, size is the sum (plus padding). Union: members share memory, size is the largest member, one value at a time.',
  },
  {
    id: 'tm-10',
    unit: 2,
    source: 'twomark',
    front: 'Syntax of while loop?',
    back: 'while (condition) { body } Example: i = 1; while (i <= 5) { printf("%d ", i); i++; }',
  },
  {
    id: 'tm-11',
    unit: 3,
    source: 'twomark',
    front: 'What is a double pointer?',
    back: 'A pointer that stores the address of another pointer: int **pp = &p; **pp gives the value of the original variable.',
  },
  {
    id: 'tm-12',
    unit: 3,
    source: 'twomark',
    front: 'Purpose of realloc?',
    back: 'Changes the size of an earlier allocated block and keeps the old data: p = (int *) realloc(p, new_bytes); it may move the block and returns NULL on failure.',
  },
  {
    id: 'tm-13',
    unit: 1,
    source: 'twomark',
    front: 'const vs #define?',
    back: 'const makes a typed read-only variable; #define is a text substitution done before compilation, with no type.',
  },
  {
    id: 'tm-14',
    unit: 2,
    source: 'twomark',
    front: 'Arguments vs parameters?',
    back: 'Arguments are the values in the function call; parameters are the variables in the function definition that receive them.',
  },
  {
    id: 'tm-15',
    unit: 1,
    source: 'twomark',
    front: 'Algorithm vs flowchart?',
    back: 'An algorithm is written steps; a flowchart is the same steps drawn with symbols.',
  },
];

function firstSentence(story: string): string {
  const idx = story.indexOf('.');
  return idx === -1 ? story : story.slice(0, idx + 1);
}

export const CAST_CARDS: Card[] = TRICKS.flatMap((trick) => {
  if (!trick.cast) return [];
  const lead = firstSentence(trick.story);
  return trick.cast.map(([role, term], idx) => ({
    id: `cast-${trick.id}-${idx}`,
    unit: trick.unit,
    source: 'cast' as const,
    role,
    trickTitle: trick.title,
    front: `${lead} In this story, who is the ${role}?`,
    back: term,
  }));
});

export const DRILL_CARDS: Card[] = [...TWOMARK_CARDS, ...CAST_CARDS];
