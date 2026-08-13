export function getAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email already exists. Try logging in.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before logging in.";
  }
  if (lower.includes("password should be at least")) {
    return "Password does not meet Supabase security requirements.";
  }

  return message;
}
