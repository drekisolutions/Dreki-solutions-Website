# Voice capture environment

Sofia saves a confirmed caller message with `POST /api/voice/capture`. A worker then files a ClickUp task and sends an email through Gmail. The existing `VOICE_GMAIL_CREDENTIALS` value is reused. Do not mint a new token and do not change its scope.

Set the two new variables on the host that runs the site. Do not commit the values. A missing or invalid `VOICE_CLICKUP_LIST_ID` or `VOICE_NOTIFY_EMAIL` fails closed: voice routes other than `GET /api/voice/health` return 503 and the thrown error names the variable.

## Values to set before the next deploy

| Variable | Required value | Rule |
| --- | --- | --- |
| `VOICE_CLICKUP_LIST_ID` | `901423130318` | Digits only. This is Team Space > Command > The Continental. There is no code fallback. |
| `VOICE_NOTIFY_EMAIL` | `brett@dreki-solutions.com` | One email address. This is who the message is sent to, and the `From` header. It must equal the existing `sender` field inside `VOICE_GMAIL_CREDENTIALS`. |

`VOICE_GMAIL_CREDENTIALS` stays as it is on the host today. Its `scope` is `https://www.googleapis.com/auth/gmail.send`. Its `sender` on the previous code was `brett@dreki-solutions.com`. With `VOICE_NOTIFY_EMAIL` set to that same address, the stored JSON needs no new field and no re-consent.

`VOICE_BLAND_AGENT_ID` is optional. When it is unset, verification uses Sofia, `a14c385f-e975-454f-a6f3-01d334da0d59`. Set it only to replace that id with another UUID.

Existing voice variables stay as they are: `VOICE_PUBLIC_ORIGIN`, `VOICE_DATABASE_URL`, `VOICE_BLAND_TOKEN`, `VOICE_BLAND_WEBHOOK_SECRET`, `VOICE_CLICKUP_TOKEN`, `VOICE_WORKER_SECRET`, and the Twilio account, numbers, app, and auth token. This change does not add SMS or an urgent kind.

## How the email addresses are chosen

`VOICE_GMAIL_CREDENTIALS` is the same JSON object the current site already uses. The code reads `client_id`, `client_secret`, `refresh_token`, `scope`, and `sender`. It exchanges the refresh token at `https://oauth2.googleapis.com/token` (`grant_type=refresh_token`), then sends with `POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send` and `{ "raw": "<base64url mime>" }`.

The send is refused, before any Gmail request, unless `scope` is exactly `https://www.googleapis.com/auth/gmail.send` and `sender` equals `VOICE_NOTIFY_EMAIL`. `gmail.compose` is not accepted. The token response's scope is not checked, so the current refresh token keeps working.

- **To:** `VOICE_NOTIFY_EMAIL`.
- **From header:** `VOICE_NOTIFY_EMAIL`.
- **Account that sends:** the Google account that owns the stored refresh token (`users/me`). The `sender` field is the local check that this credential belongs to that same address. On the previous code that address was `brett@dreki-solutions.com`.

No Gmail re-consent is required when the stored credential already has `scope` `https://www.googleapis.com/auth/gmail.send` and `sender` `brett@dreki-solutions.com`.

## After the variables are saved

Redeploy the site that serves `www.dreki-solutions.ai` so the new code and the two new variables are both live. Until that deploy, production still files the old Marketing list. Confirm a test capture creates a ClickUp task on The Continental and sends the email to `brett@dreki-solutions.com`.
