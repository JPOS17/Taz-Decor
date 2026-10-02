// Single source of truth for password requirements
// Used by the Register and ResetPassword pages so the live checklist, the
// strength meter, and the submit-time validation can never drift apart

export interface PasswordRequirement {
  id: string;
  // Short label shown in the live checklist
  label: string;
  // Sentence shown when the password fails this requirement on submit
  errorMessage: string;
  test: (password: string) => boolean;
}

// Characters that count as "special"
const SPECIAL_CHARACTER = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "At least 8 characters",
    errorMessage: "Password must be at least 8 characters long",
    test: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    errorMessage: "Password must contain at least one uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    errorMessage: "Password must contain at least one lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "One number",
    errorMessage: "Password must contain at least one number",
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "One special character",
    errorMessage: "Password must contain at least one special character",
    test: (password) => SPECIAL_CHARACTER.test(password),
  },
];

export interface PasswordStrength {
  // Number of requirements met, 0–5
  score: number;
  // Human-readable rating for the strength meter
  label: string;
  // Each requirement with whether the password currently satisfies it
  results: { id: string; label: string; met: boolean }[];
}

const STRENGTH_LABELS = ["", "Weak", "Weak", "Fair", "Good", "Strong"];

// Evaluates a password against every requirement
export const getPasswordStrength = (password: string): PasswordStrength => {
  const results = PASSWORD_REQUIREMENTS.map(({ id, label, test }) => ({
    id,
    label,
    met: test(password),
  }));
  const score = results.filter((r) => r.met).length;
  return { score, label: STRENGTH_LABELS[score], results };
};

// Returns the first unmet requirement's error message, or null if the password passes
export const getPasswordError = (password: string): string | null => {
  const failed = PASSWORD_REQUIREMENTS.find((r) => !r.test(password));
  return failed ? failed.errorMessage : null;
};