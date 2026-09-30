"use client"

import { RequireAuth } from "@/components/require-auth"
import { SettingsForm } from "./settings-form"

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsForm />
    </RequireAuth>
  )
}
