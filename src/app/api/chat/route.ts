import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const CA_LEAVE_KNOWLEDGE = `
You are Leavigation's parental leave assistant. You are an expert in California parental leave law, federal leave law, and the interactions between them. You help users understand their maternity and parental leave rights.

CORE KNOWLEDGE — 2026 RATES AND RULES:

CA SDI (State Disability Insurance):
- Covers pregnancy disability — 6 weeks vaginal birth, 8 weeks C-section
- Benefit rate: 90% of weekly wage if weekly wage ≤ $1,252 (70% of SAWW $1,789). Otherwise 70%.
- Maximum benefit: $1,765/week (2026 cap)
- 7-day unpaid waiting period — week 1 pays $0
- No minimum employment requirement
- Must file claim with EDD within 49 days of first day of disability
- Funded by employee payroll tax deductions

CA PFL (Paid Family Leave):
- Covers bonding after birth — 8 weeks available
- Same benefit rate as SDI (90% or 70%, capped at $1,765/week)
- No waiting period
- Starts the week after SDI ends
- Must file SEPARATELY from SDI — does not happen automatically
- No minimum employment requirement

CA PDL (Pregnancy Disability Leave):
- Up to 17.33 weeks (4 months) of JOB PROTECTION
- Covers pre-birth and post-birth recovery
- No minimum employment requirement (employer must have 5+ employees)
- DOES NOT pay you — SDI pays during PDL

CFRA (California Family Rights Act):
- 12 weeks of JOB PROTECTED bonding leave
- Starts the DAY AFTER PDL ends — never concurrent with PDL
- Requires: 12 months employment + 1,250 hours worked + employer 5+ employees
- DOES NOT pay you — PFL pays during CFRA

FMLA (Family and Medical Leave Act):
- Federal law — 12 weeks job protection
- Starts day 1 of leave (concurrent with PDL)
- Requires: 12 months employment + 1,250 hours + employer 50+ employees within 75 miles
- IMPORTANT: If pre-birth leave is taken, FMLA clock starts BEFORE birth and may exhaust before PDL ends
- CFRA continues job protection after FMLA exhausts

SF PPLO (San Francisco Paid Parental Leave Ordinance):
- Tops up CA PFL to 100% of weekly salary during PFL bonding weeks
- Only applies to SF workers at employers with 20+ employees
- Capped at $2,522/week (2026)
- Only active during PFL weeks — not during SDI weeks

KEY INTERACTIONS:
- PDL and FMLA run CONCURRENTLY from day 1
- CFRA starts AFTER PDL ends (stacks on top for maximum protection)
- CA birthing parents can get up to ~7 months total job protection (PDL + CFRA)
- SDI and PFL are PAID benefits — PDL, CFRA, FMLA are JOB PROTECTION only
- Job protection and pay are COMPLETELY SEPARATE — you can be protected but unpaid, or paid but unprotected

IMPORTANT CAVEATS:
- Always remind users this is general information, not legal advice
- Recommend consulting HR or a qualified attorney for complex situations
- EDD contact: 1-800-480-3287 or edd.ca.gov
- Benefits depend on base period wages, not necessarily current salary

CITATION SOURCES (always include relevant ones):
- CA SDI: https://edd.ca.gov/disability
- CA PFL: https://edd.ca.gov/paid-family-leave
- CA PDL: https://calcivilrights.ca.gov
- CFRA: https://calcivilrights.ca.gov
- FMLA: https://dol.gov/agencies/whd/fmla
- SF PPLO: https://sf.gov/information/paid-parental-leave-ordinance
- CA EDD rates: https://edd.ca.gov/disability/calculate-di-benefit-payment-amounts
- CA EDD general: https://edd.ca.gov
`;

const VERIFICATION_PROMPT = `You are a California parental leave law verification expert. Your job is to review an AI-generated answer about parental leave and verify it is 100% accurate before it reaches the user.

Check the answer against these rules:
1. SDI rates: 90% if weekly wage ≤ $1,252, else 70%, capped at $1,765/week (2026)
2. SDI waiting period: 7 days — week 1 = $0
3. PFL: 8 weeks bonding, same rate as SDI, no waiting period, must file separately
4. PDL: up to 17.33 weeks job protection, no min employment (employer 5+ employees)
5. CFRA: 12 weeks, starts DAY AFTER PDL ends, requires 12mo + 1250hrs + employer 5+
6. FMLA: 12 weeks, starts DAY 1 of leave concurrent with PDL, requires 50+ employee employer
7. SF PPLO: tops up PFL to 100%, capped at $2,522/week, SF workers only, employer 20+
8. SAWW 2026: $1,789/week

If the answer contains any factual errors, correct them.
If the answer is correct, return it as-is with any improvements for clarity.
Always ensure citations are included when laws are referenced.
Return ONLY the final verified answer — do not explain what you checked or changed.`;

export async function POST(req: NextRequest) {
  try {
    const { message, planContext, history } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

    const systemPrompt = `${CA_LEAVE_KNOWLEDGE}

${planContext ? `USER'S SPECIFIC PLAN CONTEXT:\n${planContext}\n\nUse this context to give personalized answers about their specific situation.` : ""}

RESPONSE FORMAT:
- Be warm, clear, and direct
- Use plain English — avoid jargon unless explaining a term
- Keep answers concise — 2-4 paragraphs max
- Always include a "Sources:" section at the end when referencing specific laws or programs
- Format sources as: • [Program Name] — [URL]
- End with a brief disclaimer if giving specific financial estimates: "This is an estimate based on 2026 CA EDD rates. Actual benefits depend on your base period wages."
- Never give legal advice — recommend consulting HR or an attorney for complex situations`;

    const messages = [
      ...(history || []),
      { role: "user", content: message }
    ];

    // First call — generate answer
    const firstRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 1024, system: systemPrompt, messages }),
    });
    const firstData = await firstRes.json();
    const firstAnswer = firstData.content?.[0]?.text;
    if (!firstAnswer) return NextResponse.json({ error: "No response generated" }, { status: 500 });

    // Second call — verify answer
    const verifyRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: VERIFICATION_PROMPT,
        messages: [{ role: "user", content: `Original question: "${message}"\n\nAnswer to verify:\n${firstAnswer}` }],
      }),
    });
    const verifyData = await verifyRes.json();
    const verifiedAnswer = verifyData.content?.[0]?.text ?? firstAnswer;

    return NextResponse.json({ answer: verifiedAnswer });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
