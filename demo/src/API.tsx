import React, { useState, useEffect } from "react";
import CodeViewer from "./CodeViewer";

interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ApiEndpoint {
  id: string;
  title: string;
  signature: string;
  description: string;
  parameters: ApiParam[];
  exampleCode: string;
}

interface ApiSection {
  id: string;
  title: string;
  endpoints: ApiEndpoint[];
}

const API_DATA: ApiSection[] = [
  {
    id: "parse-layer",
    title: "Core Parser Engine",
    endpoints: [
      {
        id: "parse",
        title: "parse()",
        signature: "parse(icsContent: string, options?: ParseOptions): CalendarContainer",
        description: "Ingests raw RFC 5545 string streams. Features a state-aware property-line scanner built to handle multi-line folded buffers and malformed records gracefully.",
        parameters: [
          { name: "icsContent", type: "string", required: true, description: "The raw string stream from an unparsed .ics data source." },
          { name: "options.strict", type: "boolean", required: false, description: "When true, halts execution and throws syntax errors immediately upon spec deviations." }
        ],
        exampleCode: `import { parse } from 'ics-suite'\n\nconst { calendar, errors } = parse(rawIcsString, { strict: false });`
      }
    ]
  },
  {
    id: "query-layer",
    title: "Chainable Query Builder API",
    endpoints: [
      {
        id: "query-between",
        title: "query().between()",
        signature: ".between(start: Temporal.PlainDate, end: Temporal.PlainDate): QueryBuilder",
        description: "Establishes standard chronological evaluation boundaries. Limits target visibility to instances overlapping the window timeline.",
        parameters: [
          { name: "start", type: "Temporal.PlainDate", required: true, description: "Lower boundary limit wrapper constraint." },
          { name: "end", type: "Temporal.PlainDate", required: true, description: "Upper boundary limit wrapper constraint." }
        ],
        exampleCode: `const events = query(calendar)\n  .between(start, end)\n  .get();`
      },
      {
        id: "query-on",
        title: "query().on()",
        signature: ".on(date: Temporal.PlainDate): QueryBuilder",
        description: "Shorthand scoping utility targeting a single absolute calendar date. Sets the range boundary internally to encompass exactly 24 hours.",
        parameters: [
          { name: "date", type: "Temporal.PlainDate", required: true, description: "The explicit targeted day vector." }
        ],
        exampleCode: `const dailyAgendas = query(calendar)\n  .on(Temporal.PlainDate.from('2026-06-27'))\n  .get();`
      },
      {
        id: "query-inclusive",
        title: "query().inclusive()",
        signature: ".inclusive(): QueryBuilder",
        description: "Modifies standard window constraints to ensure events clipping or matching the range edges exactly are included in the dataset.",
        parameters: [],
        exampleCode: `const inclusiveWindow = query(calendar)\n  .between(start, end)\n  .inclusive()\n  .get();`
      },
      {
        id: "query-where",
        title: "query().where()",
        signature: ".where(predicate: (event: EventRecord) => boolean): QueryBuilder",
        description: "Injects a custom functional filter callback to run custom evaluation sweeps against structural properties.",
        parameters: [
          { name: "predicate", type: "(event) => boolean", required: true, description: "Synchronous evaluation callback returning truthy matching criteria." }
        ],
        exampleCode: `const highPriority = query(calendar)\n  .where(e => e.priority === 1)\n  .get();`
      },
      {
        id: "query-withAttendee",
        title: "query().withAttendee()",
        signature: ".withAttendee(email: string): QueryBuilder",
        description: "Isolates records containing an absolute match within the participant ATTENDEE structural collections.",
        parameters: [
          { name: "email", type: "string", required: true, description: "Target individual participant address lookup string." }
        ],
        exampleCode: `const invites = query(calendar)\n  .withAttendee('alice@example.com')\n  .get();`
      },
      {
        id: "query-withOrganizer",
        title: "query().withOrganizer()",
        signature: ".withOrganizer(email: string): QueryBuilder",
        description: "Filters events down to those managed by a specified organizing identity matching the core ORGANIZER attribute.",
        parameters: [
          { name: "email", type: "string", required: true, description: "Organizer email address criteria string." }
        ],
        exampleCode: `const hostedByMe = query(calendar)\n  .withOrganizer('developer@workspace.com')\n  .get();`
      },
      {
        id: "query-withStatus",
        title: "query().withStatus()",
        signature: ".withStatus(status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED'): QueryBuilder",
        description: "Filters working streams to match official RFC 5545 schedule confirmation status states.",
        parameters: [
          { name: "status", type: "string", required: true, description: "Literal string enum state flag." }
        ],
        exampleCode: `const clearAppointments = query(calendar)\n  .withStatus('CONFIRMED')\n  .get();`
      },
      {
        id: "query-withCategory",
        title: "query().withCategory()",
        signature: ".withCategory(category: string): QueryBuilder",
        description: "Filters records using token parameters found in the structural CATEGORIES text arrays.",
        parameters: [
          { name: "category", type: "string", required: true, description: "Target category classification label." }
        ],
        exampleCode: `const corporateWork = query(calendar)\n  .withCategory('work')\n  .get();`
      },
      {
        id: "query-recurring",
        title: "query().recurring()",
        signature: ".recurring(): QueryBuilder",
        description: "Filters the pipeline sequence to isolate elements carrying active recurrence configuration parameters (RRULE attributes).",
        parameters: [],
        exampleCode: `const standingSeries = query(calendar).recurring().get();`
      },
      {
        id: "query-nonRecurring",
        title: "query().nonRecurring()",
        signature: ".nonRecurring(): QueryBuilder",
        description: "Filters the pipeline sequence to capture only isolated, one-off time blocks that possess no repeating properties.",
        parameters: [],
        exampleCode: `const isolatedBlocks = query(calendar).nonRecurring().get();`
      },
      {
        id: "query-inTimezone",
        title: "query().inTimezone()",
        signature: ".inTimezone(tzIdentifier: string): QueryBuilder",
        description: "Maps floating calendar values or UTC values down to specific target timezone coordinates before delivering representations.",
        parameters: [
          { name: "tzIdentifier", type: "string", required: true, description: "Valid IANA location identifier key string." }
        ],
        exampleCode: `const localAgenda = query(calendar)\n  .inTimezone('Asia/Amman')\n  .get();`
      },
      {
        id: "query-sortBy",
        title: "query().sortBy()",
        signature: ".sortBy(field: 'start' | 'end' | 'summary'): QueryBuilder",
        description: "Sets the index attribute targeting sorting logic before generation compilation.",
        parameters: [
          { name: "field", type: "string", required: true, description: "Target string parameter attribute sorting anchor identifier." }
        ],
        exampleCode: `const orderedTimeline = query(calendar)\n  .sortBy('start')\n  .get();`
      },
      {
        id: "query-sortOrder",
        title: "query().sortOrder()",
        signature: ".sortOrder(direction: 'asc' | 'desc'): QueryBuilder",
        description: "Controls structural sorting direction weights (Chronological ascending vs Reverse chronological descending).",
        parameters: [
          { name: "direction", type: "'asc' | 'desc'", required: true, description: "Ordering vector assignment flag indicator." }
        ],
        exampleCode: `const newestFirst = query(calendar)\n  .sortBy('start')\n  .sortOrder('desc')\n  .get();`
      }
    ]
  },
  {
    id: "terminal-layer",
    title: "Terminal Execution Methods",
    endpoints: [
      {
        id: "query-get",
        title: "query().get()",
        signature: ".get(): ExpandedEvent[]",
        description: "Triggers computational array resolution pipelines. Unrolls nested vectors, locks filters, maps values, and delivers flattened event representations.",
        parameters: [],
        exampleCode: `const results = query(calendar).between(start, end).get();`
      },
      {
        id: "query-first",
        title: "query().first()",
        signature: ".first(): ExpandedEvent | undefined",
        description: "Optimized resolution terminal step that halts computations immediately upon discovering the earliest chronological valid item.",
        parameters: [],
        exampleCode: `const nextImminentMeeting = query(calendar)\n  .between(start, end)\n  .first();`
      },
      {
        id: "query-count",
        title: "query().count()",
        signature: ".count(): number",
        description: "High-performance evaluation terminal method that computes the size integer of matching vectors without completing full object allocation loops.",
        parameters: [],
        exampleCode: `const totalOverlapsCount = query(calendar)\n  .between(start, end)\n  .withStatus('CONFIRMED')\n  .count();`
      },
      {
        id: "query-conflicts",
        title: "query().conflicts()",
        signature: ".conflicts(): [ExpandedEvent, ExpandedEvent][]",
        description: "Analyzes the resulting record collection to flag spatial chronological collision groupings where multiple items share overlapping timelines.",
        parameters: [],
        exampleCode: `const collisionMatrix = query(calendar)\n  .between(start, end)\n  .conflicts();\n// Returns pairs: [[eventA, eventB]]`
      }
    ]
  },
  {
    id: "validation-layer",
    title: "RFC 5545 Validator",
    endpoints: [
      {
        id: "validate",
        title: "validate()",
        signature: "validate(calendar: CalendarContainer): ValidationError[]",
        description: "Performs strict architectural analysis. Returns error models tagged with specific pointers to official RFC sections.",
        parameters: [
          { name: "calendar", type: "CalendarContainer", required: true, description: "The parsed calendar target payload model." }
        ],
        exampleCode: `import { validate } from 'ics-suite'\n\nconst diagnostics = validate(calendar);\n// diagnostics[0] -> { error: 'MISSING_DTSTAMP', rfcSection: 'Section 3.6.1' }`
      }
    ]
  },
  {
    id: "diff-layer",
    title: "Structural Diff Suite",
    endpoints: [
      {
        id: "diff",
        title: "diff()",
        signature: "diff(oldCal: CalendarContainer, newCal: CalendarContainer): ChangeDelta",
        description: "Compares separate sequence frames to extract added, updated, or removed timeline elements across distinct UUID mappings.",
        parameters: [
          { name: "oldCal", type: "CalendarContainer", required: true, description: "Baseline container reference state state snapshot." },
          { name: "newCal", type: "CalendarContainer", required: true, description: "Modified incoming container reference state snapshot." }
        ],
        exampleCode: `import { diff } from 'ics-suite'\n\nconst delta = diff(cachedCalendar, remoteFetchCalendar);`
      }
    ]
  },
  {
    id: "expand-layer",
    title: "Recurrence Expander Engine",
    endpoints: [
      {
        id: "expand",
        title: "expand()",
        signature: "expand(event: EventRecord, range: DateRange): TimeInstance[]",
        description: "Unrolls mathematical recurrence limits (`RRULE`). Computes complex frequency loops while accurately overlaying explicit exclusion arrays (`EXDATE`).",
        parameters: [
          { name: "event", type: "EventRecord", required: true, description: "The source template rule container target structure." },
          { name: "range", type: "DateRange", required: true, description: "Projection limits tracking context constraints." }
        ],
        exampleCode: `import { expand } from 'ics-suite'\n\nconst instances = expand(recurringEvent, { from: '2026-01-01', to: '2026-12-31' });`
      }
    ]
  }
]

const ExamplePage: React.FC = () => {
  const [activeId, setActiveId] = useState("parse");

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    API_DATA.forEach((section) => {
      section.endpoints.forEach((endpoint) => {
        const el = document.getElementById(endpoint.id);
        if (el) observer.observe(el);
      });
    });

    return () => observer.disconnect();
  }, []);

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

      <aside className="md:col-span-3 sticky top-6 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2 space-y-5 hidden md:block">
        {API_DATA.map((section) => (
          <div key={section.id} className="space-y-1.5">
            <span className="section-label px-3 text-[10px] tracking-wider font-bold block">
              {section.title}
            </span>
            <div className="space-y-0.5">
              {section.endpoints.map((endpoint) => (
                <button
                  key={endpoint.id}
                  onClick={() => scrollToElement(endpoint.id)}
                  className={`nav-item text-xs py-1.5 font-mono ${
                    activeId === endpoint.id ? "active" : ""
                  }`}
                >
                  {endpoint.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      <main className="col-span-1 md:col-span-9 space-y-16 pb-24">
        {API_DATA.map((section) => (
          <div key={section.id} className="space-y-12">

            <div className="border-b border-border pb-2">
              <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
                {section.title}
              </h2>
            </div>

            {section.endpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                id={endpoint.id}
                className="scroll-mt-12 space-y-4 pt-4"
              >
                <div>
                  <h3 className="text-xl font-mono font-bold tracking-tight text-foreground">
                    {endpoint.title}
                  </h3>
                  <div className="mt-1.5 inline-block text-xs font-mono font-medium text-primary bg-muted px-2.5 py-0.5 rounded border border-border/50">
                    {endpoint.signature}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  {endpoint.description}
                </p>

                {endpoint.parameters.length > 0 && (
                  <div className="border border-border rounded-lg bg-card overflow-hidden max-w-3xl shadow-2xs">
                    <div className="bg-muted/40 px-4 py-1.5 border-b border-border">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Parameters</span>
                    </div>
                    <div className="divide-y divide-border">
                      {endpoint.parameters.map((param) => (
                        <div key={param.name} className="p-3 flex flex-col sm:flex-row sm:items-start gap-2 text-xs">
                          <div className="sm:w-1/3 shrink-0">
                            <span className="font-mono font-bold text-foreground">{param.name}</span>
                            {param.required ? (
                              <span className="text-[9px] font-bold text-destructive/90 ml-2 uppercase tracking-wide">Req</span>
                            ) : (
                              <span className="text-[9px] font-bold text-muted-foreground/80 ml-2 uppercase tracking-wide">Opt</span>
                            )}
                            <div className="font-mono text-[10px] text-primary/80 mt-0.5 truncate">{param.type}</div>
                          </div>
                          <div className="sm:w-2/3 text-muted-foreground leading-relaxed pt-0.5 sm:pt-0">
                            {param.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="max-w-3xl pt-2">
                  <div className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase mb-1.5">
                    Usage Blueprint
                  </div>
                  <CodeViewer code={endpoint.exampleCode} />
                </div>

              </div>
            ))}
          </div>
        ))}
      </main>

    </div>
  );
}

export default ExamplePage