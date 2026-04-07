TRUNCATE TABLE listings RESTART IDENTITY CASCADE;

INSERT INTO
    listings (
        address,
        price,
        sqft,
        beds,
        baths,
        listing_url,
        all_photo_urls
    )
VALUES (
        '123 Main St',
        250000.00,
        1400,
        3,
        2.0,
        'https://example.com/123-main',
        '/test-house.jpg'
    ),
    (
        '456 Oak Ave',
        450000.00,
        2200,
        4,
        3.0,
        'https://example.com/456-oak',
        '/test-house.jpg'
    );