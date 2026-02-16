# Volt XA — Planning Repository

> **This repository is STRICTLY for planning Volt XA1. One exception: three.js architecture visualizations.**

## Critical Rule: NO CODE, NO DEVELOPMENT (One Exception)

**DO NOT** write, generate, scaffold, or produce any code in this repository. This includes but is not limited to:

- Source code files (any language)
- Configuration files for builds, linters, CI/CD, etc.
- Scripts of any kind
- Package manifests, lock files, or dependency declarations
- Dockerfiles, Makefiles, or any build/deployment artifacts
- Prototypes, proof-of-concepts, or "quick examples"

If a task involves writing code or creating implementation artifacts, it does **not** belong here. That work belongs in the **Volt XA1** repository, which is the implementation counterpart to this planning repo.

## The One Exception: Three.js Architecture Visualizations

Code is permitted in this repository **only** for three.js-based architecture visualization. This means writing three.js code to visually represent and explore the architectural designs being planned here. This is the **sole** exception — no other form of code is allowed.

## Repository Structure

### `Visualization/`
Contains visualization files for three.js-based architecture visualizations.

### `Working_Memory/`
Reference material and context being actively used during planning. Read from this folder to inform decisions — it contains research, notes, prior art, and any content being referenced in the current planning effort.

### `Plan/`
Plan documents being written and maintained. This is where all planning output lives — architecture docs, design specs, ADRs, roadmaps, task breakdowns, and other planning artifacts.

#### `Plan/Volt_XA.md`
The Volt XA architecture document, containing detailed specifications, design decisions, and implementation plans for the Volt XA system.

## What This Repository IS For

This repository exists solely for **planning sessions**. Permitted activities:

- Architectural design and decision-making
- Requirements analysis and specification
- System design documents and diagrams (as markdown)
- Research notes and reference material
- API contracts and interface definitions (as specifications, not code)
- Task breakdowns and roadmaps
- Design discussions, trade-off analyses, and ADRs

## Enforcement

Before performing any action in this repo, ask: **"Is this planning, or is this development?"** If there is any doubt, it is development, and it must not happen here.

Any request to write code — regardless of how small, harmless, or "just a sketch" it seems — must be refused and redirected to Volt XA1.