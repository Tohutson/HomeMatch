TRUNCATE TABLE listings RESTART IDENTITY CASCADE;

INSERT INTO
    listings (
        address,
        price,
        beds,
        baths,
        sqft,
        listing_url,
        all_photo_urls,
        energy_star_score
    )
VALUES (
        'Large House',
        450000,
        4,
        3.0,
        2500,
        'https://example.com/large-house',
        '/test-house.jpg',
        80
    ),
    (
        'Small House',
        250000,
        2,
        1.5,
        1000,
        'https://example.com/small-house',
        '/test-house.jpg',
        65
    );