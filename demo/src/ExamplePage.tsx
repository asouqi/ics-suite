import React, { useState } from "react";
import MonthGrid from "@/components/calendar/Monthgrid.tsx"
import { useCalendar } from "@/hook/useCalendar.ts"
import DayPanel from "@/components/calendar/DayPanel.tsx"
import FilterBar from "@/components/calendar/FilterBar.tsx"
import ConflictsBar from "@/components/calendar/ConflictsBar.tsx"
import ValidationBar from "@/components/calendar/ValidationBar.tsx"
import RecurringEvents from "@/components/calendar/RecurringEvents.tsx"

// Mock definitions matching your library structures
interface Fixture {
  id: string;
  name: string;
  description: string;
  rawContent: string;
}

const ICS_FIXTURES: Fixture[] = [
  {
    id: "corporate-calendar",
    name: "Corporate Team Schedule",
    description: "Contains recurring sprint syncs, multi-attendee reviews, and complex custom category indicators.",
    rawContent: `BEGIN:VCALENDAR\nVERSION:2.0\nSUMMARY:Sprint Blocks\nEND:VCALENDAR`
  },
  {
    id: "malformed-feed",
    name: "Resilient Malformed Feed",
    description: "A messy real-world feed containing broken line folds and syntax errors to demonstrate parser stability.",
    rawContent: `BEGIN:VCALENDAR\nINVALID_PROPERTY_NO_COLON\nEND:VCALENDAR`
  }
];

export default function LibraryPlayground() {
  const [activeFixture, setActiveFixture] = useState<Fixture | null>(null);
  const [rawInput, setRawInput] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const handleFixtureChange = (fixture: Fixture) => {
    setUploadError(null);
    setActiveFixture(fixture);
    setRawInput(fixture.rawContent);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".ics")) {
      setUploadError("That doesn't look like a .ics file. Please choose a calendar export ending in .ics.");
      return;
    }

    setUploadError(null);
    setIsLoadingFile(true);

    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      setActiveFixture({
        id: "custom-upload",
        name: file.name,
        description: "Your uploaded calendar file.",
        rawContent: content
      });
      setRawInput(content);
      setIsLoadingFile(false);
    };

    reader.onerror = () => {
      setUploadError("We couldn't read that file. Please try again or choose a different file.");
      setIsLoadingFile(false);
    };

    reader.readAsText(file);
  };

  const cal = useCalendar(rawInput);

  const hasCriticalParseFailure = cal.parseErrors.length > 0 && !cal.hasEventsInMonth && cal.eventsByDay.size === 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto py-8 px-6 flex flex-col gap-4">

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Try it</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your own .ics calendar file, or try a sample, to explore your events
          </p>
        </div>

        {cal.summary && (
          <div className="text-sm text-muted-foreground">
            This calendar has <strong>{cal.summary.totalEvents}</strong> events
            {cal.summary.earliest && cal.summary.latest && (
              <> from {cal.summary.earliest.toString()} to {cal.summary.latest.toString()}</>
            )}
            . Jumped to the first event automatically — use the arrows or "Today" to browse.
          </div>
        )}

        {/* Upload + sample picker */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg cursor-pointer w-fit">
            Upload a .ics file
            <input
              type="file"
              accept=".ics"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <div className="flex items-center gap-2">
            {ICS_FIXTURES.map((fixture) => (
              <button
                key={fixture.id}
                onClick={() => handleFixtureChange(fixture)}
                className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                  activeFixture?.id === fixture.id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Try: {fixture.name}
              </button>
            ))}
          </div>
        </div>

        {uploadError && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            {uploadError}
          </div>
        )}

        {isLoadingFile && (
          <div className="text-sm text-muted-foreground">Reading your calendar…</div>
        )}

        {hasCriticalParseFailure && (
          <div className="text-sm text-foreground bg-muted border border-border rounded-lg px-4 py-3">
            We couldn't find any usable events in this file. It may be empty or in an unsupported format.
          </div>
        )}

        {/* Filter bar */}
        <FilterBar
          filters={cal.filters}
          availableCategories={cal.availableCategories}
          onUpdate={cal.updateFilter}
          onClear={cal.clearFilters}
        />

        {/* Main — 60/40 split */}
        <div className="flex flex-col lg:flex-row gap-4">

          {/* Month grid — 60% */}
          <div className="lg:w-[60%]">
            <MonthGrid
              month={cal.month}
              selectedDay={cal.selectedDay}
              eventsByDay={cal.eventsByDay}
              onDaySelect={cal.selectDay}
              onPrevMonth={cal.goToPrevMonth}
              onNextMonth={cal.goToNextMonth}
              onToday={cal.goToToday}
              hasEventsInMonth={cal.hasEventsInMonth}
            />
          </div>

          {/* Day panel — 40% */}
          <div className="lg:w-[40%]">
            <DayPanel
              selectedDay={cal.selectedDay}
              selectedEvent={cal.selectedEvent}
              dayEvents={cal.dayEvents}
              onEventSelect={cal.selectEvent}
              onBack={cal.clearEventSelection}
            />
          </div>

        </div>

        {/* Conflicts bar */}
        <ConflictsBar conflicts={cal.conflicts} />
        {/* Validation bar */}
        <ValidationBar validation={cal.validation} />
        {/* Recurring events — expandEvent() in action */}
        {cal.recurringEvent && <RecurringEvents event={cal.recurringEvent} month={cal.month} />}
      </div>
    </div>
  );
}