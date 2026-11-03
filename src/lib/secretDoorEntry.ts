export const SECRET_DOOR_PUBLIC_ENTRY_KEY = "secret_door_public_entry_enabled";

export function secretDoorEntryTarget(value: string): "/secret" | null {
  return value === "true" ? "/secret" : null;
}