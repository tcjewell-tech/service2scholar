---
name: Service to Scholar
description: A calm, factual planning app that takes a service member from job code to degree to out-of-pocket cost.
colors:
  dress-blue: "#1F3A5F"
  on-dress-blue: "#FFFFFF"
  brass-button: "#B8892B"
  parchment: "#F6F5F1"
  white-sheet: "#FFFFFF"
  blotter: "#E6EAF0"
  ink: "#14202E"
  slate: "#5B6573"
  khaki-rule: "#DEDAD0"
  ribbon-green: "#2F7D4F"
  caution-amber: "#9A6A00"
  signal-red: "#B23A3A"
  night-watch: "#0E141B"
  night-sheet: "#18212B"
  night-blotter: "#243142"
  night-ink: "#EEF1F5"
  night-slate: "#9AA6B4"
  night-rule: "#2A3644"
  sky-blue: "#8FB3E0"
  on-sky-blue: "#0E141B"
  polished-brass: "#E0B85A"
  night-green: "#6CC08F"
  night-amber: "#E2B341"
  night-red: "#EF7C7C"
typography:
  headline:
    fontFamily: "system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: "32px"
  title:
    fontFamily: "system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "24px"
  label:
    fontFamily: "system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
  label-bold:
    fontFamily: "system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: "20px"
  section-label:
    fontFamily: "system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: "20px"
    letterSpacing: "0.8px"
  tag:
    fontFamily: "system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
rounded:
  bar: "2px"
  tag: "6px"
  notice: "8px"
  input: "10px"
  button: "12px"
  card: "14px"
  pill: "999px"
spacing:
  half: "2px"
  one: "4px"
  two: "8px"
  three: "16px"
  four: "24px"
  five: "32px"
  six: "64px"
components:
  button-primary:
    backgroundColor: "{colors.dress-blue}"
    textColor: "{colors.on-dress-blue}"
    rounded: "{rounded.button}"
    padding: "0 24px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.blotter}"
    textColor: "{colors.dress-blue}"
    rounded: "{rounded.button}"
    padding: "0 24px"
    height: "48px"
  button-ghost:
    textColor: "{colors.dress-blue}"
    rounded: "{rounded.button}"
    padding: "0 8px"
    height: "48px"
  button-danger:
    textColor: "{colors.signal-red}"
    rounded: "{rounded.button}"
    padding: "0 8px"
    height: "48px"
  chip:
    backgroundColor: "{colors.white-sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  chip-selected:
    backgroundColor: "{colors.dress-blue}"
    textColor: "{colors.on-dress-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  card:
    backgroundColor: "{colors.white-sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  choice:
    backgroundColor: "{colors.white-sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
    height: "56px"
  choice-selected:
    backgroundColor: "{colors.blotter}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
    height: "56px"
  input:
    backgroundColor: "{colors.white-sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.input}"
    padding: "12px 16px"
  notice:
    backgroundColor: "{colors.white-sheet}"
    textColor: "{colors.slate}"
    typography: "{typography.label}"
    rounded: "{rounded.notice}"
    padding: "16px"
  tag:
    backgroundColor: "{colors.blotter}"
    textColor: "{colors.ink}"
    typography: "{typography.tag}"
    rounded: "{rounded.tag}"
    padding: "2px 8px"
---

# Design System: Service to Scholar

## Overview

**Creative North Star: "The Briefing Folder"**

The app looks like a well-prepared transition packet: everything the reader needs, in order, with nothing decorative. Each screen is a stack of plain sheets on a parchment desk. A sheet holds one subject (a school, a cost breakdown, a group of settings) and states its facts without flourish. The reader is making a decision that involves money and deadlines, so the interface stays calm and lets the figures speak.

Controls are steady and plain: solid, generously sized, easy to hit with a thumb. Colour is used sparingly. Dress Blue marks what can be pressed and what is selected; one green marks money that comes back to the reader; Brass Button appears once, for a saved program. Everything else is ink on paper.

The system ships in two matching sets, a light one and a dark one, and follows the device setting. The dark set is the same folder read at night: blue-black surfaces, pale ink, and a lighter Sky Blue in place of Dress Blue.

**Key Characteristics:**
- Flat sheets separated by hairline rules; no shadows anywhere.
- One action colour, used for both "press this" and "this is selected".
- System typeface on every platform, in two weights.
- A single centred column, capped at 800px, with 16px between sheets.
- Light and dark sets with the same roles, chosen by the device.

## Colors

A navy-and-brass palette on warm paper: restrained, legible, and not tied to any single branch.

### Primary
- **Dress Blue** (`dress-blue`): the action colour. Fills primary buttons and selected chips, outlines a selected choice row, colours ghost-button text, the active tab, the progress bar, and the left edge of an information notice. In the dark set its role is taken by **Sky Blue** (`sky-blue`), with **Night Watch** text on top.

### Secondary
- **Brass Button** (`brass-button`): a single mark of distinction. Today it colours only the "★ In plan" label on a saved program. **Polished Brass** (`polished-brass`) in the dark set.

### Tertiary
- **Ribbon Green** (`ribbon-green`): money in the reader's favour (a $0 tuition figure, a "Left over / yr" amount) and a completed checklist item. **Night Green** in the dark set.
- **Caution Amber** (`caution-amber`): the left edge of a warning notice. **Night Amber** in the dark set.
- **Signal Red** (`signal-red`): destructive button text, a field in error, an overdue checklist item. **Night Red** in the dark set.

### Neutral
- **Parchment** (`parchment`): the screen background, the desk the sheets sit on. **Night Watch** in the dark set.
- **White Sheet** (`white-sheet`): cards, chips, choice rows, inputs, notices and the tab bar. **Night Sheet** in the dark set.
- **Blotter** (`blotter`): the selected or secondary surface: secondary buttons, a selected choice row, tags, and the unfilled part of the progress bar. **Night Blotter** in the dark set.
- **Ink** (`ink`): all primary text. **Night Ink** in the dark set.
- **Slate** (`slate`): secondary text, placeholders, section labels and inactive tabs. **Night Slate** in the dark set.
- **Khaki Rule** (`khaki-rule`): every hairline border and divider. **Night Rule** in the dark set.

### Named Rules
**The One Action Colour Rule.** Dress Blue means "you can press this" or "this is selected", and nothing else. It is never used for decoration or for emphasis in running text.

**The Earned Green Rule.** Ribbon Green appears only where the reader comes out ahead or has finished something. A neutral figure stays in Ink.

**The Paired Sets Rule.** Every colour has a light and a dark value with the same role. A new colour is added to both sets or to neither.

## Typography

**Display Font:** the platform system font (San Francisco on iOS, Roboto on Android, the system UI font on web)
**Body Font:** the same
**Label/Mono Font:** none in use

**Character:** native and unbranded. The type is whatever the reader's phone already uses, so the app reads like part of the device and the numbers carry the emphasis.

### Hierarchy
- **Headline** (700, 26px, 32px line): the question or title at the top of an onboarding step.
- **Title** (700, 17 to 18px): the profile name, the degree field on a match card, and the three cost figures on that card.
- **Body** (500, 16px, 24px line): default text, choice titles, and button labels (button labels are 700).
- **Label** (500 or 700, 14px, 20px line): secondary lines, chip text, field labels, hints and notices.
- **Section label** (700, 12px, 0.8px letter spacing, uppercase): the heading above a group of cards, in Slate.
- **Tag** (500, 12px, 16px line): the small facts under a match, such as "Yellow Ribbon" or "Public".

### Named Rules
**The Two Weights Rule.** Text is medium (500) or bold (700). Bold marks a name, a figure, or a label; it is not used for emphasis inside a sentence.

**The Figures Lead Rule.** On a card that shows money, the amount is the largest and heaviest thing on it, with its caption above in Slate at label size.

## Layout

A single scrolling column. Content sits in a centred container no wider than 800px, with 16px side padding, 16px above the first sheet, and 64px of clear space at the end so the last item scrolls free of the tab bar. Sheets and other blocks are 16px apart; items inside a sheet are 8px apart.

Spacing comes from one scale: 2, 4, 8, 16, 24, 32, 64. Related chips and tags wrap in rows with 8px gaps. Onboarding steps add a fixed footer, separated by a hairline rule, holding "Back" and "Continue" side by side at equal width.

There are no breakpoints. On a wide screen the column stays centred at its cap and the margins grow.

## Elevation & Depth

Flat. There are no shadows in the system. Depth comes from two tones and a line: White Sheet surfaces sit on the Parchment background and are outlined with a hairline Khaki Rule. The navigation header has its shadow switched off and takes the background colour, so it reads as part of the page.

### Named Rules
**The Flat Sheet Rule.** A surface is distinguished by its tone and a hairline border, never by a shadow or a blur.

## Shapes

Softly rounded rectangles, with the radius growing with the size of the thing: a 2px progress bar, 6px tags, 8px notices, 10px inputs, 12px buttons, 14px cards and choice rows. Chips are full pills. Borders are hairlines on cards and dividers, 1px on chips and inputs, and 1.5px on choice rows, where the border is what signals selection. The only circle is the 22px radio mark on a choice row.

## Components

Steady and plain: solid, generously sized, no flourishes.

### Buttons
- **Shape:** rounded rectangle (12px radius), at least 48px tall, 24px side padding, label in 16px bold.
- **Primary:** Dress Blue fill with white text. One per screen or footer; it grows to fill the available width.
- **Secondary:** Blotter fill with Dress Blue text. Used for "Back" beside a primary button.
- **Ghost:** no fill, Dress Blue text, 8px side padding, sized to its label. Used for outbound links, which end in "↗".
- **Danger:** as ghost, with Signal Red text. Used for "Delete all data on this device".
- **States:** pressed dims to 80% opacity; disabled sits at 40%.

### Chips
- **Style:** full pill, White Sheet fill, 1px Khaki Rule border, Ink text at label size, 16px by 6px padding.
- **Selected:** Dress Blue fill and border with white text.
- **Use:** sorting and filtering on Matches, picking options in Settings, switching profiles. Pressed dims to 80%.

### Cards
- **Corner Style:** 14px radius.
- **Background:** White Sheet on Parchment.
- **Shadow Strategy:** none; see Elevation & Depth.
- **Border:** hairline Khaki Rule.
- **Internal Padding:** 16px, with 8px between children.

### Choice rows
- **Style:** a full-width row at least 56px tall, 14px radius, 16px padding, with an optional image on the left (a branch seal), a bold title, an optional Slate subtitle, and a radio mark on the right.
- **Selected:** Blotter fill, 1.5px Dress Blue border, and a filled Dress Blue dot in the radio mark.
- **Use:** single-choice questions in onboarding.

### Inputs
- **Style:** White Sheet fill, 1px Khaki Rule border, 10px radius, 16px text, with a bold label above and a Slate hint below. Multi-line fields start at 110px tall.
- **Error:** the border turns Signal Red and the hint is replaced by the error message in Signal Red.

### Notices
- **Style:** White Sheet fill, 8px radius, 16px padding, Slate text at label size, with a 3px left edge in Dress Blue for information or Caution Amber for a warning.
- **Use:** stating where figures come from and which are still sample data.

### Navigation
- **Tab bar:** four tabs with outline icons (Matches, Plan, Profiles, Settings) on a White Sheet bar with a Khaki Rule top border. The active tab is Dress Blue; the others are Slate.
- **Header:** Parchment background, no shadow, bold Ink title.

### Progress bar
A row of equal segments, 4px tall with 4px gaps, one per onboarding step. Completed steps are Dress Blue; the rest are Blotter.

### Match card (signature)
A card that opens the program's cost breakdown when pressed. From top to bottom: the school and its location in Slate, the degree field as the title, three figures in a row ("You pay (tuition)", "Paid to you", and "Net cost / yr" or "Left over / yr"), a row of tags, and a one-line "Why:" reason. A $0 tuition figure and a left-over amount are Ribbon Green. A saved program shows "★ In plan" in Brass Button at the top right.

### Profile header
The branch seal at 44px beside the profile name in title weight and a one-line Slate summary of branch, job code, GI Bill level and degree level. With more than one profile, a row of chips beneath switches between them.

## Do's and Don'ts

### Do:
- **Do** take every colour from the theme, so the light and dark sets stay paired.
- **Do** use Dress Blue only for things that can be pressed or are selected.
- **Do** keep touch targets at least 48px tall.
- **Do** separate surfaces with White Sheet on Parchment and a hairline Khaki Rule.
- **Do** make the money figure the heaviest thing on any card that shows one.
- **Do** build new screens from the shared components in `src/components/ui.tsx` before adding a new one.

### Don't:
- **Don't** add shadows, blurs or gradients.
- **Don't** use Ribbon Green for anything except money in the reader's favour or a completed item.
- **Don't** introduce a third font weight or a custom typeface.
- **Don't** use a branch's own colours for interface elements; the app serves all six branches and the seals already carry branch identity.
- **Don't** write a colour value directly into a screen.
