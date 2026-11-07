# Implementation Decisions & Notes

## AJSP-5 / AJSP-54: Onboarding Steps 1 & 2 (Resume Upload & Career Preferences)

The following items and fallback states were not explicitly shown in the design artboards (`Resume_Upload.png` and `Career_Preferences.png`) or contain slight design discrepancies. Each has been recorded for designer review:

1. **Step 1: File Selected State**:
   - **Status:** Not in the design, needs designer confirmation.
   - **Implementation:** When a valid PDF or DOCX file is selected, the file name replaces the title in the drop zone, the formatted file size replaces the format note, the button text updates from *"Browse files"* to *"Replace file"*, and the *"Start analysing CV"* button transitions from disabled soft-lime to enabled vibrant lime with glow shadow.

2. **Step 1: Invalid File / Upload Failure States**:
   - **Status:** Not in the design, needs designer confirmation.
   - **Implementation:** Renders an inline error message in `--error` (`#B3261E`, 11 px) under the format line without shifting adjacent layout elements (*"That file type isn't supported. Upload a PDF or DOCX."* or *"That file is larger than 10MB."*).

3. **Step 2: Loading State** (while `getPreferences()` runs):
   - **Status:** Not in the design, needs designer confirmation.
   - **Implementation:** Both cards remain visible; the right card displays neutral `--chip` skeleton placeholder bars with a subtle opacity pulse.

4. **Step 2: Load Failure State**:
   - **Status:** Not in the design, needs designer confirmation.
   - **Implementation:** Replaces the right card content with *"We couldn't load your preferences."* alongside a primary lime *"Try again"* button.

5. **Step 2: Field Validation Errors**:
   - **Status:** Not in the design, needs designer confirmation.
   - **Implementation:** If salary is provided, it must be a positive numeric value; otherwise, a small red error message (*"Please enter a positive number."*) appears beneath the field.

6. **Header Right Inset Inconsistency**:
   - **Status:** Artboard inconsistency, needs designer confirmation.
   - **Implementation:** In the design artboards, the right edge of `Log out` differs across screens (x=1825 on Step 1, x=1834 on Step 2, and x=1822 on Step 3 Profile Review). Configured `--header-right-inset` as 95 px on Step 1, 86 px on Step 2, and 98 px on Step 3 to match the exact design coordinates.

7. **Minimum Match Quality Slider Range**:
   - **Status:** Design calibration decision, needs designer confirmation.
   - **Implementation:** In the design, the thumb for 80% is located at x=1289 (71.3% along the 498 px track). To match this visual position with a native `<input type="range">`, the range was implemented with `min="30"`, `max="100"`, and `value="80"`.

---

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
