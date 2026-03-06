-- Seed script: 15 La Union venues from app/lib/restaurants.ts
-- Run in Supabase Dashboard → SQL Editor
-- Safe to re-run (ON CONFLICT DO NOTHING)

INSERT INTO restaurants (id, name, category, vibe, address, lat, lng, hours, description)
VALUES
  -- BREAKFAST
  ('b-01', 'El Union Coffee',            'breakfast', ARRAY['café'],                          'MacArthur Highway, Urbiztondo, San Juan, La Union',  16.6596395, 120.3223696, '7:00 AM – 10:00 PM', 'One of the most famous cafés in La Union — viral horchata, grilled cheese, surfer vibe, and very Instagrammable. Usually crowded.'),
  ('b-02', 'Clean Beach Coffee',         'breakfast', ARRAY['café','casual dining'],           'Urbiztondo Beachfront, San Juan, La Union',           16.6621100, 120.3238470, '7:00 AM – 9:00 PM',  'Beachfront café with great ocean views. Known for smoothie bowls and coffee.'),
  ('b-03', 'The Coffee Library San Juan','breakfast', ARRAY['café'],                           'Urbiztondo, San Juan, La Union',                      16.6563141, 120.3211403, '7:00 AM – 9:00 PM',  'Travel-themed café famous for Vietnamese coffee and pho. Good brunch location.'),
  ('b-04', 'Masa Bakehouse La Union',    'breakfast', ARRAY['café'],                           'San Juan, La Union',                                  16.6715329, 120.3429384, '7:00 AM – 5:00 PM',  'One of the best pastry spots in Elyu — famous for croissants, sourdough, and brunch plates.'),
  ('b-05', 'Curo La Union',             'breakfast', ARRAY['casual dining'],                  'Urbiztondo, San Juan, La Union',                      16.6589199, 120.3306647, '7:00 AM – 10:00 PM', 'Popular all-day breakfast and brunch restaurant. Good for sit-down breakfast.'),

  -- LUNCH
  ('l-01', 'Tagpuan Sa San Juan',        'lunch',     ARRAY['casual dining'],                  'San Juan, La Union',                                  16.658650,  120.321850,  '10:00 AM – 10:00 PM','Famous for Ilocano dishes — bagnet, sinanglaw. One of the most recommended local food spots.'),
  ('l-02', 'Seabuds',                   'lunch',     ARRAY['café','casual dining'],            'Urbiztondo, San Juan, La Union',                      16.6570618, 120.3201926, '8:00 AM – 8:00 PM',  'Vegan café with tropical ambiance. Good healthy bowls and smoothies.'),
  ('l-03', 'Little Canggu',             'lunch',     ARRAY['café','casual dining'],            'Urbiztondo, San Juan, La Union',                      16.6620702, 120.3241228, '8:00 AM – 9:00 PM',  'Bali-style café. Good lunch: rice bowls, smoothie bowls.'),
  ('l-04', 'Surf Shack',                'lunch',     ARRAY['casual dining','bar'],             'Urbiztondo, San Juan, La Union',                      16.659000,  120.321700,  '10:00 AM – 10:00 PM','Casual surfer restaurant with pizza and seafood meals.'),

  -- DINNER / BARS
  ('d-01', 'Kabsat La Union',           'dinner',    ARRAY['casual dining','party'],           'San Juan, La Union',                                  16.665520,  120.315700,  '11:00 AM – 11:00 PM','Famous sunset dining restaurant with large beach-view seating.'),
  ('d-02', 'Olas Banditos',             'dinner',    ARRAY['casual dining','bar'],             'Urbiztondo, San Juan, La Union',                      16.658330,  120.322230,  '11:00 AM – 11:00 PM','Very popular Mexican restaurant — tacos and burritos.'),
  ('d-03', 'La Kantina by Kermit',      'dinner',    ARRAY['casual dining','bar'],             'Urbiztondo, San Juan, La Union',                      16.660000,  120.322900,  '5:00 PM – 12:00 AM', 'Italian food and cocktails. Good dinner vibe.'),
  ('d-04', 'Flotsam and Jetsam',        'dinner',    ARRAY['bar','party'],                     'Urbiztondo Beach, San Juan, La Union',                16.661620,  120.324500,  'Open 24 hours',       'One of the most famous party hostels and bars in Elyu.'),
  ('d-05', 'Tavern By The Sea',         'dinner',    ARRAY['bar','party'],                     'Urbiztondo Beach, San Juan, La Union',                16.659900,  120.322400,  '6:00 PM – 2:00 AM',  'Beachfront bar with DJs.'),
  ('d-06', 'Ugly Bar',                  'dinner',    ARRAY['bar','party'],                     'Urbiztondo, San Juan, La Union',                      16.661200,  120.324200,  '8:00 PM – 3:00 AM',  'Popular night bar for music and drinks.')

ON CONFLICT (id) DO NOTHING;
