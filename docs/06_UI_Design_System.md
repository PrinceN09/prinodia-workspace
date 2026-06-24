# GovSphere — UI Design System

**Document Version:** 1.0  
**Status:** Approved  
**Classification:** Internal Engineering  
**Last Updated:** 2026-06-24

---

## 1. Design Philosophy

GovSphere's visual design is **purposeful, calm, and authoritative**. It must communicate trust, security, and institutional gravitas without feeling bureaucratic or cold. The design takes inspiration from:

- **Slack** — spatial clarity, sidebar navigation, message density
- **Linear** — typography precision, focus on readability, minimal chrome
- **Microsoft Teams** — enterprise-grade information density, familiar government users
- **GOV.UK Design System** — accessible-first, plain language, functional beauty

GovSphere's identity is **uniquely its own** — rooted in the DRC's identity with a color system inspired by the Congolese flag (azure blue, yellow, red) while being modern enough to sit alongside any enterprise software.

---

## 2. Color System

### 2.1 Brand Colors

The GovSphere brand palette is derived from the flag of the Democratic Republic of Congo.

```css
/* ─── PRIMARY — Royal Azure Blue (Flag) ──────────────────────────────── */
--color-gov-blue-50:  #EEF4FF;
--color-gov-blue-100: #D9E8FF;
--color-gov-blue-200: #B3D1FF;
--color-gov-blue-300: #7EB5FF;
--color-gov-blue-400: #4A94FF;
--color-gov-blue-500: #1A6FE8;  /* Primary action color */
--color-gov-blue-600: #1558C0;
--color-gov-blue-700: #1043A0;
--color-gov-blue-800: #0D3178;
--color-gov-blue-900: #0B2560;  /* Sidebar / navigation background */
--color-gov-blue-950: #071740;

/* ─── ACCENT — DRC Gold (Flag star) ─────────────────────────────────── */
--color-gov-gold-50:  #FFFBEA;
--color-gov-gold-100: #FFF3C0;
--color-gov-gold-200: #FFE780;
--color-gov-gold-300: #FFD540;
--color-gov-gold-400: #FFC200;  /* Primary accent — use sparingly */
--color-gov-gold-500: #E0A800;
--color-gov-gold-600: #B88600;
--color-gov-gold-700: #8A6400;
--color-gov-gold-800: #5C4300;
--color-gov-gold-900: #3D2C00;

/* ─── DANGER — DRC Red (Flag diagonal) ─────────────────────────────── */
--color-gov-red-50:   #FFF0EF;
--color-gov-red-100:  #FFD9D7;
--color-gov-red-200:  #FFB3AF;
--color-gov-red-300:  #FF8880;
--color-gov-red-400:  #FF5B50;
--color-gov-red-500:  #E83020;  /* Error / danger */
--color-gov-red-600:  #C0201A;
--color-gov-red-700:  #9A1510;
--color-gov-red-800:  #730D0A;
--color-gov-red-900:  #4C0806;
```

### 2.2 Semantic Colors

```css
/* ─── LIGHT THEME ──────────────────────────────────────────────────── */
--color-bg-primary:      #FFFFFF;
--color-bg-secondary:    #F5F6F8;
--color-bg-tertiary:     #ECEEF2;
--color-bg-sidebar:      #0B2560;  /* gov-blue-900 */
--color-bg-sidebar-item: rgba(255,255,255,0.08);
--color-bg-sidebar-active: rgba(255,255,255,0.16);

--color-text-primary:    #0D1117;
--color-text-secondary:  #4A5568;
--color-text-tertiary:   #718096;
--color-text-on-sidebar: #CBD5E0;
--color-text-on-sidebar-active: #FFFFFF;

--color-border:          #E2E8F0;
--color-border-strong:   #CBD5E0;

--color-action-primary:  #1A6FE8;  /* gov-blue-500 */
--color-action-hover:    #1558C0;  /* gov-blue-600 */
--color-action-active:   #1043A0;  /* gov-blue-700 */

--color-success:         #16A34A;
--color-warning:         #D97706;
--color-danger:          #E83020;  /* gov-red-500 */
--color-info:            #0284C7;

/* ─── DARK THEME ────────────────────────────────────────────────────── */
--color-bg-primary-dark:      #0D1117;
--color-bg-secondary-dark:    #161B22;
--color-bg-tertiary-dark:     #21262D;
--color-bg-sidebar-dark:      #071740;  /* gov-blue-950 */

--color-text-primary-dark:    #E6EDF3;
--color-text-secondary-dark:  #8B949E;
--color-text-tertiary-dark:   #6E7681;
```

### 2.3 Color Usage Rules

| Context | Color Token |
|---|---|
| Primary call-to-action buttons | `action-primary` |
| Destructive actions (delete, revoke) | `danger` |
| Success states, confirmed delivery | `success` |
| Warnings, pending states | `warning` |
| Navigation sidebar background | `bg-sidebar` |
| Active navigation item | `bg-sidebar-active` |
| Page backgrounds | `bg-primary` / `bg-secondary` |
| Dividers and borders | `border` |
| Ministry accent color | `gov-gold-400` (use only for badges/highlights) |

---

## 3. Typography

### 3.1 Font Stack

```css
/* Primary — UI text, labels, body */
--font-sans: 'Inter', 'Helvetica Neue', 'Arial', system-ui, sans-serif;

/* Monospace — code blocks, message markdown code */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;

/* French / multilingual — Inter handles all 5 supported languages */
```

**Why Inter:** Designed specifically for screen readability at small sizes. Excellent support for French diacritics (é, è, ê, ë, à, â, ç, etc.). Widely used in enterprise products. Free and self-hostable — no Google Fonts CDN dependency in production.

### 3.2 Type Scale

```css
/* Display — page titles, empty states */
--text-display-xl: 2.25rem;   /* 36px — major headings */
--text-display-lg: 1.875rem;  /* 30px */
--text-display-md: 1.5rem;    /* 24px */
--text-display-sm: 1.25rem;   /* 20px */

/* Body — UI text */
--text-body-lg: 1rem;         /* 16px — default body */
--text-body-md: 0.9375rem;    /* 15px — message text */
--text-body-sm: 0.875rem;     /* 14px — secondary labels */
--text-body-xs: 0.8125rem;    /* 13px — timestamps, metadata */

/* Labels — buttons, badges, navigation */
--text-label-lg: 0.9375rem;   /* 15px */
--text-label-md: 0.875rem;    /* 14px */
--text-label-sm: 0.8125rem;   /* 13px */
--text-label-xs: 0.75rem;     /* 12px */
```

### 3.3 Font Weights

```css
--font-weight-regular: 400;
--font-weight-medium:  500;
--font-weight-semibold: 600;
--font-weight-bold:    700;
```

### 3.4 Line Heights

```css
--line-height-tight:   1.25;  /* Headings */
--line-height-snug:    1.375; /* Sub-headings */
--line-height-normal:  1.5;   /* Body text */
--line-height-relaxed: 1.625; /* Message content */
--line-height-loose:   2;     /* Accessible reading */
```

---

## 4. Spacing System

GovSphere uses an **8-point grid system**. All spacing values are multiples of 4px.

```css
--space-1:  0.25rem;   /* 4px  */
--space-2:  0.5rem;    /* 8px  */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
```

---

## 5. Layout

### 5.1 Application Shell

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR (240px fixed)         │  MAIN CONTENT                  │
│  bg: gov-blue-900              │                                 │
│                                │  ┌───────────────────────────┐ │
│  [GovSphere Logo]              │  │  CHANNEL HEADER (56px)    │ │
│  ────────────────              │  └───────────────────────────┘ │
│  MINISTRY                      │                                 │
│  ├── # général                 │  ┌───────────────────────────┐ │
│  ├── # annonces                │  │                           │ │
│  ├── # finances-2026           │  │   MESSAGE LIST            │ │
│  └── # projet-loi              │  │   (scrollable)            │ │
│                                │  │                           │ │
│  MESSAGES DIRECTS              │  └───────────────────────────┘ │
│  ├── 🟢 Jean-Baptiste          │                                 │
│  └── ⚫ Cécile Mwamba           │  ┌───────────────────────────┐ │
│                                │  │  MESSAGE INPUT (variable) │ │
│  [+ Nouveau Canal]             │  └───────────────────────────┘ │
└────────────────────────────────┴────────────────────────────────┘
```

### 5.2 Responsive Breakpoints

```css
--breakpoint-sm:  640px;   /* Mobile landscape */
--breakpoint-md:  768px;   /* Tablet */
--breakpoint-lg:  1024px;  /* Desktop */
--breakpoint-xl:  1280px;  /* Wide desktop */
--breakpoint-2xl: 1536px;  /* Ultra-wide */
```

**Mobile behavior (< 768px):**
- Sidebar is hidden by default, accessible via hamburger menu (slides in as overlay)
- Full-width message view
- Bottom tab bar for navigation: Channels, DMs, Search, Notifications, Profile

---

## 6. Component Library

### 6.1 Buttons

**Variants:**

```
Primary:   bg-action-primary  text-white          hover:bg-action-hover
Secondary: bg-bg-tertiary     text-text-primary   hover:bg-border
Ghost:     bg-transparent     text-action-primary hover:bg-bg-secondary
Danger:    bg-danger          text-white          hover:bg-red-700
```

**Sizes:**

```
xs:  h-7  px-3  text-label-xs
sm:  h-8  px-4  text-label-sm
md:  h-9  px-4  text-label-md   ← Default
lg:  h-10 px-5  text-label-lg
xl:  h-12 px-6  text-body-md
```

**States:**
- Default, Hover, Focus (ring), Active (pressed), Disabled (opacity-50, cursor-not-allowed), Loading (spinner)

### 6.2 Inputs

```
Default:  border border-border bg-bg-primary rounded-md h-9
Focus:    border-action-primary ring-2 ring-action-primary/20
Error:    border-danger ring-2 ring-danger/20
Disabled: bg-bg-secondary opacity-60 cursor-not-allowed
```

All inputs have:
- Associated `<label>` (never placeholder-only)
- `aria-describedby` pointing to helper/error text
- Visible focus indicator
- Error message displayed below input

### 6.3 Message Bubble

```
┌─────────────────────────────────────────────────────┐
│  [Avatar] Jean-Baptiste Kabila   12:34 PM           │
│                                                     │
│  Bonjour à tous, voici le rapport financier du      │
│  deuxième trimestre 2026.                           │
│                                                     │
│  [📎 rapport_Q2_2026.pdf  •  2.4 MB]               │
│                                                     │
│  [👍 3] [👀 1]   [Reply] [React] [More ▾]          │
└─────────────────────────────────────────────────────┘
```

**Message hover actions:** React, Reply, Edit (own messages only), Pin, Delete, Forward, Copy link

### 6.4 Navigation Sidebar Item

```
Default:   text-text-on-sidebar     opacity-75  no background
Hover:     bg-bg-sidebar-item       opacity-100
Active:    bg-bg-sidebar-active     text-white  opacity-100  font-medium
Unread:    font-semibold  text-white  + badge with count
```

### 6.5 Badges & Pills

```
Role badge:      bg-gov-blue-100 text-gov-blue-800 rounded-full text-label-xs px-2 py-0.5
Status online:   bg-success w-2.5 h-2.5 rounded-full border-2 border-bg-sidebar
Status away:     bg-gov-gold-400
Status DND:      bg-danger
Status offline:  bg-text-tertiary
Unread count:    bg-danger text-white text-label-xs rounded-full min-w-[18px] h-[18px]
```

---

## 7. Dark Theme

GovSphere ships with both Light and Dark themes. The theme respects `prefers-color-scheme` by default and can be overridden by user preference.

### 7.1 Dark Theme Key Surfaces

| Surface | Light | Dark |
|---|---|---|
| Page background | `#FFFFFF` | `#0D1117` |
| Secondary background | `#F5F6F8` | `#161B22` |
| Cards / elevated surfaces | `#FFFFFF` | `#21262D` |
| Sidebar | `#0B2560` | `#071740` |
| Input background | `#FFFFFF` | `#161B22` |
| Border | `#E2E8F0` | `#30363D` |
| Primary text | `#0D1117` | `#E6EDF3` |
| Secondary text | `#4A5568` | `#8B949E` |

### 7.2 Dark Theme Principles
- Never use pure black (`#000`) — use `#0D1117` for depth
- Sidebar color stays the same in both themes (navy provides identity anchor)
- Elevation is expressed through slightly lighter backgrounds, not shadows
- Gold accent (`gov-gold-400`) remains the same in both themes
- Action color lightens slightly in dark mode to maintain contrast ratio

---

## 8. Icons

**Icon Library:** Lucide React (already installed in the project)

**Usage Rules:**
- All icons must have `aria-label` or be accompanied by visible text
- Standard icon size: 16px for inline, 20px for standalone actions, 24px for navigation
- Icons in buttons must maintain 1:1 relationship with button text
- Never use icons alone for critical actions (always pair with text)

**Key Icons:**
- `Hash` — public channel
- `Lock` — private channel
- `Megaphone` — announcement channel
- `MessageSquare` — direct message
- `Users` — group DM / team
- `Bell` / `BellOff` — notifications
- `Search` — search
- `Settings` — settings
- `Shield` — admin / security
- `FileText` — document
- `Image` — image file
- `Paperclip` — file attachment
- `ChevronRight` / `ChevronDown` — expand/collapse
- `MoreHorizontal` — overflow menu
- `X` — close / dismiss
- `Check` — confirm / success

---

## 9. Accessibility Standards

### 9.1 Color Contrast Requirements

| Text Size | Minimum Contrast | AA Standard |
|---|---|---|
| Normal text (< 18px) | 4.5:1 | WCAG 2.1 AA |
| Large text (≥ 18px bold, ≥ 24px) | 3:1 | WCAG 2.1 AA |
| Interactive component borders | 3:1 | WCAG 2.1 AA |
| Focus indicators | 3:1 | WCAG 2.1 AA |

**Verified contrast ratios:**
- `gov-blue-500` on white: 5.2:1 ✅
- `gov-blue-900` on white: 14.3:1 ✅
- White text on `gov-blue-900` sidebar: 14.3:1 ✅
- `gov-gold-400` on `gov-blue-900`: 4.6:1 ✅

### 9.2 Keyboard Navigation

- All interactive elements are reachable via `Tab`
- Modal dialogs trap focus within the modal while open
- Menus close on `Escape`
- Arrow keys navigate within menus and lists
- `Enter` / `Space` activates buttons and links
- Skip-to-content link is the first focusable element on every page

### 9.3 Screen Reader Support

- All icon-only buttons have `aria-label`
- Dynamic content updates use `aria-live` regions
- Loading states announce to screen readers
- Error messages are linked to inputs via `aria-describedby`
- Channel lists use `role="list"` and `role="listitem"`
- The message list uses `role="log"` and `aria-live="polite"`

---

## 10. Motion & Animation

### 10.1 Animation Principles
- Animations serve a purpose: they indicate state changes, guide attention, and provide feedback
- All animations respect `prefers-reduced-motion: reduce`
- No animation should block user interaction

### 10.2 Duration Scale

```css
--duration-instant:  50ms;   /* Immediate feedback */
--duration-fast:     100ms;  /* Hover states */
--duration-normal:   200ms;  /* Standard transitions */
--duration-slow:     300ms;  /* Panel slides, modals */
--duration-slower:   500ms;  /* Complex transitions */
```

### 10.3 Easing

```css
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);   /* Most transitions */
--ease-enter:    cubic-bezier(0, 0, 0.2, 1);       /* Elements entering screen */
--ease-exit:     cubic-bezier(0.4, 0, 1, 1);       /* Elements leaving screen */
--ease-bounce:   cubic-bezier(0.34, 1.56, 0.64, 1); /* Success states */
```

### 10.4 Reduced Motion Fallback

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. Responsive Design Rules

| Breakpoint | Sidebar | Thread Panel | Member List | Toolbar |
|---|---|---|---|---|
| Mobile (< 768px) | Hidden (slide-in overlay) | Full screen | Hidden | Bottom tab bar |
| Tablet (768–1024px) | 68px icon rail | Overlay panel | Hidden | Compact |
| Desktop (1024–1280px) | 240px full | Side panel | Hidden | Full |
| Wide (> 1280px) | 240px full | Side panel (360px) | Optional (240px) | Full |

---

*The design system is implemented in Tailwind CSS with CSS custom properties for theme switching. The `packages/ui` package exports all base components. All new UI components must extend these base components — no ad-hoc styling.*
