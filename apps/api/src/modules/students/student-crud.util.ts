export const NEW_PAID_STUDENT_LABEL_DAYS = 30;

/** Compute integer age (in completed years) from a date of birth. */
export function computeAgeFromDob(dob: Date, asOf: Date = new Date()): number {
  let age = asOf.getFullYear() - dob.getFullYear();
  const monthDiff = asOf.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}
