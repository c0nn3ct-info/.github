# .github

This repository holds the organisation profile for **c0nn3ct.info**.

[`profile/README.md`](./profile/README.md) is what GitHub renders on
[the organisation page](https://github.com/c0nn3ct-info). Its Russian, Spanish, Chinese, Persian and
Arabic translations sit beside it as `profile/README.<locale>.md`; their language menu follows the
same convention as the Noctis and aria2t repositories. `profile/media/` holds the images they share.

[`site/`](./site) is the source of <https://c0nn3ct.info>, deployed to GitHub Pages by the workflow in
`.github/workflows/`. The site is the source of truth for organisation copy. Update the profile
READMEs after changing the site dictionaries. Each product documents itself in its own repository.

Images are referenced by absolute `raw.githubusercontent.com` URLs rather than relative paths,
because relative paths in an organisation profile resolve against the profile page instead of this
repository.
