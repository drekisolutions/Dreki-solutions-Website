# Voice capture environment

Sofia saves a confirmed caller message with `POST /api/voice/capture`. A worker then files a ClickUp task and a Gmail **draft**. This path does not send email.

Set these on the host that runs the site. Do not commit the values. A missing or invalid `VOICE_CLICKUP_LIST_ID` or `VOICE_NOTIFY_EMAIL` fails closed: voice routes other than `GET /api/voice/health` return 503 and the thrown error names the variable.

## Values to set before the next deploy

| Variable | Required value | Rule |
| --- | --- | --- |
| `VOICE_CLICKUP_LIST_ID` | `901423130318` | Digits only. This is Team Space > Command > The Continental. There is no code fallback. |
| `VOICE_NOTIFY_EMAIL` | `brett@dreki-solutions.com` | One email address. It is both the draft sender and the recipient. It must equal `sender` inside `VOICE_GMAIL_CREDENTIALS`. |
| `VOICE_GMAIL_CREDENTIALS` | JSON below | The refresh token must be minted with `https://www.googleapis.com/auth/gmail.compose` for the OAuth client already stored in this variable. |

`VOICE_BLAND_AGENT_ID` is optional. When it is unset, verification uses Sofia, `a14c385f-e975-454f-a6f3-01d334da0d59`. Set it only to replace that id with another UUID.

Existing voice variables stay as they are: `VOICE_PUBLIC_ORIGIN`, `VOICE_DATABASE_URL`, `VOICE_BLAND_TOKEN`, `VOICE_BLAND_WEBHOOK_SECRET`, `VOICE_CLICKUP_TOKEN`, `VOICE_WORKER_SECRET`, and the Twilio account, numbers, app, and auth token. This change does not add SMS or an urgent kind.

## Gmail credential shape

`VOICE_GMAIL_CREDENTIALS` is a JSON object. The code does not contain an OAuth client id. It reads `client_id`, `client_secret`, and `refresh_token` from this variable and exchanges the refresh token at `https://oauth2.googleapis.com/token` (`grant_type=refresh_token`). The draft is then created with `POST https://gmail.googleapis.com/gmail/v1/users/me/drafts` and `{ "message": { "raw": "<base64url mime>" } }`.

```json
{
  "client_id": "<client id already stored in VOICE_GMAIL_CREDENTIALS>",
  "client_secret": "<client secret already stored in VOICE_GMAIL_CREDENTIALS>",
  "refresh_token": "<new refresh token from the steps below>",
  "scope": "https://www.googleapis.com/auth/gmail.compose",
  "sender": "brett@dreki-solutions.com"
}
```

`scope` must be exactly `https://www.googleapis.com/auth/gmail.compose`. A `gmail.send` value, or a space-separated list that includes send, is rejected before any draft is created. If Google's token response includes `scope`, that value must be the same compose scope. `sender` must equal `VOICE_NOTIFY_EMAIL`.

Keep the existing OAuth client. Replace only the refresh token, the `scope` string, and `sender` if it still says something else.

## Mint a compose-scoped refresh token

Use the Google account that should own the drafts (`brett@dreki-solutions.com`) and the OAuth client whose id and secret are already in `VOICE_GMAIL_CREDENTIALS`.

1. In Google Cloud Console, open the project that owns that OAuth client. Enable the Gmail API if it is not already enabled.
2. On the OAuth consent screen, add the scope `https://www.googleapis.com/auth/gmail.compose`. Do not add `https://www.googleapis.com/auth/gmail.send` or `https://mail.google.com/`. If the app is in testing, add `brett@dreki-solutions.com` as a test user.
3. Open [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/). Click the gear and check **Use your own OAuth credentials**. Paste the existing client id and client secret. The client must allow the redirect URI `https://developers.google.com/oauthplayground`. Add that URI to the existing client if it is missing, and remove it again after the token is minted if you do not want the playground left on the client.
4. In step 1, enter only this scope and authorize it:

   `https://www.googleapis.com/auth/gmail.compose`

5. Sign in as `brett@dreki-solutions.com` and approve draft access.
6. Exchange the authorization code. Copy the **refresh token**. If Google does not return one, open [Google account permissions](https://myaccount.google.com/permissions), remove this app's access, and authorize again.
7. Put that refresh token into `VOICE_GMAIL_CREDENTIALS` with the JSON shape above. Set `scope` to `https://www.googleapis.com/auth/gmail.compose` and `sender` to the same address as `VOICE_NOTIFY_EMAIL`.

The playground is only a way to mint the token. The running site never uses the playground. It only refreshes the stored token and creates a draft.

## After the variables are saved

Redeploy the site that serves `www.dreki-solutions.ai` so the new code and variables are both live. Until that deploy, production still uses the previous ClickUp list and still sends mail. Confirm a test capture creates a ClickUp task on The Continental and a Gmail draft, and that no message is sent.
