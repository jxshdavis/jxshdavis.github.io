# CLAUDE.md

This is Joshua Davis's personal academic website, built with Jekyll and hosted on GitHub Pages at jxshdavis.github.io.

## Project Overview

Jekyll-based academic portfolio using the Academic Pages theme (a fork of Minimal Mistakes). Showcases research, publications, teaching, and tutoring.

## Local Development

```bash
bundle install                    # Install Ruby dependencies
jekyll serve -l -H localhost      # Serve at localhost:4000 with live reload
```

JavaScript build (when editing JS assets):
```bash
npm run build:js    # Minify JS
npm run watch:js    # Watch for JS changes
```

## Project Structure

- `_pages/` — Static pages (about, CV, tutoring, etc.)
- `_posts/` — Blog posts
- `_publications/` — Research publication entries
- `_talks/` — Conference talks
- `_teaching/` — Teaching entries
- `_layouts/` — HTML templates
- `_includes/` — Reusable HTML components
- `_sass/` — SCSS stylesheets
- `assets/js/` — JavaScript files
- `_config.yml` — Main Jekyll configuration
- `_data/` — YAML data files (navigation, etc.)

## Tech Stack

- **Jekyll** — static site generator
- **GitHub Pages** — hosting
- **Ruby** — Gemfile dependencies
- **Sass/SCSS** — styling
- **jQuery** — frontend JS

## Deployment

Pushing to the `master` branch automatically deploys via GitHub Pages. No separate build step needed.

## Notes

- The site uses a custom "Berkeley Blue" color scheme.
- `assets/js/galton-bg.js` — custom background animation (Galton board).
- The `markdown_generator/` directory contains Python scripts that generate markdown files from TSV data for publications and talks.


## Current Development Tasks

I want to add a Strava training dashboard page to this site. It should show a GitHub-style activity heatmap, YTD stats (distance, activities), and a daily activity detail view. The data will come from the Strava API.

