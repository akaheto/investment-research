Read CLAUDE.md and PROJECT_PLAN.md in this directory before doing 
anything else.

These are starter template files — they don't yet describe a specific 
project. Do not scaffold anything, choose a stack, or write any code yet.

Your first step (Epic A, deliverable A1) is to ask me what I want to 
build: the goal, who it's for, and any must-have features or 
constraints I already know about. Wait for my answer.

Once I've described the project:
1. Fill in the Project Summary section of PROJECT_PLAN.md.
2. Recommend a tech stack based on what I described, with brief 
   tradeoffs, and confirm it with me before proceeding (A2).
3. Rewrite Epic B in PROJECT_PLAN.md into real epics/deliverables 
   specific to this project, following the same table format as Epic A.
4. Only then begin work, starting with the rest of Epic A (scaffolding, 
   test runner, linter, doc skeletons including VISUAL_STYLE_GUIDE.docx, 
   baseline check).

This session should run on your strongest available model, since Epic A 
covers foundation decisions (stack, data model, style guide) that are 
expensive to redo later. Once Epic A is done, tell me that's a good 
point to switch to a lighter model for the routine feature work in 
later epics.

From then on, work one deliverable at a time:
- Verify it yourself before calling it done — run tests, run the app,
  check real output. Don't ask me to do a check you're able to do.
- Update every doc it affects (spec, style guide, user guide, README/
  changelog) immediately — before starting the next deliverable, not
  batched later.
- Update its status in PROJECT_PLAN.md (🔲 → 🟡 while working, → ✅ when 
  done and verified)
- Add a line to the Changelog section in PROJECT_PLAN.md
- Log any enhancement ideas that come up in ENHANCEMENTS.docx as soon 
  as they're raised, and move them to "Implemented" once built
- If you catch a mistake or I correct something, log it in CLAUDE.md's 
  Lessons Learned section right away
- If a decision would materially affect the solution (scope, data 
  model, security, cost, anything expensive to undo), stop and confirm 
  with me instead of assuming
- Give me a one-line summary before moving to the next deliverable

Stop and check in with me at the end of each epic before continuing to 
the next.
