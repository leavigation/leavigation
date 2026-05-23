import type { ProgramPillKind } from "./leaveGuideStateModel";

export interface LeaveGuideProgramRow {
  pill: ProgramPillKind;
  name: string;
  description: string;
}

export const TIER1_PROGRAM_ROWS: Record<string, LeaveGuideProgramRow[]> = {
  CA: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description:
        "12 weeks job protection. Requires 12 months + 1,250 hours + employer 50+ employees.",
    },
    {
      pill: "jobProtection",
      name: "CA Pregnancy Disability Leave (PDL)",
      description:
        "Up to 17.3 weeks of job protection during pregnancy. No minimum employment requirement. Covers employers with 5+ employees.",
    },
    {
      pill: "jobProtection",
      name: "CA California Family Rights Act (CFRA)",
      description:
        "12 weeks job protected bonding leave. Starts day after PDL ends. Requires 12 months employment. Covers employers with 5+ employees.",
    },
    {
      pill: "sdi",
      name: "CA State Disability Insurance (SDI)",
      description:
        "Pays 60 to 90% of wages during pregnancy disability. Up to 8 weeks for C section or 6 weeks for vaginal birth. 7 day waiting period.",
    },
    {
      pill: "pfl",
      name: "CA Paid Family Leave (PFL)",
      description:
        "Pays 60 to 90% of wages during bonding. 8 weeks available. Starts after SDI ends. Must file separately with EDD.",
    },
    {
      pill: "pfl",
      name: "San Francisco Paid Parental Leave Ordinance (SF PPLO)",
      description:
        "Tops up CA PFL to 100% of salary for SF workers. Employer must have 20+ employees.",
    },
  ],
  CO: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description: "12 weeks job protection. Standard federal eligibility requirements.",
    },
    {
      pill: "jobProtection",
      name: "CO Family and Medical Leave Insurance job protection (FAMLI)",
      description:
        "Job protection for employers with 10+ employees. Employees at smaller employers receive pay only.",
    },
    {
      pill: "pfl",
      name: "CO Family and Medical Leave Insurance (FAMLI)",
      description:
        "90% of wages up to 50% of state average weekly wage, then 50% above that. Max approx. $1,100/week. Up to 12 weeks, or 16 weeks with pregnancy complications. File with CO FAMLI Division.",
    },
  ],
  CT: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description: "12 weeks job protection. Standard federal eligibility requirements.",
    },
    {
      pill: "jobProtection",
      name: "CT Family and Medical Leave Act (CT FMLA)",
      description:
        "12 weeks job protection at employers with 3+ employees, a lower threshold than federal FMLA.",
    },
    {
      pill: "pfl",
      name: "CT Paid Leave (CTPL)",
      description:
        "95% of wages up to 40x the minimum wage, then 60% above that threshold. Up to 12 weeks, or 14 weeks with pregnancy complications. Employee funded. File with CT Paid Leave Authority.",
    },
  ],
  DE: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description: "12 weeks job protection. Standard federal eligibility requirements.",
    },
    {
      pill: "jobProtection",
      name: "DE Paid Family and Medical Leave job protection (PFML)",
      description: "Job protection for employers with 10+ employees.",
    },
    {
      pill: "pfl",
      name: "DE Paid Family and Medical Leave (PFML)",
      description:
        "80% of wages, capped at 80% of state average weekly wage. Up to 12 weeks family leave plus 6 weeks medical leave per year. Benefits live January 2026. File with DE Department of Labor.",
    },
  ],
  DC: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description: "12 weeks job protection. Standard federal eligibility requirements.",
    },
    {
      pill: "jobProtection",
      name: "DC Family and Medical Leave Act (DC FMLA)",
      description:
        "12 weeks job protection at employers with 20+ employees. Broader family member definitions than federal FMLA.",
    },
    {
      pill: "pfl",
      name: "DC Paid Family Leave (PFL)",
      description:
        "90% of wages up to 150% of DC minimum wage, then 50% above that. Up to 12 weeks bonding plus 12 weeks medical plus 2 weeks prenatal. Employer funded. File with DC DOES.",
    },
  ],
  HI: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description: "12 weeks job protection. Standard federal eligibility requirements.",
    },
    {
      pill: "jobProtection",
      name: "HI Family Leave Law (HFLL)",
      description: "4 weeks unpaid job protected leave at employers with 100+ employees.",
    },
    {
      pill: "sdi",
      name: "HI Temporary Disability Insurance (TDI)",
      description:
        "Mandatory employer provided coverage. Pays 58% of wages up to $871/week. Up to 26 weeks. Covers pregnancy and postpartum recovery. 7 day waiting period. No state fund exists. Coverage is provided through your employer's private plan.",
    },
  ],
  ME: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description: "12 weeks job protection. Standard federal eligibility requirements.",
    },
    {
      pill: "jobProtection",
      name: "ME Paid Family and Medical Leave job protection (PFML)",
      description:
        "Job protection for all employers except federal. Requires 120 days of employment. Effective May 1, 2026.",
    },
    {
      pill: "pfl",
      name: "ME Paid Family and Medical Leave (PFML)",
      description:
        "Up to 90% of wages (income based). Up to 12 weeks. Max $1,198/week through June 2026. Benefits effective May 1, 2026. File with ME Department of Labor.",
    },
  ],
  MA: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description: "12 weeks job protection. Standard federal eligibility requirements.",
    },
    {
      pill: "jobProtection",
      name: "MA Paid Family and Medical Leave job protection (PFML)",
      description:
        "Job protection for employers with 25+ employees. Job restoration rights mirror FMLA structure.",
    },
    {
      pill: "pfl",
      name: "MA Paid Family and Medical Leave (PFML)",
      description:
        "80% of wages up to 50% of state average weekly wage, then 50% above that. Max approx. $1,149/week. Up to 12 weeks family plus 20 weeks medical; combined maximum 26 weeks. File with MA DUA.",
    },
  ],
  MN: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description: "12 weeks job protection. Standard federal eligibility requirements.",
    },
    {
      pill: "jobProtection",
      name: "MN Paid Leave job protection (MNPL)",
      description: "Job protection for employers with 30+ employees.",
    },
    {
      pill: "pfl",
      name: "MN Paid Family and Medical Leave (MNPL)",
      description:
        "90% of wages up to 33% of state average weekly wage, then 66% above that. Up to 12 weeks family plus 12 weeks medical; combined maximum 20 weeks. Benefits began January 2026. File with MN DEED.",
    },
  ],
  NJ: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description: "12 weeks job protection. Standard federal eligibility requirements.",
    },
    {
      pill: "jobProtection",
      name: "NJ Family Leave Act (FLA)",
      description: "12 weeks job protection at employers with 30+ employees. Runs concurrently with FMLA.",
    },
    {
      pill: "sdi",
      name: "NJ Temporary Disability Insurance (TDI)",
      description:
        "85% of wages, capped at 70% of statewide average weekly wage (max $1,119/week in 2026). Up to 26 weeks. Covers pregnancy disability. Employee and employer funded.",
    },
    {
      pill: "pfl",
      name: "NJ Family Leave Insurance (FLI)",
      description:
        "85% of wages, capped at 70% of statewide average weekly wage. 12 weeks. Employee funded via payroll. File with NJ Division of TDI.",
    },
  ],
  NY: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description: "12 weeks job protection. Standard federal eligibility requirements.",
    },
    {
      pill: "jobProtection",
      name: "NY Paid Family Leave job protection (PFL)",
      description: "12 weeks job protection alongside pay. Runs concurrently with FMLA where both apply.",
    },
    {
      pill: "sdi",
      name: "NY Disability Benefits Law (DBL)",
      description:
        "Pays 50% of wages, capped at $170/week. Up to 26 weeks. Covers pregnancy disability. The weekly cap is very low and most employees rely on employer STD for meaningful income replacement.",
    },
    {
      pill: "pfl",
      name: "NY Paid Family Leave (PFL)",
      description:
        "Pays 67% of the statewide average weekly wage. 12 weeks bonding. Employee funded via payroll deduction. File through employer's insurance carrier.",
    },
  ],
  OR: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description: "12 weeks job protection. Standard federal eligibility requirements.",
    },
    {
      pill: "jobProtection",
      name: "OR Paid Leave job protection (OPL)",
      description: "Job protection for employers with 25+ employees. Employees at smaller employers receive pay only.",
    },
    {
      pill: "pfl",
      name: "OR Paid Leave (OPL)",
      description:
        "60 to 100% of wages (income based). Up to 12 weeks, or 14 weeks with pregnancy complications. File with OR Employment Department.",
    },
  ],
  RI: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description: "12 weeks job protection. Standard federal eligibility requirements.",
    },
    {
      pill: "jobProtection",
      name: "RI Parental and Family Medical Leave Act (RIPFMLA)",
      description: "13 weeks unpaid job protected leave at employers with 50+ employees in any two calendar years.",
    },
    {
      pill: "sdi",
      name: "RI Temporary Disability Insurance (TDI)",
      description:
        "4.62% of highest quarter wages, max $1,103/week. Up to 30 weeks. Covers pregnancy disability and postpartum recovery. 7 day waiting period. Employee funded.",
    },
    {
      pill: "pfl",
      name: "RI Temporary Caregiver Insurance (TCI)",
      description:
        "Same rate as TDI, max $1,103/week. Up to 8 weeks bonding. Employee funded. File with RI Department of Labor and Training.",
    },
  ],
  VT: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description: "12 weeks job protection. Standard federal eligibility requirements.",
    },
    {
      pill: "jobProtection",
      name: "VT Parental and Family Leave Act (PFLA)",
      description:
        "12 weeks unpaid job protected leave. Covers employers with 10+ employees for parental leave and 15+ for family leave.",
    },
    {
      pill: "pfl",
      name: "VT Paid Family Leave (voluntary)",
      description:
        "Vermont has a voluntary paid leave program available through a state contracted insurer. Coverage is not guaranteed and depends on whether your employer has opted in. Check with your employer. If covered, benefits provide partial wage replacement for up to 12 weeks.",
    },
  ],
  WA: [
    {
      pill: "federal",
      name: "Family and Medical Leave Act (FMLA)",
      description: "12 weeks job protection. Standard federal eligibility requirements.",
    },
    {
      pill: "jobProtection",
      name: "WA Paid Family and Medical Leave job protection (PFML)",
      description:
        "Job protection for employers with 25+ employees as of January 2026, expanding to 15+ in 2027 and 8+ in 2028.",
    },
    {
      pill: "pfl",
      name: "WA Paid Family and Medical Leave (PFML)",
      description:
        "Pays 70 to 90% of wages (income based), capped at 90% of state average weekly wage. Up to 12 weeks family leave plus 12 weeks medical leave; combined maximum 16 weeks, or 18 weeks with pregnancy complications. File with WA ESD.",
    },
  ],
};
