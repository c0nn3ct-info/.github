# .github

This repository holds the organisation profile for **c0nn3ct.info**.

[`profile/README.md`](./profile/README.md) is what GitHub renders on
[the organisation page](https://github.com/c0nn3ct-info), and `profile/media/` holds the images it
references. [`site/`](./site) is the source of <https://c0nn3ct.info>, deployed to GitHub Pages by
the workflow in `.github/workflows/`. Nothing here is authoritative about a product: each product
documents itself in its own repository.

Images are referenced by absolute `raw.githubusercontent.com` URLs rather than relative paths,
because relative paths in an organisation profile resolve against the profile page instead of this
repository.
