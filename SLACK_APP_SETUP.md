# Slack App Setup Guide — AccessBridge

## Step 1: Create the App

1. Go to https://api.slack.com/apps
2. Click **Create New App**
3. Choose **From an app manifest**
4. Select your test workspace
5. Paste the contents of `@/Users/manojmallick/Downloads/slack project/accessbridge/manifest.json`
6. Click **Next**, then **Create**

## Step 2: Get Credentials

### Bot User OAuth Token

1. Go to **OAuth & Permissions**.
2. Click **Install to Workspace**.
3. Copy the **Bot User OAuth Token** (`xoxb-...`).
4. Paste into `.env` as `SLACK_BOT_TOKEN`.

### Signing Secret

1. Go to **Basic Information**.
2. Copy **Signing Secret**.
3. Paste into `.env` as `SLACK_SIGNING_SECRET`.

### App-Level Token

1. Go to **Basic Information**.
2. Under **App-Level Tokens**, click **Generate Token and Scopes**.
3. Add scope `connections:write`.
4. Generate and copy the token (`xapp-1-...`).
5. Paste into `.env` as `SLACK_APP_TOKEN`.

## Step 3: Verify Scopes & Interactivity

1. Go to **OAuth & Permissions**.
2. Confirm bot scopes include:
   - `app_mentions:read`
   - `chat:write`
   - `commands`
   - `files:read`
   - `search:read`
3. Reinstall the app if you added any scopes.
4. Go to **Interactivity & Shortcuts** and confirm these message shortcuts are listed:
   - `Simplify this message`
   - `Explain acronym`

## Step 4: Enable Socket Mode

1. Go to **Socket Mode**.
2. Turn **Enable Socket Mode** on.

## Step 5: Invite the Bot

In a Slack channel, type:

```
/invite @AccessBridge
```

## Step 6: Test

```bash
npm start
```

Then in Slack:

```
@AccessBridge simplify this: "The implementation of this feature requires significant effort."
```

Expected response:

```
*Plain-language version:*

"The team needs to work hard to add this feature."

_Before: Grade 14 (difficult)_
_After: Grade 4 (easy to read)_
_Improved readability_
```

## Step 7: Test Shortcuts and App Home

1. Right-click any message in a channel where the bot is invited.
2. Choose **Simplify this message**.
3. You should see an ephemeral reply with the plain-language version and reading scores.
4. Click the AccessBridge app icon in the sidebar to open the Home tab with instructions.

## Step 8: Invite the Judges

1. In your Slack developer sandbox, go to **People** → **Invite people**.
2. Add these emails as **Members** (not Guests):
   - `slackhack@salesforce.com`
   - `testing@devpost.com`
3. Make sure the AccessBridge bot is installed and the judges can access the test channel.
4. Copy your workspace URL (e.g., `https://your-team.slack.com`) and include it in your Devpost submission.
