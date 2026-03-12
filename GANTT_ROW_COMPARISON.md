# Gantt row JSX comparison (label cell + divider cell)

## 1. HEADER ROW (Type / week numbers)

**Grid wrapper:**
```jsx
<div className="grid grid-flow-col gap-1 text-[10px] text-slate-500" style={gridStyle}>
```

**First cell (label):**
```jsx
<div className="min-w-[8rem] max-w-[8rem] w-32 shrink-0 text-[11px] font-medium text-slate-600 flex items-center overflow-hidden">
  Type
</div>
```

**Divider cell:** (BirthDividerCell component with `showLabel` and `rowHeight="min-h-[3rem]"`)
```jsx
<BirthDividerCell showLabel rowHeight="min-h-[3rem]" />
```
Which expands to:
```jsx
<div className="flex flex-col items-center shrink-0 w-4 min-w-4 max-w-4 min-h-[3rem] " aria-hidden>
  <div className="text-[10px] font-bold text-slate-700 whitespace-nowrap">👶 BIRTH</div>
  <div className="flex-1 min-h-0 w-0 border-l-2 border-dashed border-slate-600 self-stretch" />
</div>
```
Note: When `showLabel` is true, the component does NOT add `self-stretch` to the outer div (only when `!showLabel`).

---

## 2. PDL ROW (same as FMLA / stream rows)

**Grid wrapper:**
```jsx
<div className="mt-1 grid grid-flow-col gap-1 text-[10px]" style={gridStyle}>
```

**First cell (label):**
```jsx
<div
  className="min-w-[8rem] max-w-[8rem] w-32 shrink-0 pr-2 text-right font-medium text-slate-600 flex items-center overflow-hidden"
  title={...}
>
  {stream}
</div>
```

**Divider cell:** (inline div, not a component)
```jsx
<div className="flex flex-col items-center shrink-0 w-4 min-w-4 max-w-4 h-7 self-stretch" aria-hidden>
  <div className="flex-1 min-h-0 w-0 border-l-2 border-dashed border-slate-600 self-stretch" />
</div>
```

---

## 3. FMLA ROW (correctly aligned — same JSX as PDL)

Same as PDL row above; FMLA and PDL are both rendered by `streamRows.map(stream => ...)`.

---

## Differences that can cause misalignment

| Part | Header | PDL / FMLA |
|------|--------|------------|
| **Grid** | No `mt-1` | Has `mt-1` (layout only) |
| **Label** | No `pr-2 text-right`; has `text-[11px]` | Has `pr-2 text-right`; no `text-[11px]` |
| **Divider** | `BirthDividerCell`: has `min-h-[3rem]`, **no `self-stretch`** on outer div | Plain div: has `h-7 self-stretch` |

**Root cause:** The header’s divider is rendered by `BirthDividerCell`. When `showLabel` is true, the outer div gets `min-h-[3rem]` but **does not** get `self-stretch` (the code only adds `self-stretch` when `!showLabel`). Without `self-stretch`, the grid item may not fill the column width the same way as the other rows, so the divider column can render at a different effective width and look offset.

**Fix:** Make the header row use the same label and divider structure as the stream rows: add `pr-2 text-right` to the header label, and replace `BirthDividerCell` with an inline divider div that includes `self-stretch` (and the 👶 BIRTH label for the header).
