/**
 * ## Severity
 *
 * Reflects the RFC 5545 requirement language:
 * - ERROR   → MUST / MUST NOT violation — the file is non-compliant
 * - WARNING → SHOULD / SHOULD NOT violation — unusual but not invalid
 */
export type Severity = 'ERROR' | 'WARNING'

/**
 * ## Validation Issue
 *
 * A single rule violation found during validation. Each issue carries
 * a reference to the RFC section that defines the violated rule so
 * developers can look it up directly.
 */
export type ValidationIssue = {
  severity: Severity

  message: string

  /**
   * The RFC section that defines this rule.
   */
  rfc: string

  /** The component type where the issue was found */
  component: string

  /** The UID of the event or todo involved, if applicable */
  uid?: string

  /** The property name involved, if applicable */
  property?: string
}

/**
 * ## Validation Result
 *
 * The return value of `validate`. A calendar is considered valid
 * when `errors` is empty. Warnings are informational and do not
 * affect compliance.
 */
export type ValidationResult = {
  valid: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}