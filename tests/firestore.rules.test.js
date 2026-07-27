import { readFile } from "node:fs/promises";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  assertFails,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

const PROJECT_ID = "demo-anime-watchlist";
const KNOWN_PATHS = [
  "anime/1",
  "people/test-user",
  "osts/test-ost",
  "favorites/1",
  "sceneConfig/main",
];
const ALL_PATHS = [...KNOWN_PATHS, "unexpected/test-document"];

let testEnvironment;

before(async () => {
  const rules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");
  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    await Promise.all(
      ALL_PATHS.map((path) => setDoc(doc(database, path), { synthetic: true })),
    );
  });
});

after(async () => {
  await testEnvironment.cleanup();
});

async function assertDocumentAccessDenied(database, path) {
  await assertFails(getDoc(doc(database, path)));
  await assertFails(setDoc(doc(database, path), { synthetic: "changed" }));
  await assertFails(setDoc(doc(database, `${path}-new`), { synthetic: "created" }));
  await assertFails(deleteDoc(doc(database, path)));
}

describe("deny-by-default Firestore containment", () => {
  test("denies unauthenticated reads, writes, and deletes for every known path", async () => {
    const database = testEnvironment.unauthenticatedContext().firestore();

    for (const path of ALL_PATHS) {
      await assertDocumentAccessDenied(database, path);
    }

    for (const path of ALL_PATHS) {
      await assertFails(getDocs(collection(database, path.split("/")[0])));
    }
  });

  test("denies authenticated reads, writes, and deletes until authorization is rebuilt", async () => {
    const database = testEnvironment.authenticatedContext("synthetic-user").firestore();

    for (const path of ALL_PATHS) {
      await assertDocumentAccessDenied(database, path);
    }
  });
});
