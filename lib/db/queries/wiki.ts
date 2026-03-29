import { db } from "../index";
import { refs, refWikiPages, refWikiRevisions } from "../schema";
import { eq, ilike, and, desc } from "drizzle-orm";

export async function getAllApprovedRefs(search?: string) {
  return db
    .select({
      id: refs.id,
      title: refs.title,
      question: refs.question,
      mediaType: refs.mediaType,
      mediaUrl: refs.mediaUrl,
      thumbnailUrl: refs.thumbnailUrl,
      playCount: refs.playCount,
    })
    .from(refs)
    .where(
      search
        ? and(eq(refs.status, "approved"), ilike(refs.title, `%${search}%`))
        : eq(refs.status, "approved")
    )
    .orderBy(desc(refs.playCount));
}

export async function getRefWikiPage(refId: string) {
  const ref = await db.query.refs.findFirst({
    where: eq(refs.id, refId),
    with: {
      propositions: { columns: { text: true } },
      wikiPage: true,
    },
  });
  return ref ?? null;
}

export async function upsertWikiPage(refId: string, content: string, summary: string) {
  // Check if page exists
  const existing = await db.query.refWikiPages.findFirst({
    where: eq(refWikiPages.refId, refId),
  });

  let pageId: string;

  if (existing) {
    await db
      .update(refWikiPages)
      .set({ content, updatedAt: new Date() })
      .where(eq(refWikiPages.refId, refId));
    pageId = existing.id;
  } else {
    const [created] = await db
      .insert(refWikiPages)
      .values({ refId, content })
      .returning();
    pageId = created.id;
  }

  // Save revision
  await db.insert(refWikiRevisions).values({
    wikiPageId: pageId,
    content,
    editSummary: summary || "Modification",
  });
}

export async function getWikiRevisions(refId: string) {
  const page = await db.query.refWikiPages.findFirst({
    where: eq(refWikiPages.refId, refId),
    with: {
      revisions: {
        orderBy: desc(refWikiRevisions.createdAt),
        limit: 20,
      },
    },
  });
  return page?.revisions ?? [];
}
