// ============================================================
// PARENTAL LEAVE PLANNER, STATE LEAVE DATA FILE
// ============================================================
// HOW TO USE THIS FILE IN CURSOR:
//   1. Copy this file into your project's /src/data/ folder
//   2. Import it in your results page:
//      import { STATE_LEAVE_DATA, getStateLeave } from '../data/stateleavedata'
//   3. Call getStateLeave("CA") to get California's data, etc.
//
// DATA SOURCES (verify annually, laws change):
//   - State labor department websites
//   - DOL.gov for FMLA
//   - NCSL.org for state-by-state comparison
//
// LAST UPDATED: 2024
// ============================================================

export const STATE_LEAVE_DATA = {

  // ── CALIFORNIA ─────────────────────────────────────────────
  CA: {
    name: "California",
    hasStatePaidLeave: true,

    // State Disability Insurance (SDI), covers medical/birth recovery
    sdi: {
      available: true,
      name: "CA State Disability Insurance (SDI)",
      weeksDurationVaginal: 6,
      weeksDurationCsection: 8,
      payPercent: 0.70,           // ~60-70% of wages
      payPercentNote: "60-70% of wages, up to state weekly benefit cap",
      weeklyCapDollars: 1620,     // 2024 cap (no cap as of Jan 2025, update annually)
      waitingPeriodDays: 7,
      filingNote: "File SDI claim with EDD before or immediately after birth. Do NOT wait.",
      adminAgency: "CA Employment Development Department (EDD)",
      adminUrl: "https://edd.ca.gov/disability",
    },

    // Paid Family Leave (PFL), covers baby bonding after SDI ends
    pfl: {
      available: true,
      name: "CA Paid Family Leave (PFL)",
      weeksDuration: 8,           // 8 weeks of bonding
      payPercent: 0.70,
      payPercentNote: "60-70% of wages, same rate as SDI",
      weeklyCapDollars: 1620,
      waitingPeriodDays: 0,       // No waiting period for PFL
      filingNote: "File a SEPARATE PFL claim when SDI ends. It is NOT automatic. File through EDD.",
      adminAgency: "CA Employment Development Department (EDD)",
      adminUrl: "https://edd.ca.gov/family",
      sequencing: "Begins after SDI ends. Cannot run concurrently with SDI.",
    },

    // State job protection (beyond FMLA)
    stateProtection: {
      available: true,
      name: "CA Family Rights Act (CFRA)",
      weeksProtected: 12,         // 12 weeks bonding, separate from CFRA medical
      employerSizeThreshold: 5,   // Applies to employers with 5+ employees (broader than FMLA)
      note: "CFRA provides state job protection for bonding, running concurrently with FMLA. For employers with 5+ employees, broader than federal FMLA (50+). Pregnancy disability leave (PDL) provides additional protection during medical recovery.",
    },

    // Pregnancy Disability Leave, pre-birth + post-birth medical recovery; runs before CFRA bonding
    pdl: {
      available: true,
      name: "Pregnancy Disability Leave (PDL)",
      maxWeeks: 17.33,            // four months
      typicalPreBirthWeeks: 4,
      employerSizeThreshold: 5,
      paidBySDI: true,
      runsConcurrentlyWithFMLA: true,
      runsConcurrentlyWithCFRA: false,
      note: "PDL covers any period the birthing parent is medically unable to work due to pregnancy. CFRA bonding leave begins only after PDL ends. PDL applies to employers with 5+ employees, broader than FMLA.",
    },

    stateProtectionLaws: [
      {
        name: "California Family Rights Act (CFRA)",
        weeksBeyondFMLA: 12,
        employerSizeThreshold: 5,
        note: "12 weeks protection; applies to employers with 5+ employees (vs FMLA's 50+). Runs concurrently with FMLA; provides protection through bonding period even after FMLA exhausts.",
      },
    ],
    hasProtectionBeyondFMLA: true,

    // Stacking notes for the timeline builder
    stackingNotes: [
      "FMLA and CFRA run concurrently with SDI and PFL.",
      "STD coordinates with SDI, most employer STD plans top up to 100%, not pay on top.",
      "Employer parental leave typically runs concurrently with SDI/PFL (confirm with HR).",
      "A CA birthing parent may have up to ~17.33 weeks of Pregnancy Disability Leave (PDL) followed by 12 weeks of CFRA bonding, roughly 29 weeks of total job-protected leave if eligible.",
      "PFL is state-paid but job protection comes from CFRA, not PFL itself.",
    ],
  },

  // ── NEW YORK ────────────────────────────────────────────────
  NY: {
    name: "New York",
    hasStatePaidLeave: true,

    sdi: {
      available: true,
      name: "NY Disability Benefits Law (DBL)",
      weeksDurationVaginal: 6,
      weeksDurationCsection: 8,
      payPercent: 0.50,
      payPercentNote: "50% of wages but capped at $170/week, extremely low. STD is critical.",
      weeklyCapDollars: 170,      // Very low cap, major gap employer STD must fill
      waitingPeriodDays: 7,
      filingNote: "File DBL claim through your employer's DBL insurance carrier (not a state agency).",
      adminAgency: "NY Workers' Compensation Board",
      adminUrl: "https://www.wcb.ny.gov",
    },

    pfl: {
      available: true,
      name: "NY Paid Family Leave (NY PFL)",
      weeksDuration: 12,          // 12 weeks of bonding
      payPercent: 0.67,
      payPercentNote: "67% of NY State Average Weekly Wage (NYSAWW), capped at 67% of NYSAWW",
      weeklyCapDollars: 1177,     // 2024: 67% of $1,757.19 NYSAWW
      waitingPeriodDays: 0,
      filingNote: "File NY PFL claim separately through your employer's PFL insurance carrier when DBL ends.",
      adminAgency: "NY Workers' Compensation Board",
      adminUrl: "https://paidfamilyleave.ny.gov",
      sequencing: "Begins after DBL ends. Cannot run concurrently with DBL.",
    },

    stateProtection: {
      available: true,
      name: "NY Paid Family Leave (job protection component)",
      weeksProtected: 12,
      employerSizeThreshold: 1,   // Applies to ALL private employers
      note: "NY PFL provides both pay AND job protection for bonding. Applies to all private employers regardless of size, broader than FMLA.",
    },

    stateProtectionLaws: [
      {
        name: "NY Paid Family Leave",
        weeksBeyondFMLA: 12,
        employerSizeThreshold: 1,
        note: "12 weeks bonding protection; applies to ALL private employers regardless of size.",
      },
    ],
    hasProtectionBeyondFMLA: true,

    stackingNotes: [
      "NY DBL cap of $170/week is extremely low, employer STD is essential to fill this gap.",
      "NY PFL provides 12 weeks of bonding pay AND job protection, more generous than FMLA's 12 weeks protection-only.",
      "FMLA and NY PFL may run concurrently during bonding phase.",
      "After FMLA exhausts, NY PFL still provides state job protection through bonding period.",
      "Both DBL and PFL are filed through employer's insurance carrier, not a state website.",
    ],
  },

  // ── NEW JERSEY ──────────────────────────────────────────────
  NJ: {
    name: "New Jersey",
    hasStatePaidLeave: true,

    sdi: {
      available: true,
      name: "NJ Temporary Disability Insurance (TDI)",
      weeksDurationVaginal: 6,
      weeksDurationCsection: 8,
      payPercent: 0.85,
      payPercentNote: "85% of wages, up to weekly cap",
      weeklyCapDollars: 1055,     // 2024 cap
      waitingPeriodDays: 7,
      filingNote: "File TDI claim with NJ Division of Temporary Disability and Family Leave Insurance.",
      adminAgency: "NJ Division of Temporary Disability and Family Leave Insurance",
      adminUrl: "https://myleavebenefits.nj.gov",
    },

    pfl: {
      available: true,
      name: "NJ Family Leave Insurance (FLI)",
      weeksDuration: 12,
      payPercent: 0.85,
      payPercentNote: "85% of wages, up to weekly cap",
      weeklyCapDollars: 1055,
      waitingPeriodDays: 0,
      filingNote: "File FLI claim separately through NJ Division of Temporary Disability when TDI ends.",
      adminAgency: "NJ Division of Temporary Disability and Family Leave Insurance",
      adminUrl: "https://myleavebenefits.nj.gov",
      sequencing: "Begins after TDI ends.",
    },

    stateProtection: {
      available: true,
      name: "NJ Family Leave Act (NJFLA)",
      weeksProtected: 12,
      employerSizeThreshold: 30,  // Employers with 30+ employees
      note: "NJFLA protects bonding leave. Note: NJFLA does NOT cover the birthing parent's own medical disability, that's FMLA. They layer together.",
    },

    stateProtectionLaws: [
      {
        name: "NJ Family Leave Act (NJFLA)",
        weeksBeyondFMLA: 12,
        employerSizeThreshold: 30,
        note: "12 weeks bonding protection; applies to employers with 30+ employees.",
      },
    ],
    hasProtectionBeyondFMLA: true,

    stackingNotes: [
      "NJ has one of the most generous pay rates at 85%, but the weekly dollar cap still limits high earners.",
      "NJFLA covers bonding only; FMLA covers the medical recovery period for birthing parent.",
      "TDI and FLI are both administered through the same NJ agency, easier to navigate than NY.",
    ],
  },

  // ── WASHINGTON STATE ────────────────────────────────────────
  WA: {
    name: "Washington",
    hasStatePaidLeave: true,

    sdi: {
      available: true,
      name: "WA Paid Family & Medical Leave, Medical portion",
      weeksDurationVaginal: 6,
      weeksDurationCsection: 8,
      payPercent: 0.90,
      payPercentNote: "Up to 90% for lower earners; 90% of wages up to state avg, then 50% above that",
      weeklyCapDollars: 1456,     // 2024 cap (150% of state avg weekly wage)
      waitingPeriodDays: 7,
      filingNote: "File through WA Employment Security Department (ESD). One combined program, same claim covers medical and bonding.",
      adminAgency: "WA Employment Security Department (ESD)",
      adminUrl: "https://paidleave.wa.gov",
    },

    pfl: {
      available: true,
      name: "WA Paid Family & Medical Leave, Family/Bonding portion",
      weeksDuration: 12,
      payPercent: 0.90,
      payPercentNote: "Same formula as medical portion",
      weeklyCapDollars: 1456,
      waitingPeriodDays: 0,
      filingNote: "Same claim as medical leave, WA has a unified program. Total combined max is 16-18 weeks for birthing parents.",
      adminAgency: "WA Employment Security Department (ESD)",
      adminUrl: "https://paidleave.wa.gov",
      sequencing: "Medical and family leave are one combined program. Birthing parent can receive up to 16 weeks total (18 with pregnancy complications).",
    },

    stateProtection: {
      available: true,
      name: "WA Paid Family & Medical Leave (job protection component)",
      weeksProtected: 16,
      employerSizeThreshold: 50,  // Job protection for employers 50+; smaller employers: pay but no protection
      note: "Employees at employers with 50+ employees have job protection. Under 50 employees: still get the pay, but no guaranteed job protection.",
    },

    stateProtectionLaws: [
      {
        name: "WA Paid Family & Medical Leave",
        weeksBeyondFMLA: 12,
        employerSizeThreshold: 50,
        note: "12 weeks protection; applies to employers with 50+ employees. Expanding to 25+ in 2026 and 15+ in 2027.",
      },
    ],
    hasProtectionBeyondFMLA: true,

    stackingNotes: [
      "WA has one of the most generous programs, unified medical + bonding, up to 18 weeks for birthing parents.",
      "Employer size matters: 50+ employees = pay + protection; under 50 = pay only.",
      "WA's benefit formula is tiered, lower earners get closer to 90%, higher earners get less as % of wages.",
    ],
  },

  // ── MASSACHUSETTS ───────────────────────────────────────────
  MA: {
    name: "Massachusetts",
    hasStatePaidLeave: true,

    sdi: {
      available: true,
      name: "MA Paid Family and Medical Leave, Medical portion",
      weeksDurationVaginal: 6,
      weeksDurationCsection: 8,
      payPercent: 0.80,
      payPercentNote: "80% of wages up to 50% of state avg weekly wage, then 50% above that",
      weeklyCapDollars: 1144,     // 2024 cap
      waitingPeriodDays: 7,
      filingNote: "File through MA Department of Family and Medical Leave (DFML).",
      adminAgency: "MA Department of Family and Medical Leave",
      adminUrl: "https://www.mass.gov/paid-family-medical-leave",
    },

    pfl: {
      available: true,
      name: "MA Paid Family and Medical Leave, Family/Bonding portion",
      weeksDuration: 12,
      payPercent: 0.80,
      payPercentNote: "Same formula as medical portion",
      weeklyCapDollars: 1144,
      waitingPeriodDays: 0,
      filingNote: "File separately for family leave when medical leave ends, through MA DFML.",
      adminAgency: "MA Department of Family and Medical Leave",
      adminUrl: "https://www.mass.gov/paid-family-medical-leave",
      sequencing: "Begins after medical leave ends. Total max for birthing parent: up to 26 weeks combined in a year.",
    },

    stateProtection: {
      available: true,
      name: "MA PFML Job Protection",
      weeksProtected: 12,
      employerSizeThreshold: 25,
      note: "Job protection for employers with 25+ employees. Under 25: entitled to pay but may not have job protection.",
    },

    stateProtectionLaws: [
      {
        name: "MA PFML",
        weeksBeyondFMLA: 12,
        employerSizeThreshold: 25,
        note: "12 weeks protection; applies to employers with 25+ employees.",
      },
    ],
    hasProtectionBeyondFMLA: true,

    stackingNotes: [
      "MA has a unified PFML program, one agency, one portal for both medical and bonding.",
      "Employer size threshold for protection is 25 (lower than FMLA's 50).",
      "Up to 26 total weeks possible in a benefit year for birthing parents.",
    ],
  },

  // ── CONNECTICUT ─────────────────────────────────────────────
  CT: {
    name: "Connecticut",
    hasStatePaidLeave: true,

    sdi: {
      available: false,           // CT does not have a separate state disability program
      name: "No separate CT state disability program",
      weeksDurationVaginal: 0,
      weeksDurationCsection: 0,
      payPercent: 0,
      payPercentNote: "CT has no state disability insurance. Employer STD is critical during medical recovery.",
      weeklyCapDollars: 0,
      waitingPeriodDays: 0,
      filingNote: "No state disability claim to file. Rely on employer STD during medical recovery phase.",
      adminAgency: "N/A",
      adminUrl: "",
    },

    pfl: {
      available: true,
      name: "CT Paid Leave (CTPL)",
      weeksDuration: 12,
      payPercent: 0.95,
      payPercentNote: "95% of wages up to 60x CT minimum wage, then 60% above that",
      weeklyCapDollars: 941,      // 2024 cap
      waitingPeriodDays: 0,
      filingNote: "File through CT Paid Leave Authority. Can be used for bonding, starts after birth/adoption.",
      adminAgency: "CT Paid Leave Authority",
      adminUrl: "https://ctpaidleave.org",
      sequencing: "Bonding leave, no medical/disability component. Birthing parent uses FMLA or employer STD for medical recovery, then CTPL for bonding.",
    },

    stateProtection: {
      available: true,
      name: "CT Family and Medical Leave Act (CT FMLA)",
      weeksProtected: 12,
      employerSizeThreshold: 1,   // Applies to ALL employers with 1+ employee
      note: "CT FMLA applies to ALL employers, even those with just 1 employee. Much broader than federal FMLA.",
    },

    stateProtectionLaws: [
      {
        name: "Connecticut Family and Medical Leave Act (CTFMLA)",
        weeksBeyondFMLA: 12,
        employerSizeThreshold: 1,
        note: "12 weeks protection; applies to ALL employers with 1+ employee.",
      },
    ],
    hasProtectionBeyondFMLA: true,

    stackingNotes: [
      "⚠️ CT has NO state disability insurance, the medical recovery phase is NOT covered by state pay.",
      "Employer STD is essential for CT residents during the 6-8 week medical recovery phase.",
      "CT FMLA covers all employers (1+ employee), much broader than federal.",
      "CTPL covers bonding only; medical phase relies entirely on employer STD or unpaid FMLA.",
    ],
  },

  // ── COLORADO ────────────────────────────────────────────────
  CO: {
    name: "Colorado",
    hasStatePaidLeave: true,

    sdi: {
      available: true,
      name: "CO Family and Medical Leave Insurance, Medical portion (FAMLI)",
      weeksDurationVaginal: 6,
      weeksDurationCsection: 8,
      payPercent: 0.90,
      payPercentNote: "90% of wages up to 50% of state avg weekly wage, then 50% above",
      weeklyCapDollars: 1100,     // Approximate 2024 cap
      waitingPeriodDays: 0,       // No waiting period
      filingNote: "File through CO FAMLI Division. One unified program.",
      adminAgency: "CO FAMLI Division",
      adminUrl: "https://famli.colorado.gov",
    },

    pfl: {
      available: true,
      name: "CO FAMLI, Family/Bonding portion",
      weeksDuration: 12,
      payPercent: 0.90,
      payPercentNote: "Same formula as medical portion",
      weeklyCapDollars: 1100,
      waitingPeriodDays: 0,
      filingNote: "Same program as medical leave. Total max 16 weeks for birthing parents (12 bonding + up to 4 additional for pregnancy complications).",
      adminAgency: "CO FAMLI Division",
      adminUrl: "https://famli.colorado.gov",
      sequencing: "Medical and bonding are part of same program. Max 12 weeks bonding after medical portion.",
    },

    stateProtection: {
      available: true,
      name: "CO FAMLI Job Protection",
      weeksProtected: 12,
      employerSizeThreshold: 10,
      note: "Employers with 10+ employees must provide job protection. Under 10: entitled to pay but no job protection guarantee.",
    },

    stateProtectionLaws: [
      {
        name: "Colorado FAMLI",
        weeksBeyondFMLA: 12,
        employerSizeThreshold: 10,
        note: "12 weeks protection; applies to employers with 10+ employees.",
      },
    ],
    hasProtectionBeyondFMLA: true,

    stackingNotes: [
      "CO FAMLI launched in 2024, relatively new program, verify current caps.",
      "No waiting period, one of the most accessible programs.",
      "Employer size threshold for job protection is 10 (lower than FMLA's 50).",
    ],
  },

  // ── OREGON ──────────────────────────────────────────────────
  OR: {
    name: "Oregon",
    hasStatePaidLeave: true,

    sdi: {
      available: true,
      name: "OR Paid Leave, Medical portion",
      weeksDurationVaginal: 6,
      weeksDurationCsection: 8,
      payPercent: 0.60,
      payPercentNote: "60% of wages up to 65% of state avg weekly wage, then 100% up to cap for lower earners",
      weeklyCapDollars: 1523,     // 2024 cap (120% of state avg weekly wage)
      waitingPeriodDays: 0,
      filingNote: "File through OR Employment Department.",
      adminAgency: "OR Employment Department",
      adminUrl: "https://paidleave.oregon.gov",
    },

    pfl: {
      available: true,
      name: "OR Paid Leave, Family/Bonding portion",
      weeksDuration: 12,
      payPercent: 0.60,
      payPercentNote: "Same formula as medical portion",
      weeklyCapDollars: 1523,
      waitingPeriodDays: 0,
      filingNote: "File through OR Employment Department. Bonding begins after medical leave.",
      adminAgency: "OR Employment Department",
      adminUrl: "https://paidleave.oregon.gov",
      sequencing: "Medical and bonding are parts of same program. Birthing parent max: up to 14 weeks (2 weeks pregnancy + 12 weeks bonding) beyond medical.",
    },

    stateProtection: {
      available: true,
      name: "OR Paid Leave Job Protection",
      weeksProtected: 12,
      employerSizeThreshold: 25,
      note: "Job protection for employers with 25+ employees. Under 25: still entitled to pay.",
    },

    stateProtectionLaws: [
      {
        name: "Oregon Paid Leave",
        weeksBeyondFMLA: 12,
        employerSizeThreshold: 25,
        note: "12 weeks protection; applies to employers with 25+ employees.",
      },
    ],
    hasProtectionBeyondFMLA: true,

    stackingNotes: [
      "OR Paid Leave launched in 2023, relatively new, verify current rates.",
      "Lower earners may receive up to 100% wage replacement due to tiered formula.",
      "Birthing parents can get up to 14 additional weeks beyond medical leave.",
    ],
  },

  // ── RHODE ISLAND ────────────────────────────────────────────
  RI: {
    name: "Rhode Island",
    hasStatePaidLeave: true,

    sdi: {
      available: true,
      name: "RI Temporary Disability Insurance (TDI)",
      weeksDurationVaginal: 6,
      weeksDurationCsection: 8,
      payPercent: 0.60,
      payPercentNote: "4.62% of wages in base period, capped at weekly max",
      weeklyCapDollars: 1007,     // 2024 cap
      waitingPeriodDays: 7,
      filingNote: "File with RI Department of Labor and Training.",
      adminAgency: "RI Department of Labor and Training",
      adminUrl: "https://dlt.ri.gov/individuals/temporary-disability-caregiver-insurance",
    },

    pfl: {
      available: true,
      name: "RI Temporary Caregiver Insurance (TCI)",
      weeksDuration: 6,           // Only 6 weeks, less generous than other states
      payPercent: 0.60,
      payPercentNote: "Same formula as TDI",
      weeklyCapDollars: 1007,
      waitingPeriodDays: 0,
      filingNote: "File TCI claim separately through RI DLT when TDI ends.",
      adminAgency: "RI Department of Labor and Training",
      adminUrl: "https://dlt.ri.gov/individuals/temporary-disability-caregiver-insurance",
      sequencing: "TCI begins after TDI ends. Only 6 weeks, significantly less than other states.",
    },

    stateProtection: {
      available: false,
      name: "No separate RI state job protection law",
      weeksProtected: 0,
      employerSizeThreshold: 0,
      note: "RI relies on federal FMLA for job protection. There is no separate RI job protection law for parental leave.",
    },

    stateProtectionLaws: [
      {
        name: "No state protection beyond FMLA",
        weeksBeyondFMLA: 0,
        employerSizeThreshold: 50,
        note: "No state protection beyond FMLA, flag this clearly. After week 12 there is no state job protection.",
      },
    ],
    hasProtectionBeyondFMLA: false,

    stackingNotes: [
      "RI TCI only provides 6 weeks of bonding, flag this as less generous vs other states.",
      "No state job protection beyond FMLA, if not FMLA eligible, user has no protection.",
      "RI was the first state to have paid family leave (2014) but hasn't expanded as aggressively.",
    ],
  },

  // ── MINNESOTA ───────────────────────────────────────────────
  MN: {
    name: "Minnesota",
    hasStatePaidLeave: true,

    sdi: {
      available: true,
      name: "MN Paid Leave, Medical portion",
      weeksDurationVaginal: 6,
      weeksDurationCsection: 8,
      payPercent: 0.90,
      payPercentNote: "90% of wages up to 50% of state avg weekly wage, then 66% above that",
      weeklyCapDollars: 1737,     // Approximate 2026 cap (program launches Jan 2026)
      waitingPeriodDays: 7,
      filingNote: "MN Paid Leave launches January 2026. File through MN Department of Employment and Economic Development (DEED).",
      adminAgency: "MN Department of Employment and Economic Development (DEED)",
      adminUrl: "https://paidleave.mn.gov",
    },

    pfl: {
      available: true,
      name: "MN Paid Leave, Family/Bonding portion",
      weeksDuration: 12,
      payPercent: 0.90,
      payPercentNote: "Same formula as medical portion",
      weeklyCapDollars: 1737,
      waitingPeriodDays: 0,
      filingNote: "Program launches January 2026. File through MN DEED.",
      adminAgency: "MN Department of Employment and Economic Development (DEED)",
      adminUrl: "https://paidleave.mn.gov",
      sequencing: "Medical and bonding combined max of 20 weeks.",
    },

    stateProtection: {
      available: true,
      name: "MN Paid Leave Job Protection",
      weeksProtected: 12,
      employerSizeThreshold: 1,   // All employers
      note: "⚠️ Program launches January 2026. Not yet available at time of writing. Applies to all employers.",
    },

    stateProtectionLaws: [
      {
        name: "Minnesota Parental Leave Act / MN Paid Leave",
        weeksBeyondFMLA: 12,
        employerSizeThreshold: 1,
        note: "Minnesota Parental Leave Act provides some protection now; full PFML protection launching January 2026.",
      },
    ],
    hasProtectionBeyondFMLA: true,

    stackingNotes: [
      "⚠️ MN Paid Leave launches January 2026, flag this prominently for users.",
      "Will apply to ALL employers regardless of size when launched.",
      "One of the most generous programs when launched, verify rates at launch.",
    ],
  },

  // ── DELAWARE ────────────────────────────────────────────────
  DE: {
    name: "Delaware",
    hasStatePaidLeave: true,

    sdi: {
      available: false,
      name: "No separate DE state disability program",
      weeksDurationVaginal: 0,
      weeksDurationCsection: 0,
      payPercent: 0,
      payPercentNote: "DE has no state disability insurance. Employer STD essential during medical recovery.",
      weeklyCapDollars: 0,
      waitingPeriodDays: 0,
      filingNote: "No state disability. Rely on employer STD.",
      adminAgency: "N/A",
      adminUrl: "",
    },

    pfl: {
      available: true,
      name: "DE Paid Family and Medical Leave",
      weeksDuration: 12,
      payPercent: 0.80,
      payPercentNote: "80% of wages, up to weekly cap",
      weeklyCapDollars: 900,      // Approximate cap
      waitingPeriodDays: 0,
      filingNote: "Program launched 2025. File through DE Department of Labor.",
      adminAgency: "DE Department of Labor",
      adminUrl: "https://labor.delaware.gov/divisions/paid-leave",
      sequencing: "Bonding only, no medical component.",
    },

    stateProtection: {
      available: true,
      name: "DE PFML Job Protection",
      weeksProtected: 12,
      employerSizeThreshold: 10,
      note: "Applies to employers with 10+ employees.",
    },

    stateProtectionLaws: [
      {
        name: "Delaware PFML",
        weeksBeyondFMLA: 12,
        employerSizeThreshold: 10,
        note: "Delaware PFML job protection launching January 2026; applies to employers with 10+ employees.",
      },
    ],
    hasProtectionBeyondFMLA: true,

    stackingNotes: [
      "DE launched paid leave in 2025, verify current rates and caps.",
      "No state disability component, employer STD essential for medical recovery.",
    ],
  },

  // ── MARYLAND ────────────────────────────────────────────────
  MD: {
    name: "Maryland",
    hasStatePaidLeave: true,

    sdi: {
      available: false,
      name: "No separate MD state disability program",
      weeksDurationVaginal: 0,
      weeksDurationCsection: 0,
      payPercent: 0,
      payPercentNote: "MD has no state disability insurance. Employer STD critical during medical recovery.",
      weeklyCapDollars: 0,
      waitingPeriodDays: 0,
      filingNote: "No state disability. Rely on employer STD during medical recovery.",
      adminAgency: "N/A",
      adminUrl: "",
    },

    pfl: {
      available: true,
      name: "MD Time to Care Act (FAMLI+)",
      weeksDuration: 12,
      payPercent: 0.90,
      payPercentNote: "90% of wages up to 65% of state avg weekly wage",
      weeklyCapDollars: 1000,     // Approximate, verify when program launches
      waitingPeriodDays: 7,
      filingNote: "Program launches 2026. File through MD Department of Labor.",
      adminAgency: "MD Department of Labor",
      adminUrl: "https://www.labor.maryland.gov/paidleave",
      sequencing: "Bonding only, medical recovery relies on employer STD or FMLA.",
    },

    stateProtection: {
      available: true,
      name: "MD Time to Care Act Job Protection",
      weeksProtected: 12,
      employerSizeThreshold: 15,
      note: "⚠️ Program launches 2026. Applies to employers with 15+ employees.",
    },

    stateProtectionLaws: [
      {
        name: "Maryland PFML",
        weeksBeyondFMLA: 12,
        employerSizeThreshold: 15,
        note: "Maryland PFML job protection launching January 2026; applies to employers with 15+ employees.",
      },
    ],
    hasProtectionBeyondFMLA: true,

    stackingNotes: [
      "⚠️ MD FAMLI+ launches 2026, flag prominently for users.",
      "No state disability, employer STD essential during medical recovery phase.",
    ],
  },

  // ── ALL OTHER STATES (no state paid leave) ──────────────────
  DEFAULT: {
    name: "No State Paid Leave",
    hasStatePaidLeave: false,

    sdi: {
      available: false,
      name: "No state disability insurance",
      weeksDurationVaginal: 0,
      weeksDurationCsection: 0,
      payPercent: 0,
      payPercentNote: "No state pay during medical recovery. Employer STD is the only income source.",
      weeklyCapDollars: 0,
      waitingPeriodDays: 0,
      filingNote: "No state claim to file. Rely entirely on employer STD and parental leave.",
      adminAgency: "N/A",
      adminUrl: "",
    },

    pfl: {
      available: false,
      name: "No state paid family leave",
      weeksDuration: 0,
      payPercent: 0,
      payPercentNote: "No state bonding pay. Employer parental leave is the only paid bonding option.",
      weeklyCapDollars: 0,
      waitingPeriodDays: 0,
      filingNote: "No state claim to file. Rely on employer parental leave policy.",
      adminAgency: "N/A",
      adminUrl: "",
      sequencing: "N/A",
    },

    stateProtection: {
      available: false,
      name: "FMLA only (federal)",
      weeksProtected: 12,
      employerSizeThreshold: 50,
      note: "No state protection beyond federal FMLA. After 12 weeks of FMLA, there is no job protection.",
    },

    stateProtectionLaws: [
      {
        name: "No state protection beyond FMLA",
        weeksBeyondFMLA: 0,
        employerSizeThreshold: 50,
        note: "No state protection beyond FMLA, after week 12 there is no job protection.",
      },
    ],
    hasProtectionBeyondFMLA: false,

    stackingNotes: [
      "⚠️ This state has NO paid leave program. The user is entirely dependent on employer benefits.",
      "FMLA provides 12 weeks of unpaid job protection ONLY, no pay.",
      "After FMLA exhausts, there is no job protection. This is a significant risk to flag.",
      "Strongly encourage users in these states to negotiate extended unpaid leave with HR before going on leave.",
    ],
  },
};

// ── FMLA FEDERAL DATA ────────────────────────────────────────
export const FMLA = {
  name: "Family and Medical Leave Act (FMLA)",
  weeksProtected: 12,
  paid: false,
  employerSizeThreshold: 50,
  tenureRequirementMonths: 12,
  hoursWorkedRequirement: 1250,
  note: "Federal law. Provides 12 weeks of UNPAID, job-protected leave. Runs concurrently with all other leave types. Eligibility: employer must have 50+ employees; employee must have worked 12+ months and 1,250+ hours in past year.",
  adminUrl: "https://www.dol.gov/agencies/whd/fmla",
};

// ── HELPER FUNCTIONS ─────────────────────────────────────────

/**
 * Get state leave data by 2-letter state code.
 * Returns the state's data if it has paid leave, or DEFAULT if not.
 * Usage: getStateLeave("CA") or getStateLeave("TX")
 */
export function getStateLeave(stateCode) {
  return STATE_LEAVE_DATA[stateCode.toUpperCase()] || STATE_LEAVE_DATA.DEFAULT;
}

/**
 * Returns true if the state has a paid leave program.
 */
export function stateHasPaidLeave(stateCode) {
  const data = STATE_LEAVE_DATA[stateCode.toUpperCase()];
  return data ? data.hasStatePaidLeave : false;
}

/**
 * Returns true if the state has state disability insurance (SDI/TDI/DBL).
 * Important because states without SDI have a gap during medical recovery.
 */
export function stateHasSDI(stateCode) {
  const data = STATE_LEAVE_DATA[stateCode.toUpperCase()];
  return data ? data.sdi.available : false;
}

/**
 * Get list of all states with paid leave programs.
 */
export function getStatesWithPaidLeave() {
  return Object.entries(STATE_LEAVE_DATA)
    .filter(([key, val]) => key !== "DEFAULT" && val.hasStatePaidLeave)
    .map(([key, val]) => ({ code: key, name: val.name }));
}

/**
 * Calculate total potential paid weeks for a birthing parent in a given state.
 * @param {string} stateCode - 2-letter state code
 * @param {string} birthType - "vaginal" or "csection"
 */
export function getTotalPotentialPaidWeeks(stateCode, birthType = "csection") {
  const state = getStateLeave(stateCode);
  const disabilityWeeks = birthType === "csection"
    ? state.sdi.weeksDurationCsection
    : state.sdi.weeksDurationVaginal;
  const bondingWeeks = state.pfl.weeksDuration || 0;
  return disabilityWeeks + bondingWeeks;
}
