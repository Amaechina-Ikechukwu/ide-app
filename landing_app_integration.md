# Landing Page Integration

This guide explains how the mobile app should consume the updated landing payload from `GET /api/landing`.

## Response shape

The endpoint now returns:

```json
{
  "content": {
    "headline": "Welcome to IDE",
    "body": "Buy, sell, and discover products around you.",
    "imageUrl": "",
    "ctaText": "Explore",
    "ctaUrl": "",
    "secondaryActionText": "",
    "secondaryActionUrl": "",
    "badgeText": "",
    "startAt": null,
    "endAt": null,
    "updatedAt": 1773385200000
  },
  "active": true,
  "status": "live",
  "bannerCarousel": [],
  "promotedPosts": []
}
```

## How to render it

1. Use `content` for the main landing hero or announcement card.
2. Only treat the hero as a live announcement when `active === true` and `status === "live"`.
3. Render `bannerCarousel` as a swipeable carousel directly under the hero section.
4. Render `promotedPosts` in the exact order returned by the API.
5. Hide the banner carousel section when `bannerCarousel.length === 0`.
6. Hide the promoted-post section when `promotedPosts.length === 0`.

## Hero announcement rules

- `content` is always present so the app can render a stable fallback.
- When `active` is `false`, treat `content` as fallback copy instead of a time-sensitive campaign.
- `badgeText`, `imageUrl`, `ctaText`, and `ctaUrl` are optional.
- If `ctaText` or `ctaUrl` is missing, hide the hero CTA button.

## Banner carousel rules

Each item in `bannerCarousel` contains:

- `id`
- `headline`
- `body`
- `imageUrl`
- `badgeText`
- `ctaText`
- `ctaUrl`
- `startAt`
- `endAt`
- `updatedAt`

Client behavior:

1. Render slides in the array order returned by the API.
2. Prefer `imageUrl` as the slide artwork.
3. Hide the CTA button for a slide when either `ctaText` or `ctaUrl` is empty.
4. Do not re-filter by time on the client unless you want an extra safety check; the API already returns only live slides.

## Promoted posts rules

`promotedPosts` contains normal post objects from the existing marketplace feed.

Client behavior:

1. Reuse the existing post-card UI if possible.
2. Render the list in the exact order returned by the API.
3. Use the post `id` as the stable key.
4. Tapping a promoted card should open the same post detail flow used elsewhere in the app.
5. Do not add your own sorting; admin ordering is already applied by the API.

## Recommended screen order

1. Landing hero announcement
2. Banner carousel
3. Promoted posts
4. Standard marketplace/feed content

## Empty-state expectations

- No live hero announcement: `active` will be `false`, but `content` still contains fallback text.
- No live banners: `bannerCarousel` will be `[]`.
- No valid promoted posts: `promotedPosts` will be `[]`.

## Admin workflow summary

The admin web UI now supports:

- Editing the hero announcement
- Managing up to five carousel banners
- Promoting up to five active posts
- Reordering both banners and promoted posts before publish

All ordering is preserved by the API, so the app should not override it.
