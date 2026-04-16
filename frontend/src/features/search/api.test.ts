import { getSearchSuggestions } from "./api";

describe("getSearchSuggestions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns normalized address and zip suggestions", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          type: "address",
          address: "123 Main St",
          listingId: 42,
          zipCode: "15213",
        },
        {
          type: "zip",
          value: "15213",
        },
      ],
    } as Response);

    await expect(getSearchSuggestions("15")).resolves.toEqual([
      {
        type: "address",
        value: "123 Main St",
        listingId: 42,
        zipCode: "15213",
      },
      {
        type: "zip",
        value: "15213",
      },
    ]);
  });

  it("returns an empty array for a blank query", async () => {
    global.fetch = jest.fn();

    await expect(getSearchSuggestions("   ")).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
