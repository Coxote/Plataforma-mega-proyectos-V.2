# Security Specification - Operations Atelier SaaS

## 1. Data Invariants
1. **Projects**: Only authenticated users with legitimate roles (`coordinador`, `director_financiero`, `supervisor`) can create, update, or delete projects. Clients (`invitado`) and Vendors (`proveedor`) can only read projects to which they are explicitly assigned (`p.id == user.projectId` or in `p.members`).
2. **Users**: User profiles are isolated. Self-service updates cannot alter `role` without coordinator authorization.
3. **Clients**: Commercial directory records are restricted to internal direction roles (`coordinador`, `director_financiero`, `supervisor`).
4. **Planner Tasks**: Can only be created and assigned by team coordinators; assignees can update task state.

## 2. The Dirty Dozen Payloads (Targeting Vulnerabilities)
1. **Unauthenticated Project Read**: Anonymous request to `/projects/p-1` -> DENIED.
2. **Vendor Modifying Project Budget**: `proveedor` sending write to `/projects/p-1/budget` -> DENIED.
3. **Client Reading Another Project**: `invitado` assigned to `p-1` requesting `/projects/p-2` -> DENIED.
4. **ID Poisoning / Oversized Path**: Submitting a document ID exceeding 128 chars or with illegal characters -> DENIED.
5. **Privilege Escalation in Profile**: Authenticated user updating their own profile document with `{ role: "coordinador" }` -> DENIED.
6. **Shadow Update with Ghost Field**: Write to project with undeclared system backdoor field -> DENIED.
7. **Client Overwriting Contract Total**: `invitado` modifying `totalIncome` or `hoursTotal` -> DENIED.
8. **Unauthenticated Task Deletion**: Anonymous delete on `/plannerTasks/t-1` -> DENIED.
9. **Blanket Collection Scrape**: User requesting collection listing without valid relational scope -> DENIED.
10. **Corrupted Type in Deliverables**: Submitting string where deliverable number is required -> DENIED.
11. **Negative Sold Hours Injection**: Injection of negative numbers into sold role hours -> DENIED.
12. **Immutability Breach**: Updating project `id` or `createdAt` to different values -> DENIED.
