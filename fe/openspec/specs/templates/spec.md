# Templates

Built-in and custom field schemas. Values stay inside item ciphertext.

## Requirements

### Requirement: Template button shows count
The unlocked header MUST show a Template control labeled `Template (N)` where N is the total of built-in plus custom templates, with no extra spaces inside the parentheses.

#### Scenario: Four built-ins
- **WHEN** the user has only the four built-in templates
- **THEN** the button reads `Template (4)`

### Requirement: Built-in templates are not editable
Website, Credit card, PAN card, and Secure note MUST list as Standard. Edit and delete on those rows MUST be disabled. Hover MUST explain they are not allowed.

#### Scenario: Built-in row
- **WHEN** the Template panel lists Standard templates
- **THEN** edit and delete are disabled and hover says not allowed

### Requirement: Custom templates can be added, edited, and deleted
The panel MUST allow adding a custom template with a title and at least one field. Custom templates MUST support edit and delete.

#### Scenario: Add custom
- **WHEN** the user saves a new template with a title and one or more fields
- **THEN** it appears under Your templates and the header count increases

### Requirement: Add secret uses template fields only
When adding a secret, the user MUST pick a template first. The form MUST show only that template’s fields. Field values MUST be encrypted in the browser; the API MUST receive schema metadata and ciphertext, not plaintext values.

#### Scenario: Template-driven fields
- **WHEN** the user selects Website
- **THEN** the add-secret form shows Name, Email, and Password
