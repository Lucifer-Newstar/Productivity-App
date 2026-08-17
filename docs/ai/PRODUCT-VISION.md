# Product vision and boundaries

## Objective

> Kaizen is not an application containing an AI. Kaizen is a personal operating system with an independent intelligence layer.

The engine should eventually answer:

> Given everything I am trying to accomplish, everything that has happened, and the constraints I currently face, what is the wisest next move?

## Authority model

**LOCKED DECISION**

```text
Kaizen code  = source of truth
AI           = reasoning, interpretation and planning
Tools        = controlled interaction with Kaizen
User         = final authority over changes
```

Initial permissions:

| Permission | Initial state |
|---|---|
| READ | Allowed through approved tools |
| ANALYZE | Allowed |
| SUGGEST | Allowed |
| ACT | Requires explicit approval; unavailable before v0.4 |
| AUTOMATE | Disabled |

## In scope

- Grounded daily and weekly intelligence
- Relevant-context selection across Core, Forge, Career, Workout, Health and Afterglow
- Read-only typed tools
- Local generation, local retrieval and inspectable memory
- Bounded tool-using reasoning
- Evidence, confidence, uncertainty and freshness
- Later, reviewable action proposals and approved execution
- Career–Forge evidence transformation
- Feedback and outcome-based personalization after safety foundations exist

## Out of scope at the architecture gate

- Runtime AI implementation
- A generic chatbot clone
- Autonomous mutation
- Background automation
- Fine-tuning or LoRA
- A permanent model choice
- A permanent vector database choice
- Replacing deterministic analytics
- Medical diagnosis
- Migrating browser state to a new authoritative database

## Product principles

1. Remain useful when AI is unavailable.
2. Prefer a grounded narrow answer to a broad speculative one.
3. Use the minimum necessary context.
4. Link conclusions to current records and deterministic analytics.
5. Separate facts, inference, assumptions and suggested wording.
6. Make privacy and memory visible to the user.
7. Add intelligence where cross-domain interpretation has real value; do not label every card “AI-powered.”
8. Earn action permissions through reliable read-only behavior first.

## First vertical slice

**LOCKED DECISION**

```text
“What should I focus on?”
        ↓
get_today()
        ↓
current browser-owned state + deterministic Next Action
        ↓
local model interpretation
        ↓
validated, source-linked response
```

This is not a free-form chatbot milestone. It proves the complete boundary with one useful question.

## V1.0 outcome

V1.0 is reached when “What should I do today?” can retrieve relevant current state and memories, analyze constraints, explain priorities, produce a structured plan, propose changes, obtain approval, execute and verify selected changes, record the interaction, and incorporate explicit feedback—all locally by default.