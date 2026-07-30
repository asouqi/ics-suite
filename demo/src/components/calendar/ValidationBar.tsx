import { useState } from 'react'
import type { ValidationResult, ValidationIssue } from 'ics-suite'

// ─── types ───────────────────────────────────────────────────────────────────

type ValidationBarProps = {
  validation: ValidationResult
}

// ─── ValidationBar ───────────────────────────────────────────────────────────

export default function ValidationBar({ validation }: ValidationBarProps) {
  const [expanded, setExpanded] = useState(false)

  const { valid, errors, warnings } = validation
  const hasIssues = errors.length > 0 || warnings.length > 0
  const isClean   = valid && warnings.length === 0

  // Determine bar color
  const barClass = errors.length > 0
    ? 'border-[var(--color-issue-error-border)] bg-[var(--color-issue-error-bg)]'
    : warnings.length > 0
      ? 'border-[var(--color-issue-warning-border)] bg-[var(--color-issue-warning-bg)]'
      : 'border-border bg-muted/30'

  const textClass = errors.length > 0
    ? 'text-[var(--color-issue-error-text)]'
    : warnings.length > 0
      ? 'text-[var(--color-issue-warning-text)]'
      : 'text-muted-foreground'

  return (
    <div className={`rounded-lg border transition-colors overflow-hidden ${barClass}`}>

      {/* Header row — always visible */}
      <button
        onClick={() => hasIssues && setExpanded(e => !e)}
        className={[
          'w-full flex items-center gap-2 px-4 py-2.5 text-left',
          hasIssues ? 'cursor-pointer' : 'cursor-default',
        ].join(' ')}
      >
        {/* Icon */}
        <span className="text-sm shrink-0">
          {errors.length > 0 ? '✕' : warnings.length > 0 ? '⚠️' : '✓'}
        </span>

        {/* Label */}
        <span className={`text-xs font-semibold ${textClass}`}>
          Validation
        </span>

        {/* Summary */}
        <span className={`text-xs ${textClass}`}>
          {isClean && '· Valid RFC 5545 calendar'}
          {errors.length > 0 && (
            <>
              · {errors.length} {errors.length === 1 ? 'error' : 'errors'}
              {warnings.length > 0 && `, ${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'}`}
            </>
          )}
          {errors.length === 0 && warnings.length > 0 && (
            <>· {warnings.length} {warnings.length === 1 ? 'warning' : 'warnings'}</>
          )}
        </span>

        {/* Expand arrow */}
        {hasIssues && (
          <span className={[
            `ml-auto text-xs ${textClass}`,
            'transition-transform duration-150',
            expanded ? 'rotate-180' : '',
          ].join(' ')}>
            ▾
          </span>
        )}
      </button>

      {/* Expanded issues */}
      {expanded && hasIssues && (
        <div className={[
          'flex flex-col gap-2 px-4 pb-3 border-t',
          errors.length > 0
            ? 'border-[var(--color-issue-error-border)]'
            : 'border-[var(--color-issue-warning-border)]',
        ].join(' ')}>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-2">
              <p className="section-label text-[var(--color-issue-error-text)]">
                Errors · {errors.length}
              </p>
              {errors.map((issue, i) => (
                <IssueRow key={i} issue={issue} />
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-2">
              <p className="section-label text-[var(--color-issue-warning-text)]">
                Warnings · {warnings.length}
              </p>
              {warnings.map((issue, i) => (
                <IssueRow key={i} issue={issue} />
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  )
}

// ─── IssueRow ─────────────────────────────────────────────────────────────────

function IssueRow({ issue }: { issue: ValidationIssue }) {
  const isError = issue.severity === 'ERROR'

  return (
    <div className={isError ? 'issue-error' : 'issue-warning'}>
      <div className="flex items-start justify-between gap-3">

        {/* Message */}
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-xs font-medium leading-snug">
            {issue.message}
          </p>
          {issue.property && (
            <p className="text-xs opacity-70">
              Property: <span className="font-mono">{issue.property}</span>
              {issue.uid && (
                <span className="ml-2 opacity-70">
                  · UID: <span className="font-mono">{issue.uid}</span>
                </span>
              )}
            </p>
          )}
        </div>

        {/* RFC reference */}
        <span className="rfc-badge shrink-0">{issue.rfc}</span>

      </div>
    </div>
  )
}