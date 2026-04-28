import { buildListingsQuery } from "../api";

describe("buildListingsQuery", () => {
  it("includes page and size", () => {
    const query = buildListingsQuery({
      page: 2,
      size: 12,
      filters: {},
    });

    expect(query).toContain("page=2");
    expect(query).toContain("size=12");
  });

  it("includes sortOption when a sort is provided", () => {
    const query = buildListingsQuery({
      page: 0,
      size: 12,
      sort: "SQFT_DESC",
      filters: {},
    });

    expect(query).toContain("sortOption=SQFT_DESC");
    expect(query).not.toContain("sort=SQFT_DESC");
  });

  it("includes recommendationSessionId when provided", () => {
    const query = buildListingsQuery({
      page: 1,
      size: 12,
      sort: "RECOMMENDED",
      recommendationSessionId: "session-123",
      filters: {},
    });

    expect(query).toContain("sortOption=RECOMMENDED");
    expect(query).toContain("recommendationSessionId=session-123");
  });

  it("includes maxSqft when provided", () => {
    const query = buildListingsQuery({
      page: 0,
      size: 12,
      filters: {
        maxSqft: 1800,
      },
    });

    expect(query).toContain("maxSqft=1800");
  });

  it("omits maxSqft when undefined", () => {
    const query = buildListingsQuery({
      page: 0,
      size: 12,
      filters: {
        minSqft: 1200,
        maxSqft: undefined,
      },
    });

    expect(query).toContain("minSqft=1200");
    expect(query).not.toContain("maxSqft=");
  });

  it("includes minEnergyStarScore when provided", () => {
    const query = buildListingsQuery({
      page: 0,
      size: 12,
      filters: {
        minEnergyStarScore: 30,
      },
    });

    expect(query).toContain("minEnergyStarScore=30");
  });

  it("omits minEnergyStarScore when undefined", () => {
    const query = buildListingsQuery({
      page: 0,
      size: 12,
      filters: {
        minSqft: 1200,
        minEnergyStarScore: undefined,
      },
    });

    expect(query).toContain("minSqft=1200");
    expect(query).not.toContain("minEnergyStarScore=");
  });

  it("includes multiple filters together", () => {
    const query = buildListingsQuery({
      page: 0,
      size: 12,
      filters: {
        minPrice: 250000,
        maxPrice: 600000,
        minBeds: 3,
        minBaths: 2,
        minSqft: 1400,
        maxSqft: 2200,
        minEnergyStarScore: 30,
      },
    });

    expect(query).toContain("minPrice=250000");
    expect(query).toContain("maxPrice=600000");
    expect(query).toContain("minBeds=3");
    expect(query).toContain("minBaths=2");
    expect(query).toContain("minSqft=1400");
    expect(query).toContain("maxSqft=2200");
    expect(query).toContain("minEnergyStarScore=30");
  });

  it("omits undefined filters", () => {
    const query = buildListingsQuery({
      page: 0,
      size: 12,
      filters: {
        minPrice: undefined,
        maxPrice: undefined,
        minBeds: undefined,
        minBaths: undefined,
        minSqft: undefined,
        maxSqft: undefined,
        minEnergyStarScore: undefined,
      },
    });

    expect(query).not.toContain("minPrice=");
    expect(query).not.toContain("maxPrice=");
    expect(query).not.toContain("minBeds=");
    expect(query).not.toContain("minBaths=");
    expect(query).not.toContain("minSqft=");
    expect(query).not.toContain("maxSqft=");
    expect(query).not.toContain("minEnergyStarScore=");
  });
});
