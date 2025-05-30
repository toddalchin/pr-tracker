# Cursor Workflow Guidelines

## Core Principles for Focused Development

This document outlines our agreed workflow for AI-assisted development in Cursor, designed to maintain focus and prevent "over-reaching" when solving specific problems.

## 1. Scope Management

- **Explicit Scope Agreement**: At the beginning of each task, we'll clearly define what files will be modified
- **File-by-File Approach**: For multi-file changes, we'll confirm each significant change before moving to the next file
- **Change Documentation**: After implementing changes, I'll provide a clear summary of what was modified

## 2. Focused Problem Solving

- **Minimal Viable Changes**: Implement only the changes needed to solve the specific problem
- **Error Focus**: When fixing errors, focus solely on the error itself rather than surrounding code
- **No Style Changes Without Request**: Layout, styling, or UI components will only be modified when specifically requested

## 3. Communication Protocol

- **Progress Updates**: For complex changes, I'll provide regular progress updates showing what's been changed
- **"Opt-In" Enhancement Suggestions**: If I see improvement opportunities beyond the scope, I'll list them separately for your approval
- **Clear Context Transitions**: Before switching context (e.g., from fixing a bug to improving UX), I'll explicitly request permission

## 4. Error Handling

- **Error Prioritization**: Address the most critical errors first, then move to warnings and optimizations
- **Error Source Analysis**: Always identify the root cause before implementing fixes
- **Solution Alternatives**: When multiple solutions exist, I'll present options with pros/cons for your decision

## 5. When to Intervene

As the developer, consider intervening when:

- The discussion starts drifting from the original problem
- Changes are proposed for files unrelated to the current issue
- Styling or layout changes appear without being requested
- Simple fixes evolve into large refactoring efforts

## Sample Intervention Phrases

- "Let's stay focused on the login issue before addressing the styling"
- "I'd like to approve any changes to the layout components separately"
- "Please pause and explain why these additional changes are necessary"
- "Let's put that enhancement idea in a separate list for later consideration"

---

These guidelines are designed to make our collaboration more efficient by maintaining focus and preventing scope creep. We can update them as our workflow evolves. 