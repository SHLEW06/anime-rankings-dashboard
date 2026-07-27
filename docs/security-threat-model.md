# Security threat model

Audit date: 2026-07-27.

Status: containment only. The application is not ready for public deployment or shared data.

## Scope and assets

The React client talks directly to Firestore. It reads and writes these paths:

- `anime/{id}` stores titles, cover URLs, ratings keyed by profile name, and attribution fields.
- `people/{name}` stores profile names, colors, plan-to-watch lists, and legacy passcode hashes.
- `osts/{id}` stores soundtrack entries and attribution fields.
- `favorites/{id}` stores selected anime IDs.
- `sceneConfig/main` stores scene selections and image URLs.

The browser, its bundle, local storage, and all client state are untrusted. Firestore Security Rules are the only enforcement boundary in the current architecture. The application does not use Firebase Authentication, verified user IDs, custom claims, or a trusted backend.

## Findings

### Critical: unauthenticated database access

The original `firestore.rules` used a recursive wildcard with `allow read, write: if true`. If those rules are deployed, anyone who learns the Firebase project configuration can read, create, replace, or delete every document. Hiding controls in the interface does not restrict direct Firestore requests.

The local containment rules now deny every read and write. They must be deployed to the verified Firebase project before they protect production data.

### High: record tampering and deletion

Every update sends a complete document with `setDoc`, and deletion calls run from the browser. Open rules let an attacker overwrite ratings, rename or replace profile data, change scene configuration, add abusive content, or delete records without using the interface.

### High: administrator impersonation and bundle extraction

The original client compared an administrator passkey from `VITE_ADMIN_PASSKEY` in browser code. Vite embeds `VITE_` values in the production bundle, so this value could not establish administrator identity. The local source, environment template, and documentation no longer use that variable, and the administrator interface is disabled.

Any administrator passkey previously used in a build must be treated as disclosed. Rotate it after database containment if it was reused or still grants access anywhere else. Do not reveal the old or replacement value during that work.

### High: offline passcode guessing

Profile documents contain legacy PBKDF2 passcode hashes, and the browser downloads the `people` collection before checking a passcode. Open reads would let an attacker copy hashes and guess passcodes offline. The interface accepts passcodes as short as three characters and also supports migration from legacy plaintext values, which increases the risk.

These passcodes are not Firebase identities and cannot authorize Firestore operations. The authentication milestone must migrate away from this design without downloading or transforming production profile data until that work is separately approved.

### High: cross-user access

The application stores a profile name in local storage and relies on React state to decide which controls to show. A user can change local state or call Firestore directly. There is no trusted ownership field tied to a verified identity, so the backend cannot distinguish an owner, another user, or an administrator.

### High: abuse and cost amplification

The client opens live listeners on five Firestore paths. With open rules, an attacker can issue repeated reads and writes, create many documents, and trigger listener traffic. Empty collections also cause the client to seed default records. This can amplify Firestore usage and cost.

## Local containment

`firestore.rules` denies all reads and writes, including authenticated requests and unmatched future collections. `tests/firestore.rules.test.js` verifies document reads, collection reads, creates, updates, and deletes against the known paths and a wildcard fallback.

This ruleset intentionally makes the shared Firestore features unavailable. Milestone 2 must introduce Firebase Authentication, ownership fields, server-verified administrator roles, schema validation, and positive authorization tests before access is restored.

## Approval-gated production actions

The repository does not contain a Firebase project identifier or a public site URL. Public GitHub metadata also lists no homepage or deployment record. A coordinator must first verify the production project and hosting URL without exposing credentials.

After verification, request explicit approval for these actions:

1. Deploy only the tested containment rules:
   `npx firebase deploy --only firestore:rules --project <verified-project-id>`
2. Confirm from an unauthenticated client that reads and writes fail without inspecting private documents.
3. Remove `VITE_ADMIN_PASSKEY` from the hosting build environment and redeploy a bundle that does not contain the old administrator path.
4. Rotate any previously deployed administrator passkey after containment if it was reused or still controls another system.
5. If a vulnerable public site is found, disable hosting or remove its public listing until Milestone 2 passes. Choose the exact hosting action only after the target site is verified.
