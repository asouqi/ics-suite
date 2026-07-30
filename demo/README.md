
## Each example should solve something developers actually search for — not just demonstrate a method call.

* `CalendarView` — "I have an .ics file and I want to show events in a month grid." The most common use case. Shows parse + query().between().
* `RecurringEvents` — "I need to show all occurrences of a weekly meeting in January." Shows expand and why naive approaches fail.
* `ConflictDetector` — "I want to warn users when they have double-booked their calendar." Shows query().conflicts().
* `CalendarDiff` — "My app syncs calendars and I need to know what changed." Shows diff.
* `Validator` — "I'm importing .ics files from users and need to check them before saving." Shows validate with a file upload input.


```text
    └── examples/
        ├── CalendarView.tsx     ← parse and query events in a month view
        ├── RecurringEvents.tsx  ← expand a recurring series
        ├── ConflictDetector.tsx ← find overlapping events
        ├── CalendarDiff.tsx     ← diff two calendar versions
        └── Validator.tsx        ← validate an uploaded .ics file
```