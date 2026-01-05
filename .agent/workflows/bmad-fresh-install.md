---
description: Perform a fresh BMAD installation
---

# BMAD Fresh Install Workflow

This workflow performs a fresh installation of the BMAD (Build, Measure, Analyze, Deploy) system.

## Prerequisites

- BMAD CLI is installed globally
- You want to reset the BMAD configuration and start fresh

## Steps

1. **Backup current BMAD output** (optional but recommended)
   ```bash
   cp -r /home/dghost/Infin8Content-1/_bmad-output /home/dghost/Infin8Content-1/_bmad-output.backup
   ```

2. **Delete the _bmad/ folder**
   ```bash
   rm -rf /home/dghost/Infin8Content-1/_bmad
   ```

3. **Run BMAD install**
   ```bash
   cd /home/dghost/Infin8Content-1 && bmad install
   ```

4. **Verify installation**
   ```bash
   ls -la /home/dghost/Infin8Content-1/_bmad
   ```

## Success Criteria

- ✅ Old `_bmad/` folder deleted
- ✅ BMAD install completed successfully
- ✅ New `_bmad/` folder created with fresh configuration

## Notes

- This will reset your BMAD configuration
- Your `_bmad-output/` folder (containing sprint status and stories) will NOT be deleted
- Consider backing up important files before proceeding
