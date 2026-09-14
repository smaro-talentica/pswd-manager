# Appearance

Light and dark surfaces. Preference is not a vault secret.

## Requirements

### Requirement: Light and dark token maps
The document MUST define light tokens on `:root` and dark tokens on `.dark`. Surfaces MUST use semantic utilities (`bg-background`, `text-foreground`, `border-border`, `bg-success`, and so on). UI in `src/` MUST NOT use hex color literals.

#### Scenario: Dark class
- **WHEN** `html` has class `dark`
- **THEN** page chrome uses the dark token map

### Requirement: Toggle on main screens
Login, signup, authenticator-code, vault unlock, and unlocked vault MUST offer a sun/moon control that switches light and dark.

#### Scenario: Switch to dark
- **WHEN** the user activates the control while in light mode
- **THEN** the UI uses the dark token map

### Requirement: Remember appearance only
The chosen light or dark value MAY be stored under `pm-appearance`. That store MUST NOT hold tokens, vault keys, or passwords. First visit without a stored choice MUST follow `prefers-color-scheme`.

#### Scenario: Reload keeps theme
- **WHEN** the user chose dark and reloads
- **THEN** the document starts in dark mode without a flash of the wrong theme when the boot script runs
