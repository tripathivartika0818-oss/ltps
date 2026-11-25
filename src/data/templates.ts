import type { FlowchartVariant, Template } from './types';

export const FLOWCHART_VARIANTS: FlowchartVariant[] = [
  {
    id: 'if',
    label: 'if',
    outline: 'Start -> Condition? -- Yes -> Body -> Next statement -> End; No -> Next statement.',
    syntax: `if (num > 0) { printf("Positive"); }`,
    nodes: [
      { id: 'start', shape: 'oval', label: 'Start', x: 180, y: 20 },
      { id: 'cond', shape: 'diamond', label: 'Condition?', x: 180, y: 100 },
      { id: 'body', shape: 'rectangle', label: 'Body', x: 320, y: 190 },
      { id: 'next', shape: 'rectangle', label: 'Next statement', x: 180, y: 270 },
      { id: 'end', shape: 'oval', label: 'End', x: 180, y: 350 },
    ],
    edges: [
      { from: 'start', to: 'cond' },
      { from: 'cond', to: 'body', label: 'Yes' },
      { from: 'cond', to: 'next', label: 'No' },
      { from: 'body', to: 'next' },
      { from: 'next', to: 'end' },
    ],
  },
  {
    id: 'if-else',
    label: 'if-else',
    outline: 'Start -> Condition? -- Yes -> Block A; No -> Block B; both -> Next statement -> End.',
    syntax: `if (num % 2 == 0) { printf("Even"); } else { printf("Odd"); }`,
    nodes: [
      { id: 'start', shape: 'oval', label: 'Start', x: 190, y: 20 },
      { id: 'cond', shape: 'diamond', label: 'Condition?', x: 190, y: 100 },
      { id: 'blockA', shape: 'rectangle', label: 'Block A', x: 75, y: 195 },
      { id: 'blockB', shape: 'rectangle', label: 'Block B', x: 305, y: 195 },
      { id: 'next', shape: 'rectangle', label: 'Next statement', x: 190, y: 280 },
      { id: 'end', shape: 'oval', label: 'End', x: 190, y: 355 },
    ],
    edges: [
      { from: 'start', to: 'cond' },
      { from: 'cond', to: 'blockA', label: 'Yes' },
      { from: 'cond', to: 'blockB', label: 'No' },
      { from: 'blockA', to: 'next' },
      { from: 'blockB', to: 'next' },
      { from: 'next', to: 'end' },
    ],
  },
  {
    id: 'ladder',
    label: 'if-else-if ladder',
    outline: 'Start -> Cond1? Yes -> S1; No -> Cond2? Yes -> S2; No -> Cond3? Yes -> S3; No -> else block; all -> End.',
    syntax: `if (marks >= 90) { printf("Grade A"); }
else if (marks >= 75) { printf("Grade B"); }
else if (marks >= 60) { printf("Grade C"); }
else { printf("Fail"); }`,
    nodes: [
      { id: 'start', shape: 'oval', label: 'Start', x: 100, y: 16 },
      { id: 'c1', shape: 'diamond', label: 'Cond1?', x: 100, y: 86 },
      { id: 's1', shape: 'rectangle', label: 'S1', x: 285, y: 86 },
      { id: 'c2', shape: 'diamond', label: 'Cond2?', x: 100, y: 166 },
      { id: 's2', shape: 'rectangle', label: 'S2', x: 285, y: 166 },
      { id: 'c3', shape: 'diamond', label: 'Cond3?', x: 100, y: 246 },
      { id: 's3', shape: 'rectangle', label: 'S3', x: 285, y: 246 },
      { id: 'elseb', shape: 'rectangle', label: 'else block', x: 100, y: 326 },
      { id: 'end', shape: 'oval', label: 'End', x: 200, y: 392 },
    ],
    edges: [
      { from: 'start', to: 'c1' },
      { from: 'c1', to: 's1', label: 'Yes' },
      { from: 'c1', to: 'c2', label: 'No' },
      { from: 'c2', to: 's2', label: 'Yes' },
      { from: 'c2', to: 'c3', label: 'No' },
      { from: 'c3', to: 's3', label: 'Yes' },
      { from: 'c3', to: 'elseb', label: 'No' },
      { from: 's1', to: 'end' },
      { from: 's2', to: 'end' },
      { from: 's3', to: 'end' },
      { from: 'elseb', to: 'end' },
    ],
  },
  {
    id: 'switch',
    label: 'switch',
    outline: 'Start -> Evaluate expression -> match case 1 -> S1 -> break; match case 2 -> S2 -> break; no match -> default -> Sd; all -> End.',
    syntax: `switch (day) {
    case 1: printf("Sunday"); break;
    case 2: printf("Monday"); break;
    default: printf("Invalid day");
}`,
    nodes: [
      { id: 'start', shape: 'oval', label: 'Start', x: 190, y: 18 },
      { id: 'eval', shape: 'diamond', label: 'Evaluate expr', x: 190, y: 95 },
      { id: 's1', shape: 'rectangle', label: 'S1 -> break', x: 65, y: 200 },
      { id: 's2', shape: 'rectangle', label: 'S2 -> break', x: 190, y: 200 },
      { id: 'sd', shape: 'rectangle', label: 'default -> Sd', x: 320, y: 200 },
      { id: 'end', shape: 'oval', label: 'End', x: 190, y: 310 },
    ],
    edges: [
      { from: 'start', to: 'eval' },
      { from: 'eval', to: 's1', label: 'case 1' },
      { from: 'eval', to: 's2', label: 'case 2' },
      { from: 'eval', to: 'sd', label: 'no match' },
      { from: 's1', to: 'end' },
      { from: 's2', to: 'end' },
      { from: 'sd', to: 'end' },
    ],
  },
];

export const TEMPLATES: Template[] = [
  {
    id: 't-flowcharts',
    unit: 1,
    title: 'Flowcharts of decision statements',
    marks: 10,
    qRef: 'Q10',
    isDiagramOnly: true,
    flowchartVariants: FLOWCHART_VARIANTS,
    code: `// 1. if
if (num > 0) { printf("Positive"); }

// 2. if-else
if (num % 2 == 0) { printf("Even"); } else { printf("Odd"); }

// 3. if-else-if ladder
if (marks >= 90) { printf("Grade A"); }
else if (marks >= 75) { printf("Grade B"); }
else if (marks >= 60) { printf("Grade C"); }
else { printf("Fail"); }

// 4. switch
switch (day) {
    case 1: printf("Sunday"); break;
    case 2: printf("Monday"); break;
    default: printf("Invalid day");
}`,
    output: `Positive (when num = 5)\nEven (when num = 4)\nGrade B (when marks = 80)\nMonday (when day = 2)`,
    notes: 'Marks guide: for each statement, flowchart + syntax + one example (about 2.5 marks each).',
  },
  {
    id: 't-armstrong',
    unit: 2,
    title: 'Armstrong numbers in a range',
    marks: 10,
    qRef: 'Q11',
    code: `#include <stdio.h>
int main() {
    int lo, hi, n, temp, digits, d, p, i, sum;
    printf("Enter range: ");
    scanf("%d %d", &lo, &hi);
    for (n = lo; n <= hi; n++) {
        temp = n; digits = 0;
        while (temp > 0) { digits++; temp /= 10; }
        temp = n; sum = 0;
        while (temp > 0) {
            d = temp % 10;
            p = 1;
            for (i = 0; i < digits; i++) p *= d;
            sum += p;
            temp /= 10;
        }
        if (sum == n) printf("%d ", n);
    }
    return 0;
}`,
    sampleInput: '1 500',
    output: `1 2 3 4 5 6 7 8 9 153 370 371 407\n(For 100 999: 153 370 371 407)`,
    notes: 'Logic: count digits, raise each digit to that power, add, compare with the original. 153 = 1^3 + 5^3 + 3^3. Note: not in Noteify or handwritten notes; rely on this template.',
  },
  {
    id: 't-dma',
    unit: 3,
    title: 'Dynamic memory allocation (malloc, calloc, realloc, free)',
    marks: 10,
    qRef: 'Q12',
    code: `#include <stdio.h>
#include <stdlib.h>
int main() {
    int *p, *q, i;
    p = (int *) malloc(3 * sizeof(int));
    if (p == NULL) { printf("No memory\\n"); return 1; }
    for (i = 0; i < 3; i++) p[i] = (i + 1) * 10;
    p = (int *) realloc(p, 6 * sizeof(int));
    for (i = 3; i < 6; i++) p[i] = (i + 1) * 10;
    for (i = 0; i < 6; i++) printf("%d ", p[i]);
    printf("\\n");
    free(p);
    q = (int *) calloc(4, sizeof(int));
    for (i = 0; i < 4; i++) printf("%d ", q[i]);
    free(q);
    return 0;
}`,
    output: `10 20 30 40 50 60\n0 0 0 0`,
    notes: 'Also covers the "resize 3 to 6" question.',
    answerOutline:
      'Definition of DMA (memory taken from the heap at run time), then malloc, calloc, realloc, free each with syntax and one example, then the malloc vs calloc table: malloc(bytes) one argument, values garbage, faster; calloc(n, size) two arguments, values zero, slightly slower.',
  },
  {
    id: 't-students',
    unit: 3,
    title: 'Array of structures (100 students)',
    marks: 10,
    qRef: 'Q13',
    code: `#include <stdio.h>
struct Student { int roll; char name[50]; float marks; };
int main() {
    struct Student s[100];
    int i;
    for (i = 0; i < 100; i++) {
        printf("Student %d roll, name, marks: ", i + 1);
        scanf("%d %49s %f", &s[i].roll, s[i].name, &s[i].marks);
    }
    printf("\\nRoll Name Marks\\n");
    for (i = 0; i < 100; i++)
        printf("%d %s %.1f\\n", s[i].roll, s[i].name, s[i].marks);
    return 0;
}`,
    sampleInput: '1 Asha 85.5, 2 Ravi 78 (first two of 100)',
    output: `1 Asha 85.5\n2 Ravi 78.0`,
    notes: 'Also explain declaration struct Student s[100]; and initialisation struct Student s[2] = {{1, "Asha", 85.5}, {2, "Ravi", 78}};.',
  },
  {
    id: 't-employees',
    unit: 3,
    title: 'Array of structures (n employees)',
    marks: 5,
    qRef: 'Q9',
    code: `#include <stdio.h>
struct Employee { int id; char name[50]; float salary; };
int main() {
    struct Employee e[100];
    int n, i;
    printf("How many employees? ");
    scanf("%d", &n);
    for (i = 0; i < n; i++) {
        printf("Employee %d id, name, salary: ", i + 1);
        scanf("%d %49s %f", &e[i].id, e[i].name, &e[i].salary);
    }
    printf("\\nID Name Salary\\n");
    for (i = 0; i < n; i++)
        printf("%d %s %.2f\\n", e[i].id, e[i].name, e[i].salary);
    return 0;
}`,
    sampleInput: '2, 101 Meera 45000, 102 Kabir 52000',
    output: `101 Meera 45000.00\n102 Kabir 52000.00`,
    notes: 'For the "N students" version, rename the struct and fields (roll, name, marks).',
  },
  {
    id: 't-swap',
    unit: 3,
    title: 'Swap two values by call by reference',
    marks: 5,
    qRef: 'Q8',
    code: `#include <stdio.h>
void swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }
int main() {
    int x, y;
    printf("Enter two numbers: ");
    scanf("%d %d", &x, &y);
    swap(&x, &y);
    printf("x = %d, y = %d\\n", x, y);
    return 0;
}`,
    sampleInput: '5 10',
    output: 'x = 10, y = 5',
    notes: 'main passes addresses; swap changes the values at those addresses through *a and *b, so the originals change.',
  },
  {
    id: 't-multiple',
    unit: 1,
    title: 'Multiple of 4 or 7',
    marks: 5,
    qRef: 'Q6',
    code: `#include <stdio.h>
int main() {
    int n;
    printf("Enter a number: ");
    scanf("%d", &n);
    if (n % 4 == 0 || n % 7 == 0) printf("%d is a multiple of 4 or 7\\n", n);
    else printf("%d is not a multiple of 4 or 7\\n", n);
    return 0;
}`,
    sampleInput: '28',
    output: '28 is a multiple of 4 or 7',
    notes: 'For "divisible by both 4 and 6" change 7 to 6 and || to &&; 12 gives "divisible by both", 8 does not.',
  },
  {
    id: 't-count',
    unit: 2,
    title: 'Total elements in an array',
    marks: 5,
    qRef: 'Q7',
    code: `#include <stdio.h>
int main() {
    int a[] = {5, 12, 8, 20, 7, 3};
    int total = sizeof(a) / sizeof(a[0]);
    printf("Total elements = %d\\n", total);
    return 0;
}`,
    output: 'Total elements = 6',
  },
  {
    id: 't-linear',
    unit: 2,
    title: 'Linear search in an array',
    marks: 5,
    code: `#include <stdio.h>
int main() {
    int a[5] = {10, 20, 30, 40, 50}, key, i, found = 0;
    printf("Enter number to search: ");
    scanf("%d", &key);
    for (i = 0; i < 5; i++)
        if (a[i] == key) { printf("Found at position %d\\n", i + 1); found = 1; break; }
    if (!found) printf("Not found\\n");
    return 0;
}`,
    sampleInput: '30',
    output: 'Found at position 3',
    notes: 'position = index + 1.',
  },
  {
    id: 't-matrix',
    unit: 2,
    title: 'Matrix addition (2x2)',
    marks: 5,
    code: `#include <stdio.h>
int main() {
    int a[2][2] = {{1, 2}, {3, 4}}, b[2][2] = {{5, 6}, {7, 8}}, c[2][2], i, j;
    for (i = 0; i < 2; i++)
        for (j = 0; j < 2; j++)
            c[i][j] = a[i][j] + b[i][j];
    for (i = 0; i < 2; i++) {
        for (j = 0; j < 2; j++) printf("%d ", c[i][j]);
        printf("\\n");
    }
    return 0;
}`,
    output: `6 8\n10 12`,
  },
  {
    id: 't-sumn',
    unit: 2,
    title: 'Sum of first N numbers',
    marks: 5,
    code: `#include <stdio.h>
int main() {
    int n, i, sum = 0;
    printf("Enter n: ");
    scanf("%d", &n);
    for (i = 1; i <= n; i++) sum += i;
    printf("Sum = %d\\n", sum);
    return 0;
}`,
    sampleInput: '5',
    output: 'Sum = 15',
  },
  {
    id: 't-structunion',
    unit: 3,
    title: 'sizeof structure vs union',
    marks: 5,
    marksLabel: '2M to 5M',
    code: `#include <stdio.h>
struct S { int i; float f; char c; };
union U { int i; float f; char c; };
int main() {
    printf("struct = %zu bytes\\n", sizeof(struct S));
    printf("union  = %zu bytes\\n", sizeof(union U));
    return 0;
}`,
    output: `struct = 12 bytes\nunion  = 4 bytes`,
    notes: 'struct is 4 + 4 + 1 plus 3 bytes padding; union equals its largest member.',
  },
  {
    id: 't-calloc-avg',
    unit: 3,
    title: 'calloc for 4 floats with average',
    marks: 2,
    qRef: 'Q5',
    code: `#include <stdio.h>
#include <stdlib.h>
int main() {
    float *p, sum = 0;
    int i;
    p = (float *) calloc(4, sizeof(float));
    if (p == NULL) return 1;
    printf("Enter 4 values: ");
    for (i = 0; i < 4; i++) { scanf("%f", &p[i]); sum += p[i]; }
    printf("Average = %.2f\\n", sum / 4);
    free(p);
    return 0;
}`,
    sampleInput: '2 4 6 8',
    output: 'Average = 5.00',
  },
  {
    id: 't-doubleptr',
    unit: 3,
    title: 'Double pointer example',
    marks: 2,
    code: `#include <stdio.h>
int main() {
    int a = 50;
    int *p = &a;
    int **pp = &p;
    printf("%d %d %d\\n", a, *p, **pp);
    return 0;
}`,
    output: '50 50 50',
  },
  {
    id: 't-null',
    unit: 3,
    title: 'NULL pointer example',
    marks: 2,
    qRef: 'Q3',
    code: `#include <stdio.h>
int main() {
    int *p = NULL;
    if (p == NULL) printf("p points to nothing\\n");
    return 0;
}`,
    output: 'p points to nothing',
  },
  {
    id: 't-largest3',
    unit: 1,
    title: 'Largest of three numbers',
    marks: 5,
    code: `#include <stdio.h>
int main() {
    int a, b, c;
    printf("Enter three numbers: ");
    scanf("%d %d %d", &a, &b, &c);
    if (a >= b && a >= c) printf("Largest = %d\\n", a);
    else if (b >= c) printf("Largest = %d\\n", b);
    else printf("Largest = %d\\n", c);
    return 0;
}`,
    sampleInput: '7 19 12',
    output: 'Largest = 19',
  },
  {
    id: 't-maxfunc',
    unit: 2,
    title: 'Function max(a, b)',
    marks: 5,
    code: `#include <stdio.h>
int max(int a, int b) { return (a > b) ? a : b; }
int main() {
    printf("Max = %d\\n", max(10, 20));
    return 0;
}`,
    output: 'Max = 20',
  },
];
