# Turning on accounts

Until these steps are done the notebook keeps working exactly as before —
everything saved in the one browser, no sign-in button beyond a "this device"
label. Nothing breaks while you set this up.

## 1. Make a Supabase project

1. Go to <https://supabase.com>, sign up, and create a new project (free tier
   is plenty). Pick a region near you.
2. Wait for it to finish provisioning — a couple of minutes.

## 2. Create the table

Open **SQL Editor** in the Supabase dashboard, paste in the contents of
`supabase/schema.sql` from this repo, and run it. That makes a `notebooks`
table and turns on row-level security so each account can only touch its own
row.

## 3. Turn off email confirmation (optional, but easier)

**Authentication → Sign In / Providers → Email**: if you would rather not
click a confirmation link when you sign up, turn *Confirm email* off. With it
on, you have to confirm before your first sign-in works.

## 4. Copy your two keys

**Project Settings → API**:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public** key → `VITE_SUPABASE_ANON_KEY`

The anon key is meant to be public and safe to ship in a browser app — it only
grants what the row-level security policies above allow. Do **not** use the
`service_role` key here.

## 5. Add them to Vercel

In your Vercel project: **Settings → Environment Variables**, add both names
and values, then redeploy (Deployments → ⋯ → Redeploy).

## 6. Local development

Make a file called `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

It is already gitignored, so it will not be committed.

## What happens on first sign-in

If this browser has writing in it *and* your account already has writing in it,
the app stops and asks which to keep, with a button to download a backup of
either first. Otherwise it just does the sensible thing: an empty account gets
this device's notebook uploaded, and an empty device pulls the account's down.

After that it saves automatically about a second after you stop typing. The dot
next to your name is green when signed in, and the menu has **save now** and
**save a copy to this computer**.

## Passwords

Signed in already? **Account menu → change password.** No email involved, so
nothing can expire. That is the path to use whenever you are not locked out.

### Making the emailed reset link reliable

Forgotten-password emails send on the free plan, but the link Supabase puts in
them points at its own `/auth/v1/verify` endpoint, which spends the one-time
token on an ordinary GET. Mail providers open links to scan them for malware,
so the token is often spent before you click — which arrives as *"this link
has already been used or has expired"* on a link nobody touched.

The fix is a link that points at the app instead, because the token is then
only redeemed when the app's JavaScript calls `verifyOtp`, and scanners do not
run JavaScript. The app already handles that link shape. Putting it in the
email needs template editing, which Supabase gates behind custom SMTP.

**1. Get an SMTP sender.** [Resend](https://resend.com) has a free tier that is
ample here. Sign up with the same address as your Supabase account, then
**API Keys → Create API Key** and copy it — it is shown once.

Without a verified domain, Resend only delivers to the address you signed up
with. For a notebook with one user that is fine; add a domain later if other
people ever sign up.

**2. Point Supabase at it.** Project → **Authentication → Emails → SMTP
Settings** → enable custom SMTP:

| Field | Value |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | the API key from step 1 |
| Sender email | `onboarding@resend.dev` |
| Sender name | `allisw3ll` |

**3. Edit the template.** The "set up custom SMTP to edit templates" notice is
now gone. Open **Reset Password** and replace `{{ .ConfirmationURL }}` in the
link's `href` with:

```
{{ .SiteURL }}/?token_hash={{ .TokenHash }}&type=recovery
```

**4. Check the URLs.** **Authentication → URL Configuration**: Site URL is
`https://allisw3ll.vercel.app`, and the same URL is listed under Redirect URLs.
`{{ .SiteURL }}` in the template is exactly this value, so it has to be right.

Then request a fresh reset email. Old links cannot be revived — they were
already spent.
