"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { useForm } from '@tanstack/react-form'
import * as v from 'valibot'
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ConvexError } from "convex/values";

const formSchema = v.pipe(
  v.object({
    email: v.pipe(
      v.string(),
      v.email(),
    ),
    password: v.pipe(
      v.string(),
      v.minLength(8, 'Password must be at least 8 characters'),
    ),
    confirmPassword: v.string(),
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      (input) => input.password === input.confirmPassword,
      'Passwords do not match',
    ),
    ['confirmPassword'],
  ),
)

export function SignUpForm() {
  const { signIn } = useAuthActions();
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: formSchema,
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await signIn('password', {
          email: value.email,
          password: value.password,
          flow: 'signUp',
        })
        toast.success('Account created successfully!')
      } catch (e) {
        toast.error(e instanceof ConvexError
          ? (e.data as string)
          : 'Could not create account');
      }
    },
  })
  return (
    <form
      id="sign-up-form"
      onSubmit={e => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup className="w-full">
        <form.Field
          name="email"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                <Input
                  type="email"
                  id="signup-email"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="password"
          children={field => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                <Input
                  type="password"
                  id="signup-password"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="new-password"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="confirmPassword"
          children={field => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="signup-confirm-password">Confirm Password</FieldLabel>
                <Input
                  type="password"
                  id="signup-confirm-password"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="new-password"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit">
            Create Account
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
