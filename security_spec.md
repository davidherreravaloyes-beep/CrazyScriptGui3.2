# Security Specification for CrazyGuiscripts

## 1. Data Invariants
- A **Script** must be authored by a signed-in user who is either the original author or an admin.
- **Views** and **Likes** on Scripts can only be incremented by the system or restricted logic (automated by admin bot in this app).
- **Executors** can only be managed by admins.
- **User Profiles** are public, but **Private Email** is strictly restricted to the owner.
- **Site Config** is read-only for public, writeable only by admins.
- **Activity** is globally readable but created only by the system/users.
- **Admins** collection is read-only for everyone (to check role) but writeable only by existing admins or initialized by Super Admin.

## 2. The "Dirty Dozen" Payloads (Deny Cases)

### Script Collection
1. **Malicious Script Payload**: Try to create a script with a 2MB code block.
2. **Author Spoofing**: User A trying to create a script with `authorId` of User B.
3. **Ghost Fields**: Adding `isVerified: true` to a script document if it's not in the schema.
4. **Admin Field Escalation**: Non-admin user trying to update `isPremium` field on a script.

### User Collection
5. **PII Leak**: Non-owner trying to read `users/{userId}/private/email`.
6. **Join Date Tampering**: User trying to update their own `createdAt` timestamp.
7. **Identity Theft**: User A trying to update User B's profile.

### Executor Collection
8. **Unauthorized Executor Update**: Non-admin trying to update an executor's `status`.
9. **Fake Executor**: Non-admin trying to create an executor.

### Global / Misc
10. **ID Poisoning**: Trying to create a document with an ID that is 500 characters long or contains invalid characters.
11. **Config Hijacking**: Non-admin trying to change the `brandColor` in `config/site`.
12. **Activity Spam**: Unauthenticated user trying to write to `activity` collection.

## 3. Test Runner (Mock Tests)
- `it('rejects script creation with spoofed authorId')`
- `it('rejects non-admin writing to site config')`
- `it('rejects unauthorized update of executor status')`
- `it('blocks access to private email for other users')`
- `it('rejects scripts with oversized fields')`
