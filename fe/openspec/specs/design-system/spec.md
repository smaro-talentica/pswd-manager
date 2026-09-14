# Design system

Semantic color tokens, type on screens via Tailwind, shadcn Button, inline SVGs.

## Requirements

### Requirement: Semantic tokens, no hex in `src/`
UI under `fe/src` MUST use named tokens (`background`, `foreground`, `primary`, `destructive`, `success`, `muted`, `border`, `input`, tag colors). JSX MUST NOT contain hex color literals.

#### Scenario: Success on 2FA
- **WHEN** 2FA is on
- **THEN** the outlined button uses `border-success` and `text-success`

### Requirement: Light and dark maps
`:root` MUST define the light map. `.dark` MUST define the dark map. `color-scheme` MUST match the active map so native controls follow.

#### Scenario: Dark inputs
- **WHEN** dark mode is on
- **THEN** inputs use dark `background` / `input` tokens

### Requirement: Button primitive
Interactive chrome MUST use `src/components/ui/button.tsx`. Header actions that are not primary (Template, Log out, 2FA, theme) MUST use the outline variant unless a spec sets a color override.

#### Scenario: Header actions
- **WHEN** the unlocked vault header is shown
- **THEN** Template, 2FA, theme, and Log out are outline buttons

### Requirement: One React component per folder
A folder MUST contain at most one React component. Page-only children live under `pages/<Page>/<Child>/`.

#### Scenario: Password strength
- **WHEN** signup shows strength
- **THEN** it is `pages/SignUp/PasswordStrength`, not inlined as a second component in `SignUp/index.tsx`
