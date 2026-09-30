"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  USERNAME_HINT,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "@/convex/lib/username"

type UsernameFieldProps = {
  value: string
  onChange: (value: string) => void
  /** Live validation message, or null while the value is usable. */
  problem?: string | null
  disabled?: boolean
}

/**
 * The username input with its rules printed underneath. The browser `pattern`
 * catches an obvious typo on submit, while `problem` lets the form react while
 * the person is still typing.
 */
export function UsernameField({
  value,
  onChange,
  problem,
  disabled,
}: UsernameFieldProps) {
  const invalid = value.length > 0 && Boolean(problem)

  return (
    <div className="space-y-2">
      <Label htmlFor="username">Username</Label>
      <Input
        id="username"
        value={value}
        onChange={(event) => onChange(event.target.value.toLowerCase())}
        required
        minLength={USERNAME_MIN_LENGTH}
        maxLength={USERNAME_MAX_LENGTH}
        pattern={USERNAME_PATTERN}
        autoComplete="username"
        spellCheck={false}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby="username-hint"
      />
      <p
        id="username-hint"
        className={cn(
          "text-xs",
          invalid ? "text-destructive" : "text-muted-foreground"
        )}
        role={invalid ? "alert" : undefined}
      >
        {invalid ? problem : USERNAME_HINT}
      </p>
    </div>
  )
}
