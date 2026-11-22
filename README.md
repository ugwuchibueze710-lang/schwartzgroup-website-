# Schwartz Group Home Improvement — website

Static site for sg-homeimprovement.com: plain HTML/CSS/JS, no build step, hosted on Cloudflare Pages.

## The experience
- **Neon logo (top-left):** the real Schwartz Group logo as bolted glass neon tubes. A cable runs from it to a light switch on the house wall by the front door.
- **Wall switch:** click the switch by the front door to turn the neon on or off, with a strike flicker and a click sound. The state carries over from page to page.
- **Mini neon signs:** small copies of the logo sign float in the foreground. They roll and drift with the scroll and light up with the switch.

## Files
- `index.html`, `about-us.html`, `services.html`, `projects.html`, `contact-us.html`, `404.html`
- `css/style.css`, `js/main.js`
- `img/`: house photo (Pexels #106399), switch photo (Pexels #927546), logo, neon tube layers, mini sign renders, and the project photos from the original site
- `functions/api/contact.js`: the estimate form backend (Cloudflare Pages Function)

## Cloudflare Pages setup
1. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git, then pick this repo.
2. Framework preset: **None**. Build command: *(leave empty)*. Build output directory: `/`.
3. Deploy. Pretty URLs work automatically (`/about-us` serves `about-us.html`).
4. For the contact form to email leads: Settings > Variables and Secrets, then add
   - `RESEND_API_KEY` (from resend.com, after verifying the domain)
   - optional `CONTACT_TO` (defaults to info@sg-homeimprovement.com)
   - optional `CONTACT_FROM` (e.g. `Schwartz Group Website <leads@sg-homeimprovement.com>`)

   Until the key is set, the form shows a message asking visitors to call or email instead.
5. Custom domain: Pages project > Custom domains > add `sg-homeimprovement.com` and `www.sg-homeimprovement.com`.

## Still to fill in
- The social links in the footer (Facebook, Instagram, Google, YouTube) point to `#` until the real profile links are added.
