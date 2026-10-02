type StoredDetails = {
  imageUrl: string | null;
  announcedDate: string | null;
  category: string;
  emoji: string;
  description: string;
};

type IncomingDetails = {
  imageUrl?: string | null;
  announcedDate?: string | null;
  category?: string;
  emoji?: string;
  description?: string;
};

export function changesForExisting(existing: StoredDetails, candidate: IncomingDetails) {
  const changes: Partial<StoredDetails> = {};
  if (candidate.imageUrl && existing.imageUrl !== candidate.imageUrl) changes.imageUrl = candidate.imageUrl;
  if (candidate.announcedDate && existing.announcedDate !== candidate.announcedDate) changes.announcedDate = candidate.announcedDate;
  if (candidate.category && existing.category !== candidate.category) changes.category = candidate.category;
  if (candidate.emoji && existing.emoji !== candidate.emoji) changes.emoji = candidate.emoji;
  if (candidate.description && existing.description !== candidate.description) changes.description = candidate.description;
  return changes;
}
