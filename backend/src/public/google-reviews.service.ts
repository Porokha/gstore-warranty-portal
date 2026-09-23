import { BadGatewayException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { Agent } from 'https';

interface PlacesReview {
  name?: string;
  text?: { text?: string; languageCode?: string };
  rating?: number;
  publishTime?: string;
  googleMapsUri?: string;
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
}

interface PlaceDetails {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlacesReview[];
  attributions?: { provider?: string; providerUri?: string }[];
}

@Injectable()
export class GoogleReviewsService {
  private readonly ipv4Agent = new Agent({ family: 4 });

  async getReviews(language: 'ka' | 'en') {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = process.env.GOOGLE_PLACES_PLACE_ID;
    if (!apiKey || !placeId) return { configured: false, reviews: [] };

    try {
      const { data } = await axios.get<PlaceDetails>(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
        {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews,attributions',
          },
          params: { languageCode: language },
          httpsAgent: this.ipv4Agent,
          timeout: 6000,
        },
      );

      return {
        configured: true,
        rating: data.rating ?? null,
        total: data.userRatingCount ?? 0,
        googleMapsUri: data.googleMapsUri ?? null,
        attributions: (data.attributions ?? []).filter((item) => item.provider).map((item) => ({
          provider: item.provider,
          uri: item.providerUri ?? null,
        })),
        reviews: (data.reviews ?? []).slice(0, 5).filter((review) => review.googleMapsUri && review.authorAttribution?.displayName).map((review) => ({
          id: review.name ?? review.googleMapsUri ?? review.publishTime,
          text: review.text?.text ?? '',
          languageCode: review.text?.languageCode ?? null,
          rating: review.rating ?? null,
          publishedAt: review.publishTime ?? null,
          googleMapsUri: review.googleMapsUri ?? null,
          author: {
            name: review.authorAttribution?.displayName ?? null,
            uri: review.authorAttribution?.uri ?? null,
            photoUri: review.authorAttribution?.photoUri ?? null,
          },
        })),
      };
    } catch {
      throw new BadGatewayException('Google reviews are temporarily unavailable');
    }
  }
}
