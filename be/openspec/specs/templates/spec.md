# Templates

Field schemas only. No secret values on the server.

## Requirements

### Requirement: Built-ins on first list
`GET /api/templates` MUST ensure Website, Credit card, PAN card, and Secure note exist for the user (`schema.builtIn` true) and MUST return built-ins before custom, then by name.

#### Scenario: New user
- **WHEN** a newly registered user lists templates
- **THEN** the four standard templates are present

### Requirement: Custom create, update, delete
`POST /api/templates` MUST create a non-built-in template. Patch and delete MUST reject built-in templates. Schema JSON MUST hold labels/types only.

#### Scenario: Delete built-in
- **WHEN** the client tries to delete a built-in template
- **THEN** the request is forbidden

#### Scenario: Custom delete
- **WHEN** the owner deletes a custom template
- **THEN** the template is removed
