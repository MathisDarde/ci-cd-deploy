-- Adds likes to wishlist entries.
-- Expand-only change: a non-null column with a default keeps every existing row
-- (they start at 0 likes) and the previous API version keeps working.
alter table wishlist add column if not exists likes integer not null default 0;

alter table wishlist drop constraint if exists wishlist_likes_positive;
alter table wishlist add constraint wishlist_likes_positive check (likes >= 0);
