#!/bin/bash
cd /home/kavia/workspace/code-generation/team-ticket-viewer-160515-160524/team_ticket_backend
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

