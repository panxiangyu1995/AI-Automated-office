# Design: Field Action and Datasource Authorization

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Map field-level access into runtime decisions
- Check action-level authorization before writeback or execution
- Restrict unauthorized data source resolution
- Expose authorization outcomes to audit logs

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage