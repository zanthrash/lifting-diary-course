---
name: create-docs
description: Create a new documentation file for coding standards
parameters:
  - name: layer
    description: The layer of the application (e.g., "frontend", "backend", "database")
    required: true
  - name: highlight
    description: Specific coding standards to highlight in the documentation
    required: true
---

create a new documentation file at docs/$1.md to highlight the coding standards for this layer of the application, specifically the coding standards needed to
highlight: $2