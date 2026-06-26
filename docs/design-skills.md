# Project Design Skills

Installation date: 2026-06-26

These skills are installed for Codex design and development work only. They are not part of the Jekyll runtime, are not imported by the site, and do not require changes to Gemfile, Jekyll plugins, or production dependencies.

## claude-design

- Purpose: Turn a selected design direction into a high-fidelity HTML/design implementation with an explicit visual system and browser verification.
- Source: `https://github.com/jiji262/claude-design-skill`
- Upstream commit: `f1ac87c3decb175d99a269f23ca84860786a598b`
- Preferred install command:
  ```bash
  npx skills add jiji262/claude-design-skill --skill claude-design --agent codex -y
  ```
- Actual project install path: `.agents/skills/claude-design/`
- Actual install method: Manual project-level install, because `node`, `npm`, and `npx` were not available on PATH in this environment.
- Installed files: `SKILL.md`, `assets/`, `references/`, `Claude-Design-Sys-Prompt.txt`
- Executable or script-like files: `assets/animations.jsx` is present as a reference asset and was not executed.
- Update: Re-run the preferred install command from the repository root when Node/npm/npx are available, or manually refresh `.agents/skills/claude-design/` from the upstream repository.
- Uninstall: Remove `.agents/skills/claude-design/`.

## sketch

- Purpose: Generate disposable HTML design variants before production implementation.
- Source: `https://github.com/NousResearch/hermes-agent`
- Upstream commit: `a4091e49f10ddceaac1a902848aabfb1b9aae210`
- Preferred install command:
  ```bash
  npx skills add NousResearch/hermes-agent --skill sketch --agent codex -y
  ```
- Actual project install path: `.agents/skills/sketch/`
- Actual install method: Manual project-level install from `https://raw.githubusercontent.com/NousResearch/hermes-agent/main/skills/creative/sketch/SKILL.md`, because `node`, `npm`, and `npx` were not available on PATH in this environment.
- Installed files: `SKILL.md`
- Executable or script-like files: None found.
- Update: Re-run the preferred install command from the repository root when Node/npm/npx are available, or manually replace `.agents/skills/sketch/SKILL.md` with the upstream file.
- Uninstall: Remove `.agents/skills/sketch/`.

## Environment Checks

```text
node --version       -> not available on PATH
npm --version        -> not available on PATH
npx skills --version -> not available on PATH
```

Project-level skill files found:

```text
.agents/skills/claude-design/SKILL.md
.agents/skills/sketch/SKILL.md
```
