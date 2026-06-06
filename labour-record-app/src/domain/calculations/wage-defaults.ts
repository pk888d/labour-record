export const WAGE_RULE_DEFAULTS: Record<string, number> = {
  HOLIDAY_MULTIPLIER: 2.0,
  OT_MULTIPLIER: 2.0,
  PF_EMPLOYEE_PCT: 12.0,
  PF_EMPLOYER_PCT: 13.0,
  ESI_EMPLOYEE_PCT: 0.75,
  ESI_EMPLOYER_PCT: 3.25,
}

export function getWageRuleValue(
  rules: Array<{ ruleKey: string; ruleValue: number }>,
  key: string
): number {
  const found = rules.find((r) => r.ruleKey === key)
  return found?.ruleValue ?? WAGE_RULE_DEFAULTS[key] ?? 0
}
