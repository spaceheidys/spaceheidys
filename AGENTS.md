# Project rules

- Admin Secret Door entry reuses the authenticated `getUser` and `has_role` checks before navigating to the existing secret screen; keep password verification and private asset access unchanged so the admin shortcut does not weaken visitor security.