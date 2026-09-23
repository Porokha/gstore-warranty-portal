import axios from 'axios';
import { GoogleReviewsService } from './google-reviews.service';

jest.mock('axios');

describe('GoogleReviewsService', () => {
  const service = new GoogleReviewsService();
  const originalKey = process.env.GOOGLE_PLACES_API_KEY;
  const originalPlaceId = process.env.GOOGLE_PLACES_PLACE_ID;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY;
    else process.env.GOOGLE_PLACES_API_KEY = originalKey;
    if (originalPlaceId === undefined) delete process.env.GOOGLE_PLACES_PLACE_ID;
    else process.env.GOOGLE_PLACES_PLACE_ID = originalPlaceId;
    jest.clearAllMocks();
  });

  it('does not call Google until both server settings are configured', async () => {
    delete process.env.GOOGLE_PLACES_API_KEY;
    delete process.env.GOOGLE_PLACES_PLACE_ID;
    expect(await service.getReviews('ka')).toEqual({ configured: false, reviews: [] });
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('requests only the review fields and maps the response without exposing the key', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'server-only-key';
    process.env.GOOGLE_PLACES_PLACE_ID = 'ChIJtest';
    (axios.get as jest.Mock).mockResolvedValue({ data: {
      rating: 4.8,
      userRatingCount: 42,
      googleMapsUri: 'https://maps.example/place',
      reviews: [{
        name: 'places/ChIJtest/reviews/1',
        rating: 5,
        text: { text: 'Helpful', languageCode: 'en' },
        googleMapsUri: 'https://maps.example/review/1',
        authorAttribution: { displayName: 'Customer', uri: 'https://maps.example/person' },
      }],
    } });

    const result = await service.getReviews('en');
    expect(axios.get).toHaveBeenCalledWith(
      'https://places.googleapis.com/v1/places/ChIJtest',
      expect.objectContaining({
        headers: {
          'X-Goog-Api-Key': 'server-only-key',
          'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews,attributions',
        },
        params: { languageCode: 'en' },
      }),
    );
    expect(result).toMatchObject({ configured: true, rating: 4.8, total: 42, reviews: [{ text: 'Helpful', author: { name: 'Customer' } }] });
    expect(JSON.stringify(result)).not.toContain('server-only-key');
  });
});
