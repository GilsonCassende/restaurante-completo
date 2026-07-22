"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { loginSchema } from "@/schemas";

export type LoginActionState = {
  success: boolean;
  message: string;
};

const defaultState: LoginActionState = {
  success: false,
  message: "",
};

function normalizeCallbackUrl(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "/";
  }

  return value.startsWith("/") ? value : "/";
}

export async function loginAction(
  previousState: LoginActionState = defaultState,
  formData: FormData
): Promise<LoginActionState> {
  void previousState;

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Credenciais inválidas.",
    };
  }

  const callbackUrl = normalizeCallbackUrl(formData.get("callbackUrl"));

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });

    return {
      success: true,
      message: "",
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        message: "E-mail ou senha inválidos.",
      };
    }

    throw error;
  }
}

export async function logoutAction() {
  await signOut({
    redirectTo: "/login",
  });
}
