import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar.tsx"
import MonthGrid from "@/components/calendar/Monthgrid.tsx"
import { useCalendar } from "@/hook/useCalendar.ts"
import DayPanel from "@/components/calendar/DayPanel.tsx"
import FilterBar from "@/components/calendar/FilterBar.tsx"
import ConflictsBar from "@/components/calendar/ConflictsBar.tsx"
import ValidationBar from "@/components/calendar/ValidationBar.tsx"

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
  const [activeFixture, setActiveFixture] = useState<Fixture>(ICS_FIXTURES[0]);
  const [rawInput, setRawInput] = useState<string>(ICS_FIXTURES[0].rawContent);

  const handleFixtureChange = (fixture: Fixture) => {
    setActiveFixture(fixture);
    setRawInput(fixture.rawContent);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setActiveFixture({
        id: "custom-upload",
        name: file.name,
        description: "User-uploaded local target file stream data.",
        rawContent: content
      });
      setRawInput(content);
    };
    reader.readAsText(file);
  };

  const [date, setDate] = useState<Date | undefined>(new Date())
  const cal = useCalendar()
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto py-8 px-6 flex flex-col gap-4">

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Try it</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Parse, query and explore a real .ics calendar file
          </p>
        </div>

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
              onResetToFixture={cal.resetToFixture}
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

      </div>
    </div>
  );
}