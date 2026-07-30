import React from "react"
import CodeViewer from "@/CodeViewer.tsx"


const HomePage: React.FC<{setTab: (tab: string) => void }> = ({setTab}) => {
  return  <div className="space-y-16">
    <div className="text-center max-w-3xl mx-auto space-y-6 pt-6">
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground sm:leading-tight">
        A TypeScript-first engine for working with{" "}
        <span className="text-primary">.ics calendar files</span>.
      </h1>
      <p className="text-base sm:text-lg text-muted-foreground font-normal max-w-2xl mx-auto leading-relaxed">
        An iCalendar parser and recurrence expander designed to gracefully handle malformed .ics inputs, evaluate complex calendar boundaries with a chainable query API, and validate constraints using explicit RFC 5545 specifications.
      </p>
      <div className="flex justify-center items-center gap-4 pt-2">
        <button
          onClick={() => setTab("api")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm px-6 py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          Explore API Reference
        </button>
        <div className="font-mono text-xs border border-border bg-card text-muted-foreground px-4 py-3 rounded-xl shadow-sm select-all">
          npm install ics-suite
        </div>
      </div>
    </div>

    {/* Practical Code Highlight Showcase */}
    <div className="bg-card border border-border rounded-2xl shadow-sm p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wider">Example Usage Architecture</span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded">Temporal Integrated</span>
      </div>
      <CodeViewer code={`
import { parse, query } from 'ics-suite'
import { Temporal } from 'temporal-polyfill'

const { calendar } = parse(icsString)

const events = query(calendar)
  .between(Temporal.PlainDate.from('2026-01-01'), Temporal.PlainDate.from('2026-01-31'))
  .withAttendee('alice@example.com')
  .withStatus('CONFIRMED')
  .inTimezone('Asia/Amman')
  .get()
      `}/>
    </div>

    <div className="space-y-4">
      <h2 className="text-xs uppercase tracking-widest font-bold text-center font-mono text-muted-foreground">Engine Specifications</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-2">
          <div className="text-primary font-bold text-lg">🛡️ Lenient Parser</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Always succeeds. Gracefully patches layout errors, trailing whitespaces, and custom parameters from Outlook, Google, or Apple feeds without breaking runtime workflows.
          </p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-2">
          <div className="text-primary font-bold text-lg">🔁 Recurrence Expansion</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Accurately expands complex <code className="font-mono text-xs bg-muted p-0.5 rounded text-foreground">RRULE</code> streams while respecting local timezone bounds, <code className="font-mono text-xs bg-muted p-0.5 rounded text-foreground">EXDATE</code> omissions, and individual instance updates.
          </p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-2">
          <div className="text-primary font-bold text-lg">⛓️ Chainable Queries</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Filter, sort, compute resource exceptions, and isolate specific attendee responses natively through an expressive builder model interface.
          </p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-2">
          <div className="text-primary font-bold text-lg">🔍 Structured Validation</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Exposes broken inputs with detailed diagnostic arrays complete with exact RFC 5545 rule and paragraph references rather than hiding them under generic catch blocks.
          </p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-2">
          <div className="text-primary font-bold text-lg">⚖️ Structural Diffing</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Isolates precise changes between two calendar state variations by isolating properties by <code className="font-mono text-xs bg-muted p-0.5 rounded text-foreground">UID</code> while masking volatile system fields automatically.
          </p>
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-2">
          <div className="text-primary font-bold text-lg">📦 Round-trip Fidelity</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Read fields, apply structural corrections, extract time metrics, and export changes right back to valid standard <code className="font-mono text-xs bg-muted p-0.5 rounded text-foreground">.ics</code> files with complete payload preservation.
          </p>
        </div>
      </div>
    </div>
  </div>
}

export default HomePage