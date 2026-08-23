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
**download a backup**.
