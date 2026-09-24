# FTE B2G Command Center — DESIGN.md
> Enterprise B2B Fire Protection & Safety Procurement Intelligence Design System  
> Tailored for Firetrade Engineering PCL (https://firetrade.co.th/)

---

## 1. Design Philosophy
- **Executive Dark & Clean Slate Canvas (`#f8fafc` & `#0f172a`):** Professional engineering interface balancing authority and clarity.
- **Flame Red Primary Anchor (`#dc2626` / `#b91c1c`):** High-visibility brand color representing fire protection, active alerts, and primary actions.
- **Hairline Precision (`#e2e8f0`):** 1px borders providing structure without visual clutter.
- **Financial Clarity (`#16a34a` / `#059669`):** Emerald Green strictly reserved for budget, true profit, and contract values.
- **Engineered Multi-Group Identity:** Dedicated badges for 5 fire safety product categories (Fire Alarm, Sprinklers/Pumps, Gas/Clean Agent, Hydrants/Valves, Emergency Lights).

---

## 2. Design Tokens

### Colors
```yaml
colors:
  # Primary Signal & Brand (FTE Flame & Safety)
  primary: "#dc2626"           # FTE Flame Red
  primary-dark: "#b91c1c"      # Deep Crimson Red
  primary-electric: "#ef4444"  # Bright Alert Red
  primary-soft: "#fef2f2"      # Tint for active cards/rows
  on-primary: "#ffffff"

  # Corporate Secondary & Engineering Accents
  secondary-navy: "#002244"    # Executive Deep Navy Header
  secondary-blue: "#0284c7"    # Engineering Cyan / Sky Blue
  accent-orange: "#ea580c"     # Fire Safety Orange

  # Ink / Typography
  ink: "#0f172a"               # High-contrast headline / title
  ink-deep: "#020617"          # Pure dark text
  ink-soft: "#334155"          # Secondary metadata / labels
  ink-muted: "#64748b"         # Helper captions / placeholders
  on-ink: "#ffffff"

  # Canvas & Slabs
  canvas: "#f8fafc"            # Slate-50 subtle surface
  paper: "#ffffff"             # Pure white card surface
  cloud: "#f1f5f9"             # Slate-100 hover backgrounds
  hairline: "#e2e8f0"          # 1px hairline border
  hairline-strong: "#cbd5e1"   # Focused / active border

  # 5 FTE Product Categories
  group-fire-alarm: "#dc2626"          # Red (Alarm & Detectors)
  group-fire-sprinkler-pump: "#0284c7" # Blue (Sprinklers & Pumps)
  group-fire-suppression-gas: "#7c3aed"# Purple (Clean Agent Novec/FM-200/CO2)
  group-fire-hydrant: "#ea580c"        # Orange (Hydrant, FHC, Valves)
  group-safety-emergency: "#16a34a"    # Green (Emergency Light Max Bright & Safety)
```

### Typography
- **Primary Thai & Latin Font:** `'Anuphan'`, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Monospace (Project IDs & Code):** 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace
- **Scale:**
  - `title-xl`: `22px` / weight 800 / line-height 1.2
  - `title-lg`: `18px` / weight 700 / line-height 1.3
  - `title-md`: `16px` / weight 600 / line-height 1.35
  - `body-sm`: `13px` / weight 500 / line-height 1.5
  - `caption`: `11px` / weight 600 / uppercase
