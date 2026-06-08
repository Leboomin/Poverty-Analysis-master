# Database Guide

The backend now uses SQLite as its structured data layer.

Database file:
- `backend/data/database/poverty-insights.sqlite`

Main backend flow:
- raw and processed project files remain in `backend/data/raw` and `backend/data/processed`
- startup initializes the SQLite schema
- startup records the current schema version in `schema_migrations`
- startup seeds the database from the current project data if the database is missing or empty
- repositories read from SQLite for dashboard, analytics, map metadata, and dataset catalog data

## Schema Versioning

The database now tracks schema history in:

- `schema_migrations`

Current behavior:
- the backend applies the current schema definition on startup
- the backend records the active schema version if it has not already been applied
- `npm run db:status` shows both the current schema version and the applied migration history

This is intentionally lightweight for now, but it gives the project a clean path for future table changes without relying only on reseeding.

## Main Tables

- `poverty_trend`
  Stores the relative poverty trend used by the dashboard and analytics pages.

- `support_metrics`
  Stores dashboard support indicators such as the poverty line and annual amount required.

- `demographic_breakdowns`
  Stores grouped 2023 demographic poverty values for sex, age, and activity.

- `regional_stats`
  Stores district-level RDI summaries used by the dashboard.

- `publications`
  Stores publication metadata shown across the app.

- `regression_series`
  Stores the macroeconomic regression inputs used by the analytics page.

- `prediction_series`
  Stores the observed poverty series, rolling average, and trend change.

- `dataset_catalog`
  Stores dataset list metadata for the dataset explorer.

- `dataset_preview_columns`
  Stores the preview column definitions for dataset explorer previews.

- `dataset_preview_rows`
  Stores preview rows as JSON payloads for each dataset.

- `map_regions`
  Stores map-ready regional RDI values and ranking metadata.

- `map_area_highlights`
  Stores top, bottom, and improving area highlight rows for the map page.

## Commands

Run from `backend/`:

- `npm run db:init`
  Initializes the SQLite file if needed and seeds empty tables.

- `npm run db:reset`
  Deletes the SQLite file and rebuilds it from project data.

- `npm run db:status`
  Prints the current SQLite file path, schema version, migration history, and row counts for the main tables.

## Notes

- GeoJSON is still kept as a file in `backend/data/raw/geospatial` and enriched with SQLite data at runtime.
- Some dataset preview behavior still reads directly from source files when that is more practical than storing the raw preview in SQL.
- SQLite currently uses Node's experimental `node:sqlite` module, which is acceptable for local project development but should be noted in documentation.
