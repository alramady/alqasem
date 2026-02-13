import { describe, expect, it } from "vitest";
import { properties, projects } from "../drizzle/schema";

describe("Bilingual Schema Fields", () => {
  it("properties table has English title field", () => {
    expect(properties.titleEn).toBeDefined();
    expect(properties.titleEn.name).toBe("titleEn");
  });

  it("properties table has English city field", () => {
    expect(properties.cityEn).toBeDefined();
    expect(properties.cityEn.name).toBe("cityEn");
  });

  it("properties table has English district field", () => {
    expect(properties.districtEn).toBeDefined();
    expect(properties.districtEn.name).toBe("districtEn");
  });

  it("properties table has English description field", () => {
    expect(properties.descriptionEn).toBeDefined();
    expect(properties.descriptionEn.name).toBe("descriptionEn");
  });

  it("properties table has English address field", () => {
    expect(properties.addressEn).toBeDefined();
    expect(properties.addressEn.name).toBe("addressEn");
  });

  it("projects table has English title field", () => {
    expect(projects.titleEn).toBeDefined();
    expect(projects.titleEn.name).toBe("titleEn");
  });

  it("projects table has English subtitle field", () => {
    expect(projects.subtitleEn).toBeDefined();
    expect(projects.subtitleEn.name).toBe("subtitleEn");
  });

  it("projects table has English location field", () => {
    expect(projects.locationEn).toBeDefined();
    expect(projects.locationEn.name).toBe("locationEn");
  });

  it("projects table has English description field", () => {
    expect(projects.descriptionEn).toBeDefined();
    expect(projects.descriptionEn.name).toBe("descriptionEn");
  });
});

describe("Bilingual Schema - Original Arabic Fields Preserved", () => {
  it("properties table still has Arabic title field", () => {
    expect(properties.title).toBeDefined();
    expect(properties.title.name).toBe("title");
  });

  it("properties table still has Arabic city field", () => {
    expect(properties.city).toBeDefined();
    expect(properties.city.name).toBe("city");
  });

  it("projects table still has Arabic title field", () => {
    expect(projects.title).toBeDefined();
    expect(projects.title.name).toBe("title");
  });

  it("projects table still has Arabic location field", () => {
    expect(projects.location).toBeDefined();
    expect(projects.location.name).toBe("location");
  });
});
