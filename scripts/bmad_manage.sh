#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=1
if [[ "${1:-}" == "--execute" ]]; then
  DRY_RUN=0
fi

echo "BMAD management script (dry-run mode=$DRY_RUN)" 

# Find .bmad-method in workspace
echo "Searching workspace for .bmad-method..."
mapfile -t workspace_paths < <(find . -maxdepth 6 -type d -name ".bmad-method" -print 2>/dev/null || true)

# Find .bmad-method in HOME
echo "Searching home directory for .bmad-method..."
mapfile -t home_paths < <(find "$HOME" -maxdepth 4 -type d -name ".bmad-method" -print 2>/dev/null || true)

all_paths=("${workspace_paths[@]}" "${home_paths[@]}")

if [ ${#all_paths[@]} -eq 0 ]; then
  echo "No .bmad-method directories found in workspace or home."
else
  echo "Found the following .bmad-method directories:"
  for p in "${all_paths[@]}"; do
    echo " - $p"
  done
  echo
  for p in "${all_paths[@]}"; do
    # create a safe backup filename
    safe=$(echo "$p" | tr '/ ' '_' | sed 's/^_//')
    backup_file="bmad-method-backup-${safe}.tar.gz"
    echo "Actions for: $p"
    echo "  Backup command: tar -czf $backup_file -C \"$(dirname "$p")\" \"$(basename "$p")\""
    if [ $DRY_RUN -eq 1 ]; then
      echo "  DRY-RUN: would move $p to ${p}.bak (safer) or remove with rm -rf"
    else
      echo "  Backing up to $backup_file..."
      tar -czf "$backup_file" -C "$(dirname "$p")" "$(basename "$p")"
      echo "  Moving original to ${p}.bak"
      mv "$p" "${p}.bak"
    fi
    echo
  done
fi

# Look for legacy IDE skills (Claude example)
echo "Searching for legacy IDE skill folders in .claude/commands/... and .claude/skills/..."
mapfile -t claude_cmds < <(find . -type d -path "./.claude/commands/*bmad*" -print 2>/dev/null || true)
mapfile -t claude_skills < <(find . -type d -path "./.claude/skills/*bmad*" -print 2>/dev/null || true)
mapfile -t home_claude < <(find "$HOME" -type d -path "$HOME/.claude/commands/*bmad*" -print 2>/dev/null || true)

if [ ${#claude_cmds[@]} -eq 0 ] && [ ${#claude_skills[@]} -eq 0 ] && [ ${#home_claude[@]} -eq 0 ]; then
  echo "No obvious legacy Claude skill folders found in the repo or home."
else
  echo "Potential legacy Claude folders:"
  for c in "${claude_cmds[@]}"; do echo " - $c"; done
  for c in "${claude_skills[@]}"; do echo " - $c"; done
  for c in "${home_claude[@]}"; do echo " - $c"; done
  echo
  for c in "${claude_cmds[@]}" "${claude_skills[@]}" "${home_claude[@]}"; do
    [ -z "$c" ] && continue
    if [ $DRY_RUN -eq 1 ]; then
      echo "  DRY-RUN: would remove $c"
    else
      echo "  Removing $c"
      rm -rf "$c"
    fi
  done
fi

# Summary & reinstall instructions
echo
echo "Summary:"
if [ $DRY_RUN -eq 1 ]; then
  echo "  DRY-RUN mode: no changes made. To perform changes, run with --execute"
else
  echo "  Changes performed: backups created and original folders moved to .bak or removed."
fi

echo
echo "Reinstall commands (requires Node.js 20+):"
echo "  npx bmad-method install"
echo "  Or use next dist-tag: npx bmad-method@next install"
echo "  Or install from repo: npx github:bmad-code-org/BMAD-METHOD install"

echo
if [ $DRY_RUN -eq 1 ]; then
  echo "To run the backup+move+cleanup now, run:"
  echo "  bash $0 --execute"
fi
