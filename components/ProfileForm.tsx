"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { useAppKitAccount } from "@reown/appkit/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(50, {
      message: "Name must not be longer than 50 characters.",
    })
    .regex(/^[a-zA-Z\s-']+$/, {
      message:
        "Name can only contain letters, spaces, hyphens, and apostrophes.",
    }),
  username: z
    .string()
    .trim()
    .min(2, {
      message: "Username must be at least 2 characters.",
    })
    .max(50, {
      message: "Username must not be longer than 50 characters.",
    })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        "Username can only contain letters, numbers, underscores, and hyphens.",
    })
    .toLowerCase(), // Convert to lowercase to ensure consistency
});

export default function ProfileForm() {
  const { address } = useAppKitAccount();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!address) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          name: values.name,
          username: values.username,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        form.setError("username", {
          type: "manual",
          message:
            error.error === "Username already taken"
              ? "This username is already taken"
              : "Failed to create profile",
        });
        return;
      }

      // Profile created successfully - redirect to home
      router.push('/home');
    } catch (error) {
      console.error("Error creating profile:", error);
      form.setError("root", {
        type: "manual",
        message: "Failed to create profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>This is your public username.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating Profile..." : "Create Profile"}
        </Button>

        {form.formState.errors.root && (
          <p className="text-red-500">{form.formState.errors.root.message}</p>
        )}
      </form>
    </Form>
  );
}
