"use client"

import { RequireSession } from "@/components/require-auth"
import { OnboardingForm } from "./onboarding-form"

export default function OnboardingPage() {
  return (
    <RequireSession>
      <OnboardingForm />
    </RequireSession>
  )
}
