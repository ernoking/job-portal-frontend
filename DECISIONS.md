# Implementation Decisions & Notes

## AJSP-5 / AJSP-54: Profile Review Screen (US-04, FR-11, Work Item E3.1)

The following 4 states were not represented in the approved design artboard (`Background.png`) and were implemented minimally according to the specification. Each requires designer confirmation:

1. **Loading State** (while `getProfile()` runs):
   - **Status:** Not in the design, needs designer confirmation.
   - **Implementation:** Retains the application header, back navigation link, and the main card frame. Inside the card, displays `Loading your profile...` with `--chip` neutral grey placeholder bars using a subtle opacity pulse animation.

2. **Parse Error / Load Failure State**:
   - **Status:** Not in the design, needs designer confirmation.
   - **Implementation:** Replaces the main card content with the message *"We couldn't read your CV. Please upload it again."* alongside a primary lime button *"Reupload CV"* that navigates back to `/upload` (per FR-19).

3. **Empty Field Values**:
   - **Status:** Not in the design, needs designer confirmation.
   - **Implementation:** If any personal information or career preference field value is missing or null, displays *"Not provided"* in `--label` color (`#9AA39D`) in italics.

4. **Expanded Accordion Row**:
   - **Status:** Not in the design, needs designer confirmation.
   - **Implementation:** Clicking an experience or education accordion row toggles its expanded state (rotating the chevron 180°). In the expanded state, the row grows downward to display three compact read-only details (`ROLE / DEGREE`, `ORGANIZATION`, and `PERIOD`) styled with the standard label and value typography from the personal information section.
