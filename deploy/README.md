# Deploying

The site is published to GitHub Pages from the `gh-pages` branch at https://hellonestwell.com:

```bash
bash scripts/deploy-gh-pages.sh
```

It builds with `BASE_PATH=/` and pushes `dist/` (including `CNAME`) to `gh-pages`. DNS for
hellonestwell.com is on Cloudflare: four `A` records for `@` pointing at GitHub Pages
(185.199.108–111.153) and a `CNAME` for `www` pointing at `shahablo.github.io`, all DNS-only.

`github-actions-pages.yml` is the equivalent GitHub Actions workflow. It lives here instead of
`.github/workflows/` only because the token used for the first push lacked the `workflow`
scope; move it back (and switch the Pages source to "GitHub Actions") once a token with that
scope is available (`gh auth refresh -h github.com -s workflow`).
