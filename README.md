# Synapse Compass

Synapse Compass is a lightweight exploratory interface for Synapse.org that helps users quickly understand where they are, what they're looking at, and whether they can access it—without clicking through multiple pages or getting lost in project hierarchies.

The goal is to reduce cognitive friction when navigating Synapse by surfacing context, orientation, and access signals directly where users need them.

## What problem does this solve?

Users interacting with Synapse frequently encounter friction such as:

- **Losing orientation** in deep or unfamiliar project hierarchies
- **Not knowing** what a dataset, folder, or project is for at a glance
- **Clicking into entities** only to discover they don't have access
- **Needing to jump** between metadata, wikis, and documentation to understand context

Synapse Compass addresses these issues by providing immediate, lightweight context for any Synapse entity.

## Core ideas

Synapse Compass focuses on three tightly scoped capabilities:

### 1. Context & Orientation

- Shows a clear breadcrumb trail for the current entity (project → folder → item)
- Highlights entity type and basic metadata
- Helps answer the question: *"Where am I in Synapse?"*

### 2. Access Awareness

- Indicates whether the current user has access to an entity
- Surfaces access status early to avoid dead-end navigation
- Makes permission boundaries visible rather than surprising

### 3. Scoped Copilot (Optional / Experimental)

A small, purpose-built "Copilot" panel with predefined actions, such as:

- Explain this page
- What's typically next from here?
- Who maintains this?
- How do I get access?

Answers are generated only from the current entity's visible metadata and documentation, avoiding a generic or open-ended chatbot experience.

## Getting Started

This project is just getting started. More information will be added as development progresses.

## Development

Coming soon...

## License

TBD
