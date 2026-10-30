# Deploying Love Lafda Solver

One container, one Postgres, one IAM role. Nothing else is needed for the MVP.

## What runs where

| Piece | Service | Notes |
|---|---|---|
| The app | AWS App Runner, from a container image | One instance is enough; see the rate-limit caveat below before scaling out |
| The database | RDS for PostgreSQL 16 | Smallest burstable instance; the whole schema is four tables |
| The judge | Amazon Bedrock, Converse API | Called from the app's task role, no keys on disk |

## Environment

| Variable | Required | Value |
|---|---|---|
| `DATABASE_URL` | yes | `postgresql://USER:PASSWORD@HOST:5432/love_lafda?sslmode=require` |
| `BEDROCK_MODEL_ID` | no | Unset means the built-in mock judge answers. Set it to the model you enabled in the Bedrock console. Currently `amazon.nova-2-lite-v1:0`; `anthropic.claude-sonnet-5` is the stronger option at roughly 2.8 cents per case against Nova's 0.6 cents. |
| `AWS_REGION` | no | Defaults to `us-east-1`. Must be a region where your model is enabled. |
| `GEMINI_API_KEY` | no | A Google AI Studio key. **If this is set it wins over Bedrock**, because it is the one a developer sets deliberately and last. |
| `GEMINI_MODEL_ID` | no | Defaults to `gemini-2.5-flash`. `gemini-3.5-flash` measured about 40% faster on the same case and used fewer output tokens; both hold the required output shape. |
| `AWS_BEARER_TOKEN_BEDROCK` | no | A Bedrock API key, if you are using one instead of an IAM role or `~/.aws/credentials`. Paste the token only: the Bedrock console prints a whole `export AWS_BEARER_TOKEN_BEDROCK=...` line, and the `export ` prefix must not end up in the value. In App Runner prefer the instance role below and leave this unset. |

`lib/env.ts` validates these at boot, so a missing or malformed `DATABASE_URL` fails the container at start rather than on the first request.

`DATABASE_URL` is needed at **build** time as well as at runtime, on any host
that builds from source. `npm run build` runs `prisma generate` first, and
`prisma.config.ts` resolves `DATABASE_URL` to configure the datasource; the
build never opens a connection, so any syntactically valid URL gets it
through, but an absent one fails the build. The generated client lives in
`lib/generated/` and is deliberately not committed, so a host that installs
dependencies and runs `next build` directly, without `npm run build`, fails
with `Can't resolve './generated/prisma/client'`.

## IAM

The App Runner **instance** role (not the access role) needs exactly one action:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "bedrock:InvokeModel",
    "Resource": "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-2-lite-v1:0"
  }]
}
```

Swap the resource ARN when you change `BEDROCK_MODEL_ID`. If you move to a cross-region inference profile, you also need `bedrock:InvokeModel` on the profile ARN and on the model ARN in each region it can route to.

A brand-new AWS account is held for verification for up to a couple of hours. Until
that clears, every call fails with "Your account is currently being verified" even
though the credentials and the model id are correct; `npm run judge:check` names it.

Enable the model first: Bedrock console → Model access. A model that is not enabled fails at call time, not at deploy time, and surfaces to both people as the FAILED screen with a retry button.

## Which mediator runs

`lib/judge/provider.ts` picks one, in this order:

1. `GEMINI_API_KEY` set, so Gemini;
2. else `BEDROCK_MODEL_ID` set, so Bedrock;
3. else the built-in mock, which answers from the input without a model.

Both real providers answer into the same `JudgeResult`, validated with Zod on
every run, so nothing downstream knows or cares which one ran. Gemini gets the
shape through `responseSchema`; Bedrock gets it through a forced tool call.
Each is imported only when it is chosen.

Note that these are different data processors. Routing accounts to Google
rather than to AWS is a deliberate choice, not a fallback.

## Checking the judge works

```sh
npm run judge:check
```

Makes one real call through the same provider resolution the app uses, prints the
verdict and the token usage, and names the specific failure if it cannot: a rejected
Gemini key, exhausted quota, a model id that does not exist, missing AWS credentials,
a missing `bedrock:InvokeModel` permission, a Bedrock model that is inference-profile
only, an account-level Bedrock restriction, or a model that cannot hold the output
shape. Use it instead of the AWS CLI, which this project never shells out to.

## Database

```sh
# once, against the production database
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Run this as a release step before the new image takes traffic. `migrate deploy` only applies existing migrations and never generates or resets anything, which is why it and not `migrate dev` belongs in a pipeline. Do not run `prisma/seed.ts` in production: it starts with `deleteMany()` and would wipe every real case.

## Build

```sh
npm ci
npx prisma generate      # the client is generated into lib/generated, which is gitignored
npm run build
npm start                # next start, port 3000
```

`prisma generate` must run before `next build` on a clean checkout, or the build cannot resolve `lib/generated/prisma`.

## Before you open it to anyone

- [ ] Enable the Bedrock model in your region and confirm its real price in the console. The prices in `docs/mvp-plan.md` name models that do not exist and understate Claude Haiku by a factor of ten.
- [ ] Put the app behind HTTPS. The whole security model is that a link is unguessable; a link sent in clear text is not.
- [ ] Set `DATABASE_URL` with `sslmode=require`.
- [ ] Run the fairness tests against the live model: `npm test` with `GEMINI_API_KEY` (or `BEDROCK_MODEL_ID` plus credentials) in `.env`. Four of them skip without credentials, and they are the ones that catch a model taking a side by position, length or tone. A lite model makes them more important, not less.
- [ ] Decide what happens to old cases. There is no expiry and no delete: every case and both accounts live in Postgres forever until someone writes a cleanup job.

## Known limits of this MVP

- **The rate limit is per instance and in memory** (`lib/ratelimit.ts`): five new cases per address per hour, reset on every deploy. On more than one instance the effective limit multiplies by the instance count. Move it to Redis, or set an App Runner request limit, before scaling out.
- **The judge runs inside the lock request.** A case where both people lock at once holds one HTTP request open for the length of a model call. Fine at this size; it wants a queue if traffic ever arrives.
- **No file uploads.** Evidence is text plus up to five URLs, per the plan's non-scope.
- **No way back into a lost case.** No accounts, no email, no recovery. A lost link is a lost case, and the UI says so.
