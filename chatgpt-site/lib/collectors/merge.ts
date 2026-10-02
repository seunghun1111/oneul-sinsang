type StoredDetails = {
  imageUrl: string | null;
  announcedDate: string | null;
  category: string;
  emoji: string;
  description: string;
  price: number | null;
  retailer: string | null;
};

type IncomingDetails = {
  imageUrl?: string | null;
  announcedDate?: string | null;
  category?: string;
  emoji?: string;
  description?: string;
  price?: number | null;
  retailer?: string | null;
};

export function changesForExisting(existing: StoredDetails, candidate: IncomingDetails) {
  const changes: Partial<StoredDetails> = {};
  if (candidate.imageUrl && existing.imageUrl !== candidate.imageUrl) changes.imageUrl = candidate.imageUrl;
  if (candidate.announcedDate && existing.announcedDate !== candidate.announcedDate) changes.announcedDate = candidate.announcedDate;
  if (candidate.category && existing.category !== candidate.category) changes.category = candidate.category;
  if (candidate.emoji && existing.emoji !== candidate.emoji) changes.emoji = candidate.emoji;
  if (candidate.description && existing.description !== candidate.description) changes.description = candidate.description;
  if (candidate.price != null && existing.price !== candidate.price) changes.price = candidate.price;
  if (candidate.retailer && existing.retailer !== candidate.retailer) changes.retailer = candidate.retailer;
  return changes;
}
