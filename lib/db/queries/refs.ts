import { db } from "../index";
import { refs, refPropositions, users } from "../schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function getApprovedRefs(limit = 50) {
  const rows = await db.query.refs.findMany({
    where: eq(refs.status, "approved"),
    orderBy: sql`RANDOM()`,
    limit,
    with: {
      propositions: { columns: { text: true } },
      author: { columns: { username: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    question: r.question,
    correctAnswer: r.correctAnswer,
    mediaType: r.mediaType,
    mediaUrl: r.mediaUrl,
    thumbnailUrl: r.thumbnailUrl,
    youtubeUrl: r.youtubeUrl,
    submittedByUsername: r.author?.username ?? null,
    propositions: r.propositions,
  }));
}

export async function getRefWithPropositions(refId: string) {
  const ref = await db.query.refs.findFirst({
    where: eq(refs.id, refId),
    with: {
      propositions: true,
      author: { columns: { username: true } },
    },
  });
  return ref;
}

export async function getOtherApprovedTitles(excludeRefId: string, limit = 20) {
  return db
    .select({ title: refs.title })
    .from(refs)
    .where(and(eq(refs.status, "approved"), sql`${refs.id} != ${excludeRefId}`))
    .orderBy(sql`RANDOM()`)
    .limit(limit);
}

export async function createRef(data: {
  submittedBy: string | null;
  title: string;
  question: string;
  correctAnswer: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  mediaPublicId: string;
  thumbnailUrl?: string;
  youtubeUrl?: string;
  falsePropositions: string[];
}) {
  const [newRef] = await db
    .insert(refs)
    .values({
      submittedBy: data.submittedBy,
      title: data.title,
      question: data.question,
      correctAnswer: data.correctAnswer,
      mediaType: data.mediaType,
      mediaUrl: data.mediaUrl,
      mediaPublicId: data.mediaPublicId,
      thumbnailUrl: data.thumbnailUrl,
      youtubeUrl: data.youtubeUrl,
      status: "pending",
    })
    .returning();

  if (data.falsePropositions.length > 0) {
    await db.insert(refPropositions).values(
      data.falsePropositions.map((text) => ({
        refId: newRef.id,
        text,
      }))
    );
  }

  return newRef;
}

export async function getRefsForAdmin() {
  return db.query.refs.findMany({
    orderBy: desc(refs.createdAt),
    with: {
      propositions: { columns: { text: true } },
    },
  });
}

export async function updateRefStatus(refId: string, status: "approved" | "rejected" | "pending") {
  await db.update(refs).set({ status }).where(eq(refs.id, refId));
}

export async function deleteRef(refId: string) {
  await db.delete(refs).where(eq(refs.id, refId));
}

export async function incrementPlayCount(refId: string) {
  await db
    .update(refs)
    .set({ playCount: sql`${refs.playCount} + 1` })
    .where(eq(refs.id, refId));
}
