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
        'Page 1 Listing A',
        200000.00,
        1200,
        2,
        1.5,
        'https://example.com/1',
        '/test-house.jpg'
    ),
    (
        'Page 1 Listing B',
        210000.00,
        1250,
        2,
        1.5,
        'https://example.com/2',
        '/test-house.jpg'
    ),
    (
        'Page 1 Listing C',
        220000.00,
        1300,
        3,
        2.0,
        'https://example.com/3',
        '/test-house.jpg'
    ),
    (
        'Page 1 Listing D',
        230000.00,
        1350,
        3,
        2.0,
        'https://example.com/4',
        '/test-house.jpg'
    ),
    (
        'Page 1 Listing E',
        240000.00,
        1400,
        3,
        2.0,
        'https://example.com/5',
        '/test-house.jpg'
    ),
    (
        'Page 1 Listing F',
        250000.00,
        1450,
        3,
        2.0,
        'https://example.com/6',
        '/test-house.jpg'
    ),
    (
        'Page 1 Listing G',
        260000.00,
        1500,
        3,
        2.0,
        'https://example.com/7',
        '/test-house.jpg'
    ),
    (
        'Page 1 Listing H',
        270000.00,
        1550,
        3,
        2.0,
        'https://example.com/8',
        '/test-house.jpg'
    ),
    (
        'Page 1 Listing I',
        280000.00,
        1600,
        3,
        2.5,
        'https://example.com/9',
        '/test-house.jpg'
    ),
    (
        'Page 1 Listing J',
        290000.00,
        1650,
        3,
        2.5,
        'https://example.com/10',
        '/test-house.jpg'
    ),
    (
        'Page 1 Listing K',
        300000.00,
        1700,
        3,
        2.5,
        'https://example.com/11',
        '/test-house.jpg'
    ),
    (
        'Page 1 Listing L',
        310000.00,
        1750,
        3,
        2.5,
        'https://example.com/12',
        '/test-house.jpg'
    ),
    (
        'Page 2 Listing A',
        320000.00,
        1800,
        4,
        3.0,
        'https://example.com/13',
        '/test-house.jpg'
    );