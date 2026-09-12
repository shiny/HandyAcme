# Publishing HandyAcme

Releases use npm's [trusted publishing](https://docs.npmjs.com/trusted-publishers/)
with GitHub Actions OIDC. The workflow uses the official `actions/checkout` and
`actions/setup-node` actions and the npm CLI. It does not require an `NPM_TOKEN`
repository secret or a maintainer's local npm login for each release.

## One-time npm package configuration

In the `handyacme` package settings on npmjs.com, add a GitHub Actions trusted
publisher with these exact fields:

| Field | Value |
| --- | --- |
| Organization or user | `shiny` |
| Repository | `HandyAcme` |
| Workflow filename | `publish.yml` |
| Environment name | Leave empty |
| Allowed actions | Allow direct `npm publish` |

The package maintainer must authorize this relationship on npm before the first
Actions publish can succeed. Configuring a GitHub workflow alone does not grant
access to publish an existing npm package. Keep the account's 2FA enabled.

## Release

1. Update `package.json`, the root versions in `package-lock.json`, and
   `CHANGELOG.md`. Run the build, typecheck, lint, and tests.
2. Commit and push the changes to `main`.
3. Create and push a matching stable release tag, for example:

   ```sh
   git tag -a v0.1.5 -m "HandyAcme v0.1.5"
   git push origin v0.1.5
   ```

4. Wait for **Publish to npm** to pass and verify the version on npm.
5. Publish the matching GitHub Release.

The workflow checks out the tagged commit, rejects mismatched package versions,
installs locked dependencies without caching, and runs every check before
publishing. npm adds provenance automatically for trusted publishing from this
public repository.

If the run fails because the npm trusted publisher was not configured yet,
configure it and rerun the failed workflow. Alternatively, manually run
`publish.yml` with the existing release tag. Do not create a replacement version
or move a published tag to retry authentication. A version already published to
npm cannot be overwritten.
