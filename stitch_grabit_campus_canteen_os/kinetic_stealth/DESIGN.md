---
name: Kinetic Stealth
colors:
  surface: '#12131a'
  surface-dim: '#12131a'
  surface-bright: '#383940'
  surface-container-lowest: '#0c0e14'
  surface-container-low: '#1a1b22'
  surface-container: '#1e1f26'
  surface-container-high: '#282a31'
  surface-container-highest: '#33343c'
  on-surface: '#e2e1eb'
  on-surface-variant: '#e2bfb0'
  inverse-surface: '#e2e1eb'
  inverse-on-surface: '#2f3037'
  outline: '#a98a7c'
  outline-variant: '#594136'
  surface-tint: '#ffb692'
  primary: '#ffb692'
  on-primary: '#562000'
  primary-container: '#ff6d00'
  on-primary-container: '#582100'
  inverse-primary: '#9f4200'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#c8c6c5'
  on-tertiary: '#303030'
  tertiary-container: '#9b9999'
  on-tertiary-container: '#323131'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcb'
  primary-fixed-dim: '#ffb692'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1b1c'
  on-tertiary-fixed-variant: '#474746'
  background: '#12131a'
  on-background: '#e2e1eb'
  surface-variant: '#33343c'
typography:
  headline-xl:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Sora
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Sora
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style

The design system is built around the "Classroom Stealth" narrative—a high-energy, dark-mode-first aesthetic tailored for the fast-paced Gen-Z campus environment. The personality is confident, urgent, and efficient. 

The visual style utilizes a **Modern-Geometric** approach with subtle **High-Contrast** influences. It prioritizes rapid information processing through deep backgrounds and vibrant "Safety Orange" focal points. Borrowing from the motion-inspired geometry of the logo, the interface uses rounded corners and purposeful whitespace to maintain a clean, athletic feel that differentiates it from standard, sterile food delivery apps.

## Colors

The palette is optimized for high-performance viewing in low-light environments (lecture halls/libraries). 

- **Primary (Safety Orange):** Reserved exclusively for high-priority CTAs, active states, and brand iconography. It represents speed and hunger satisfaction.
- **Background (Deep Gunmetal):** Provides the "stealth" foundation, ensuring the UI recedes into the device frame.
- **Surface (Elevated Grey):** Used for card containers and interactive components to provide depth against the background.
- **Text:** Headings utilize Mist White for maximum legibility, while body text uses Ash Grey to reduce eye strain and establish clear visual hierarchy.

## Typography

This design system uses a dual-font strategy to balance impact with modern readability.

- **Montserrat (Headings):** Used for brand-heavy moments. The ExtraBold and Bold weights provide the "Kinetic" energy required for the campus vibe. Tight letter spacing on larger headlines mimics the speed-lines in the brand logo.
- **Sora (Body & Labels):** A geometric sans-serif that complements the logo's rounded terminals. It is exceptionally legible at small sizes, making it perfect for ingredient lists, prices, and status updates. Use "Medium" weight for sub-headings and "Regular" for long-form content.

## Layout & Spacing

The system follows a strict **4px baseline grid** to maintain mathematical harmony.

- **Fluid Mobile-First Grid:** The layout uses a 4-column grid for mobile and a 12-column grid for tablet/desktop. 
- **Margins:** Mobile uses 20px side margins to ensure touch targets for "one-handed" campus use (walking between classes).
- **Rhythm:** Use `md` (16px) for standard internal padding in cards and `lg` (24px) to separate distinct content sections. Large vertical gaps (`xl`) are used to create the "Minimalist" breathing room.

## Elevation & Depth

In a dark-mode-first environment, depth is communicated through **Tonal Layering** rather than heavy shadows.

- **Level 0 (Background):** Deep Gunmetal (#121212).
- **Level 1 (Cards/Inputs):** Elevated Grey (#1E1E1E) with a subtle 1px border (#27272A) to define edges.
- **Level 2 (Floating/Overlays):** Surface-alt (#27272A) with a very soft, diffused black shadow (0px 8px 24px rgba(0,0,0,0.5)).
- **Interactions:** When a card is pressed, it should scale slightly (98%) rather than increasing shadow, maintaining the tactile, responsive feel.

## Shapes

The shape language is directly derived from the circular "G" and the rounded terminals of the logo.

- **Standard Radius:** 8px (`rounded-md`) for buttons and small input fields.
- **Large Radius:** 16px (`rounded-lg`) for product cards and modal containers.
- **Iconography:** Use a consistent 2px stroke weight with rounded caps to match the typography's geometric nature.
- **Buttons:** Primary CTAs can occasionally use the "Pill" shape (32px+) to emphasize the "Grab" action.

## Components

### Buttons
- **Primary:** Background Safety Orange, Text Mist White (ExtraBold). High-impact, full-width on mobile.
- **Secondary:** Outlined Mist White or Elevated Grey surface. Used for "Cancel" or "Add More."

### Cards (Food Items)
- Use Elevated Grey background. 
- Food imagery should fill the top half of the card with a subtle gradient overlay at the bottom to ensure price/name legibility.
- Implement a "Quick Add" (+) button in the bottom right corner using the Primary color.

### Input Fields
- Dark grey background (#1E1E1E) with a subtle bottom-only border or full border that turns Safety Orange on focus. 
- Placeholder text in Ash Grey.

### Chips (Categories)
- Pill-shaped. Unselected: Elevated Grey with Ash Grey text. Selected: Safety Orange with White text.

### Stealth Navigation
- A bottom navigation bar with a glassmorphic background blur (backdrop-filter: blur(10px)) to allow the dark background colors to bleed through slightly.