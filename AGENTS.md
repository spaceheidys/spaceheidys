# Project rules

- Admin Secret Door entry reuses the authenticated `getUser` and `has_role` checks before navigating to the existing secret screen; keep password verification and private asset access unchanged so the admin shortcut does not weaken visitor security.
- Store the visitor direct-entry toggle in the existing admin-write/public-read section content settings; it controls navigation to the existing public sector only and must never authorize private asset access.
- Store the ABOUT mask toggle in section content settings and replace the shared ABOUT body in normal and expanded views; this is presentation-only, not encryption or private-data authorization.