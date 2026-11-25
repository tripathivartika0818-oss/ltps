import { Printer } from 'lucide-react';
import { APP_CONFIG, FLOWCHART_VARIANTS, TRICKS } from '../data';

export default function SheetPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[var(--ink)]">A4 Cheat sheet</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Clean two-column black-on-white reference formatted for A4 print.
          </p>
        </div>
        <button type="button" onClick={() => window.print()} className="btn-ink">
          <Printer size={18} strokeWidth={1.5} />
          <span>Print A4 sheet</span>
        </button>
      </div>

      {/* A4 Sheet container: crisp black on white */}
      <article className="rounded-[24px] border border-[#D4CEC3] bg-white p-5 text-black sm:p-7 print:rounded-none print:border-0 print:p-0">
        <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-black pb-2">
          <div>
            <h2 className="font-display text-lg font-bold text-black">
              {APP_CONFIG.courseTitle} ({APP_CONFIG.courseCode}) — One-Night Sheet
            </h2>
            <p className="m-0 text-[11px] text-neutral-700">
              {APP_CONFIG.semester} · Unit 1 (17M) · Unit 2 (17M) · Unit 3 (26M)
            </p>
          </div>
          <span className="font-mono-code text-xs font-bold text-black">
            {APP_CONFIG.totalMarks} Marks · {APP_CONFIG.durationHours} Hours
          </span>
        </header>

        <div className="grid grid-cols-1 gap-3.5 text-[11px] leading-[1.42] md:grid-cols-2 print:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col gap-3">
            {/* 1. Exam shape */}
            <section className="rounded-lg border border-black/25 p-2.5">
              <h3 className="mb-1.5 font-mono-code text-[11px] font-bold bg-neutral-100 px-2 py-0.5 rounded">
                1. Exam shape
              </h3>
              <table className="w-full border-collapse text-[11px]">
                <tbody>
                  {APP_CONFIG.examShape.map((s) => (
                    <tr key={s.section} className="border-b border-black/10 last:border-b-0">
                      <td className="py-0.5 font-bold">{s.section}</td>
                      <td className="py-0.5 font-mono-code">{s.formula}</td>
                      <td className="py-0.5 text-neutral-700">{s.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 2. The 16 hooks */}
            <section className="rounded-lg border border-black/25 p-2.5">
              <h3 className="mb-1.5 font-mono-code text-[11px] font-bold bg-neutral-100 px-2 py-0.5 rounded">
                2. The 16 memory hooks
              </h3>
              <ol className="m-0 grid grid-cols-1 gap-x-3 gap-y-0.5 pl-4 sm:grid-cols-2 print:grid-cols-2">
                {TRICKS.map((t) => (
                  <li key={t.id}>
                    <strong>{t.mnemonic}:</strong> {t.hook}
                  </li>
                ))}
              </ol>
            </section>

            {/* 3. Precedence */}
            <section className="rounded-lg border border-black/25 p-2.5">
              <h3 className="mb-1 font-mono-code text-[11px] font-bold bg-neutral-100 px-2 py-0.5 rounded">
                3. Precedence (B U M A R E A O T A)
              </h3>
              <p className="m-0 font-mono-code text-[10.5px]">
                () &gt; Unary (++ -- ! sizeof cast, R-L) &gt; * / % &gt; + - &gt; &lt;&lt; &gt;&gt; &gt; &lt; &lt;= &gt; &gt;= &gt; == != &gt; &amp; ^ | &gt; &amp;&amp; &gt; || &gt; ?: (R-L) &gt; = (R-L)
              </p>
            </section>

            {/* 4. Format specifiers */}
            <section className="rounded-lg border border-black/25 p-2.5">
              <h3 className="mb-1.5 font-mono-code text-[11px] font-bold bg-neutral-100 px-2 py-0.5 rounded">
                4. Format specifiers (D F C S)
              </h3>
              <div className="grid grid-cols-3 gap-1 font-mono-code text-[10.5px]">
                <span>%d int</span>
                <span>%f float</span>
                <span>%lf double</span>
                <span>%c char</span>
                <span>%s string</span>
                <span>%u / %ld</span>
              </div>
              <p className="m-0 mt-1 text-[10.5px] text-neutral-700">
                scanf takes &amp; (not for char[]); printf never takes &amp;.
              </p>
            </section>

            {/* 5. Control syntax */}
            <section className="rounded-lg border border-black/25 p-2.5">
              <h3 className="mb-1 font-mono-code text-[11px] font-bold bg-neutral-100 px-2 py-0.5 rounded">
                5. Loop &amp; decision syntax
              </h3>
              <pre className="m-0 whitespace-pre-wrap rounded bg-neutral-50 p-1.5 font-mono-code text-[10px]">
{`for (init; cond; update) { body }
while (cond) { body }
do { body } while (cond);
if (c1) {} else if (c2) {} else {}
switch (x) { case 1: ...; break; default: ...; }`}
              </pre>
            </section>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3">
            {/* 6. Functions */}
            <section className="rounded-lg border border-black/25 p-2.5">
              <h3 className="mb-1 font-mono-code text-[11px] font-bold bg-neutral-100 px-2 py-0.5 rounded">
                6. Functions (D D C) &amp; Call by reference
              </h3>
              <pre className="m-0 whitespace-pre-wrap rounded bg-neutral-50 p-1.5 font-mono-code text-[10px]">
{`int max(int, int);                // prototype
int max(int a, int b) { ... }     // params in def
m = max(10, 20);                  // args in call
void swap(int *a, int *b) { int t=*a; *a=*b; *b=t; }`}
              </pre>
            </section>

            {/* 7. struct & union */}
            <section className="rounded-lg border border-black/25 p-2.5">
              <h3 className="mb-1 font-mono-code text-[11px] font-bold bg-neutral-100 px-2 py-0.5 rounded">
                7. struct, union &amp; array of structures
              </h3>
              <pre className="m-0 whitespace-pre-wrap rounded bg-neutral-50 p-1.5 font-mono-code text-[10px]">
{`struct Student { int roll; char name[50]; float marks; };
struct Student s[100];      // dot: s[i].roll | ptr->roll
union U { int i; float f; char c; }; // 4B shared; 1 active`}
              </pre>
            </section>

            {/* 8. Pointers */}
            <section className="rounded-lg border border-black/25 p-2.5">
              <h3 className="mb-1 font-mono-code text-[11px] font-bold bg-neutral-100 px-2 py-0.5 rounded">
                8. Pointers (&amp;, *, NULL, **)
              </h3>
              <pre className="m-0 whitespace-pre-wrap rounded bg-neutral-50 p-1.5 font-mono-code text-[10px]">
{`int a = 50, *p = &a, **pp = &p;  // a == *p == **pp == 50
int *q = NULL; // points to nothing; never dereference`}
              </pre>
            </section>

            {/* 9. DMA */}
            <section className="rounded-lg border border-black/25 p-2.5">
              <h3 className="mb-1 font-mono-code text-[11px] font-bold bg-neutral-100 px-2 py-0.5 rounded">
                9. DMA (&lt;stdlib.h&gt;) — M C R F
              </h3>
              <pre className="m-0 whitespace-pre-wrap rounded bg-neutral-50 p-1.5 font-mono-code text-[10px]">
{`p = (int *) malloc(n * sizeof(int));     // 1 arg, garbage
p = (int *) calloc(n, sizeof(int));      // 2 args, zeroed
p = (int *) realloc(p, m * sizeof(int)); // resize, keeps data
free(p);                                 // release heap`}
              </pre>
            </section>

            {/* 10. Strings + 11. Armstrong */}
            <section className="rounded-lg border border-black/25 p-2.5">
              <h3 className="mb-1 font-mono-code text-[11px] font-bold bg-neutral-100 px-2 py-0.5 rounded">
                10. Strings (&lt;string.h&gt;) &amp; 11. Armstrong (C P A C)
              </h3>
              <p className="m-0 font-mono-code text-[10.5px]">
                strlen(s) · strcpy(d, s) · strcat(d, s) · strcmp(a, b) == 0 if equal.
              </p>
              <p className="m-0 mt-1 text-[10.5px]">
                <strong>Armstrong:</strong> copy temp=n; count digits; sum += (temp%10)^digits; compare sum==n (153 = 1+125+27).
              </p>
            </section>

            {/* 12. Four flowcharts */}
            <section className="rounded-lg border border-black/25 p-2.5">
              <h3 className="mb-1 font-mono-code text-[11px] font-bold bg-neutral-100 px-2 py-0.5 rounded">
                12. Four flowchart outlines (Q10)
              </h3>
              <ul className="m-0 pl-4 text-[10.5px]">
                {FLOWCHART_VARIANTS.map((v) => (
                  <li key={v.id}>
                    <strong>{v.label}:</strong> {v.outline}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* 13. Reminder banner */}
        <footer className="mt-4 rounded-lg border-2 border-black bg-neutral-100 px-4 py-2 text-center font-mono-code text-xs font-bold text-black">
          13. {APP_CONFIG.outputReminder}
        </footer>
      </article>
    </div>
  );
}
