# github-actions-ssm-env
Allows retrieval of SSM parameters per environment based on a GitHub branch name.

## Concepts

Some values are shared across all environments, while other values are environment specific. To make this easier to configure, this action always loads values at `/${application-name}/shared/*` as well as `${application-name}/${environment-name}/*`.

This means if you want a value to always apply to all environments, you can simply create it in the shared namespace and it'll be loaded in at all times.

Anything after the first two portions of the path is considered part of the variable name.

Also, the action assumes that branches called `master` or `main` correspond to your development environment. This is not currently configureable but it could be quite easily, we just don't have a need to make this configurable ourselves, so haven't built it yet.

## Usage
The action takes several options:

- `application-name`: This is effectively a prefix for the SSM keys. All keys are prefixed with this value like `/${application-name}/${environment-name}/VARIABLE`. This variable is required.
- `decryption`: Whether the SSM parameters must be decrypted or not. This is passed to the AWS SSM API. This parameter is optional and defaults to `false`.
- `mask-values`: GitHub Actions has the option to mask values in logging output. We assume most of what this action is handling is secret, so we default to turning this on for everything. If you want to disable this behaviour, you can set this value to `false`. Optional, defaults to `true`.

Also, `AWS_DEFAULT_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` should be set as environment variables so this action is able to connect to the correct SSM API and authenticate.

## Example

```yaml
name: main-workflow
on:
  push:
    branches: ["master", "staging", "production"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Download env vars from SSM Parameter Store
        uses: exogee-technology/github-actions-ssm-env@v1.0.0
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: ap-southeast-2
        with:
          application-name: my-amazing-application
          decryption: true

      - uses: actions/checkout@v2
      # ...etc...
```

If the following parameters are configured in AWS Systems Manager in `ap-southeast-2`:

| Name                                        | Type         | Value                                              |
|---------------------------------------------|--------------|----------------------------------------------------|
| /my-amazing-application/shared/GLOBAL_VALUE | SecureString | this is my global value                            |
| /my-amazing-application/development/API_URL | SecureString | https://development-api.my-amazing-application.com |
| /my-amazing-application/staging/API_URL     | SecureString | https://staging-api.my-amazing-application.com     |
| /my-amazing-application/production/API_URL  | SecureString | https://api.my-amazing-application.com             |

Then you'll get the following environment variables added when running the action on each of the following branches:

`master` / `main`:
- GLOBAL_VALUE="this is my global value"
- API_URL="https://development-api.my-amazing-application.com"

`staging`:
- GLOBAL_VALUE="this is my global value"
- API_URL="https://staging-api.my-amazing-application.com"

`production`:
- GLOBAL_VALUE="this is my global value"
- API_URL="https://api.my-amazing-application.com"
