import offerData from "@/data/offers.json";
import type { Offer } from "@/types/offer";

export const offers: Offer[] = offerData as Offer[];
export function offersFor(productId: string) { return offers.filter(offer => offer.productSlug === productId); }
