"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth"
import { ArrowLeftIcon, MailIcon, WalletIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

const CODE_LENGTH = 6

function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Something went wrong. Please try again."
}

export default function SignInPage() {
  const router = useRouter()
  const { ready, authenticated, login } = usePrivy()
  const { sendCode, loginWithCode, state } = useLoginWithEmail()

  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const isBusy =
    state.status === "sending-code" || state.status === "submitting-code"

  // Both the email flow and the wallet modal land here once Privy says the
  // user is authenticated.
  useEffect(() => {
    if (ready && authenticated) {
      router.replace("/home")
    }
  }, [ready, authenticated, router])

  async function handleSendCode(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    try {
      await sendCode({ email: email.trim(), disableSignup: false })
      setStep("code")
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    try {
      await loginWithCode({ code })
    } catch (caught) {
      setError(errorMessage(caught))
    }
  }

  function editEmail() {
    setStep("email")
    setCode("")
    setError(null)
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <WalletIcon className="size-5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-lg">Sign in to coinmo</CardTitle>
            <CardDescription>
              Send and receive stablecoins on Monad Testnet.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {step === "email" ? (
            <form className="flex flex-col gap-3" onSubmit={handleSendCode}>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-10"
                required
                disabled={isBusy}
              />
              <Button type="submit" size="lg" className="h-10 w-full" disabled={isBusy}>
                {state.status === "sending-code" ? (
                  <Spinner />
                ) : (
                  <MailIcon data-slot="icon" />
                )}
                Continue with email
              </Button>
            </form>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={handleVerifyCode}>
              <Label htmlFor="code">Code</Label>
              <p className="text-sm text-muted-foreground">
                We emailed a {CODE_LENGTH}-digit code to{" "}
                <span className="font-medium text-foreground">{email}</span>.
              </p>
              <InputOTP
                id="code"
                maxLength={CODE_LENGTH}
                pattern="[0-9]*"
                value={code}
                onChange={setCode}
                disabled={isBusy}
              >
                <InputOTPGroup>
                  {Array.from({ length: CODE_LENGTH }, (_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <Button
                type="submit"
                size="lg"
                className="h-10 w-full"
                disabled={isBusy || code.length < CODE_LENGTH}
              >
                {state.status === "submitting-code" && <Spinner />}
                Verify and continue
              </Button>
              <div className="flex items-center justify-between text-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={editEmail}
                  disabled={isBusy}
                >
                  <ArrowLeftIcon data-slot="icon" />
                  Back
                </Button>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleSendCode}
                  disabled={isBusy}
                >
                  Resend code
                </Button>
              </div>
            </form>
          )}

          {error !== null && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {state.status === "error" && state.error !== null && (
            <Alert variant="destructive">
              <AlertDescription>{state.error.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-10 w-full"
            onClick={() => login({ loginMethods: ["wallet"] })}
          >
            <WalletIcon data-slot="icon" />
            Continue with wallet
          </Button>

          <div className="flex items-center justify-center pt-1">
            <Badge variant="outline" className="font-mono text-[0.7rem]">
              Monad Testnet only
            </Badge>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
