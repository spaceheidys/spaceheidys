# Project rules

- Mount portfolio lightboxes in a body portal and bound project views to the viewport; scroll only metadata so long content cannot move the preview or its actions off screen.

- Password recovery uses Cloud Auth email links and a public reset page; password updates require a recovery session and never bypass admin role checks.

- Admin Secret Door entry reuses the authenticated `getUser` and `has_role` checks before navigating to the existing secret screen; keep password verification and private asset access unchanged so the admin shortcut does not weaken visitor security.
- Store the visitor direct-entry toggle in the existing admin-write/public-read section content settings; it controls navigation to the existing public sector only and must never authorize private asset access.
- Store the ABOUT mask toggle in section content settings and replace the shared ABOUT body in normal and expanded views; this is presentation-only, not encryption or private-data authorization.
- Keep portfolio dealing in PortfolioCardSpread with pure cardSpread transitions; capture actual visible images so pinned cards do not change when the deck advances, and reset the spread on section exit.
- Store the card-spread presentation toggle in existing section content settings; off renders the original PortfolioCard and its original sizing without drag targets.