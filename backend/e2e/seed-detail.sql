TRUNCATE TABLE listings RESTART IDENTITY CASCADE;

INSERT INTO
    listings (
        address,
        zip_code,
        price,
        sqft,
        beds,
        baths,
        listing_url,
        all_photo_urls,
        energy_star_score
    )
VALUES (
        '789 Lake View Dr',
        '15213',
        615000.00,
        2450,
        4,
        3.5,
        'https://example.com/789-lake-view',
        '/test-house.jpg | /globe.svg | /window.svg',
        91
    );
