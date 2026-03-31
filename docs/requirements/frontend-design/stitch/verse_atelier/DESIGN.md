```markdown
# Design System: The Digital Atelier

## 1. Overview & Creative North Star
The Creative North Star for this system is **"The Focused Curator."** 

This design system moves beyond the standard "SaaS dashboard" aesthetic to create a sanctuary for the written word. It is a "Digital Atelier"—a professional, high-end workspace that balances the rigid organization of a studio with the fluid inspiration of a gallery. We reject the "template" look by utilizing intentional asymmetry, expansive negative space, and a cinematic approach to depth. 

Instead of trapping content in boxes, we allow the typography to breathe. By layering tonal surfaces rather than using hard borders, we create a UI that feels carved from a single block of slate, where the only thing that truly "pops" is the user’s creative spark.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep, nocturnal navies and slate grays (`surface`, `surface_container_low`) to minimize cognitive load, allowing the vibrant indigo (`primary`) to act as a beacon for action and creativity.

### The "No-Line" Rule
To achieve a premium, editorial feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined solely through:
- **Background Color Shifts:** Use `surface_container` variants to differentiate the sidebar from the workspace.
- **Negative Space:** Use the Spacing Scale (specifically `8` to `12`) to create mental dividers.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, physical layers. 
- **The Base:** Use `surface` (#0b1326) for the primary application background.
- **The Workspace:** Use `surface_container_low` (#131b2e) for the main writing area to create a subtle "inset" feel.
- **Interactive Elements:** Use `surface_container_high` (#222a3d) for hovering states or active panels.

### The "Glass & Gradient" Rule
Floating elements (modals, popovers, or navigation bars) should utilize **Glassmorphism**. Apply a semi-transparent version of `surface_bright` with a `backdrop-blur` of 12px. For primary CTAs, use a subtle linear gradient from `primary` (#c0c1ff) to `primary_container` (#8083ff) at a 135° angle to give the UI a "soul" that flat colors lack.

---

## 3. Typography: The Editorial Contrast
We utilize a dual-font strategy to separate "The Tool" from "The Craft."

- **The Utility (Sans-Serif - Inter):** Used for all UI elements, labels, and metadata. It represents the "Workspace Professional" aspect—clean, efficient, and secondary to the art.
- **The Expression (Serif - Newsreader):** Used exclusively for titles and the actual body of the lyrics/creative text. This evokes a literary, "Digital Atelier" feel.

### Typography Scale Highlights:
- **Display-LG (Newsreader, 3.5rem):** Reserved for song titles or chapter headers. It should feel authoritative.
- **Body-LG (Inter, 1rem):** The standard for interface text.
- **Headline-MD (Newsreader, 1.75rem):** Used for the writing canvas. The increased line-height (1.6) is mandatory for readability.
- **Label-SM (Inter, 0.6875rem):** Used for "Working Draft" timestamps or character counts, set in all-caps with a 0.05em letter spacing.

---

## 4. Elevation & Depth
In this system, depth is a functional tool, not a decoration.

### The Layering Principle
Avoid "Drop Shadows" for static elements. Instead, use **Tonal Layering**. Place a `surface_container_lowest` (#060e20) element inside a `surface_container_low` (#131b2e) container to create a "recessed" effect for metadata or secondary tools.

### Ambient Shadows
When a component must float (e.g., a songwriting suggestion tool), use an **Ambient Shadow**:
- **Color:** A 10% opacity version of `on_surface` (#dae2fd).
- **Blur:** 24px - 40px.
- **Spread:** -4px to keep the shadow tucked under the element, mimicking soft studio lighting.

### The "Ghost Border" Fallback
If contrast testing requires a border for accessibility, use the **Ghost Border**: `outline_variant` (#464554) at 20% opacity. Never use 100% opaque lines.

---

## 5. Components

### The "Working Draft" Canvas
The writing area should not look like a form field. 
- **Styling:** No background or border.
- **Typography:** `headline-sm` (Newsreader).
- **Draft State:** When in "Working Draft" mode, the text uses `on_surface_variant` (#c7c4d7). When "Fixed/Finalized," it transitions to `on_background` (#dae2fd) for maximum crispness.

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), `DEFAULT` (8px) rounded corners. Text color: `on_primary`.
- **Secondary:** Transparent background with a `Ghost Border`. Text color: `primary`.
- **Tertiary:** No border or background. Bold `label-md` typography.

### Input Fields (The Studio Input)
- **Base:** `surface_container_highest`. 
- **Focus State:** No thick border. Instead, use a subtle 1px glow using `primary` at 30% opacity and a slight increase in `surface_bright` brightness.

### Cards & Lists
**Strict Rule:** No dividers. 
- Separate list items using a background shift to `surface_container_low` on hover. 
- Use the `Spacing-3` (1rem) value between list items to let the "Digital Atelier" breathe.

### Additional Application Components
- **The Rhyme Drawer:** A glassmorphic side-panel (`surface_bright` with 60% opacity) that slides over the workspace without obscuring it completely.
- **Status Pills:** Small, high-contrast chips using `tertiary` (#ffb783) for "Draft" and `primary` (#c0c1ff) for "Finalized."

---

## 6. Do’s and Don’ts

### Do:
- **Use Asymmetry:** Align song titles to the left but place metadata (BPM, Key) in an asymmetrical floating group to the right to create an editorial layout.
- **Prioritize Whitespace:** If a screen feels cluttered, increase spacing using the `12` (4rem) or `16` (5.5rem) tokens.
- **Embrace Tonal Depth:** Always check if a background color change can solve a hierarchy issue before reaching for a shadow or a line.

### Don’t:
- **Don’t use "Pure Black":** Use `surface` (#0b1326). Pure black feels "dead" and lacks the professional navy undertones of this system.
- **Don’t use Serif for UI:** Never use Newsreader for buttons, menus, or labels. It is for the "Art" only.
- **Don’t use 90-degree corners:** Stick strictly to the `DEFAULT` (8px) or `md` (12px) rounding to maintain the "Modern Minimalist" softness.