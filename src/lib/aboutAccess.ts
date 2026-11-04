export const ABOUT_ACCESS_KEY = "about_no_access";

/** Presentation only: public content is not encrypted or access-controlled. */
export function isAboutMasked(section: string, setting: string): boolean {
  return section === "about" && setting === "true";
}