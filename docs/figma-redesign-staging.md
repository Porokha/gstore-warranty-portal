# Zezva Figma Redesign Staging

Source file:
https://www.figma.com/design/jLRWPUwbpBi7Bsb8J4qCvf/Zezva--Copy-?node-id=262-2927&p=f&t=lYrL2AI6GvN1lcoD-0

## MCP Access

The ChatGPT/Codex hosted Figma connector currently exposes stale tools in this session, but Figma Desktop Dev Mode MCP works locally at:

`http://127.0.0.1:3845/mcp`

Useful page IDs from the desktop MCP metadata:

- `262:2927` - Cover
- `280:13036` - Getting Started
- `262:2929` - Foundations
- `262:2930` - Components
- `262:2931` - Design - Mobile
- `262:2932` - Design - Web
- `262:2933` - Staff Dashboard
- `262:2935` - Shop Admin
- `262:2936` - Handoff
- `262:2539` - IA / SiteMap & Flows

## Key Web Frames

- `4375:10930` - Desktop home page wrapper
- `4131:57694` - Desktop home page content
- `1425:964` - Trade-in brand step
- `1426:1301` - Trade-in model step with filters
- `1425:1230` - Trade-in storage step
- `2003:14517` - Lead modal form
- `2009:14615` - Cookie bar
- `2009:14639` - Cookie settings modal
- `2014:14704` - Review form modal

## Rollout Plan

1. Add shared redesign tokens/classes in `frontend/src/styles/figma-redesign.css`.
2. Rebuild public layout/header/footer against web/mobile Figma frames.
3. Redesign public home and trade-in flow first because those are the highest-visibility surfaces.
4. Redesign staff dashboard/cases/warranties with existing role and performance constraints preserved.
5. Redesign shop admin after staff shell is stable.
6. Keep all work on `figma-redesign-staging` until reviewed, then merge to live.

## Guardrails

- Do not change API contracts unless required by redesigned interactions.
- Keep Georgian as default language.
- Keep current role restrictions, maintenance mode, SMS/payment flows, and warranty sync behavior intact.
- Commit downloaded Figma assets instead of depending on temporary localhost asset URLs.
