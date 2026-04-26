# Stefana: Wedding Planner

A clean, AI-powered wedding planning app for iOS and Android. Built with React Native + Expo, Supabase, and Claude AI.

## Features

- **Smart Checklist** — Auto-generated timeline grouped by planning phase (12mo → day-of)
- **Budget Tracker** — Donut ring chart, category breakdown, expense log
- **Vendor Manager** — Status tracking, contract notes, payment schedules
- **Guest List** — RSVP tracking, plus-ones, dietary notes, seating assignments
- **Day-of Timeline** — Hour-by-hour schedule builder with PDF export + weather forecast (10 days out)
- **Photo Moodboard** — Inspiration board with camera roll + URL support
- **Seating Chart** — Table grid with shape types (round/rectangular/sweetheart/head) + guest assignment
- **Gift Registries** — All registry links in one place (Zola, The Knot, Amazon, and more)
- **Song Wishlist** — Music planning by moment (processional, first dance, reception, etc.)
- **AI Assistant** — Powered by Claude, context-aware wedding advice
- **Wedding Party** — Task delegation with share-code portal (no app install required)
- **Color Themes** — 10 hand-crafted palettes that theme the entire app

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 55 |
| Language | TypeScript |
| State | Zustand |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| AI | Anthropic Claude (user-provided API key) |
| Payments | RevenueCat (in-app subscriptions) |
| Notifications | expo-notifications |

## Tiers

| Tier | Price | Features |
|---|---|---|
| Free | $0 | 1 event, core checklist |
| Premium | $7.99/mo or $74.99/yr | AI assistant, wedding party, unlimited features |
| Pro | $19.99/mo or $189.99/yr | Multi-client management for wedding planners |

## Project Structure

```
src/
  screens/
    auth/          # SignIn, SignUp
    onboarding/    # Welcome → Date → Scale → Generating
    main/          # All main app screens
  store/
    authStore.ts   # Auth + profile state (Zustand)
    eventStore.ts  # All wedding data state (Zustand)
  utils/
    aiAssistant.ts    # Claude API integration
    exportUtils.ts    # PDF + CSV export
    notifications.ts  # Push notification scheduling
    purchases.ts      # RevenueCat wrapper
  navigation/
    index.tsx      # Stack + tab navigators
  context/
    ThemeContext.tsx  # Active color palette provider
  types/
    index.ts       # All TypeScript interfaces
  theme/
    index.ts       # Colors, Typography, Spacing constants
  lib/
    supabase.ts    # Supabase client
```

## Environment Variables

Create a `.env` file (never commit this):

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Development

```bash
# Install dependencies
npm install

# Start Expo Go (limited — no push notifications, no RevenueCat)
npx expo start

# Build dev client (full native features)
npx eas-cli build --platform android --profile development
```

## Before Production Build

- [ ] Fill in `REVENUECAT_APPLE_KEY` + `REVENUECAT_GOOGLE_KEY` in `src/utils/purchases.ts`
- [ ] Run `npx eas init` to set EAS project ID in `app.json`
- [ ] Fill in `ascAppId` + `appleTeamId` in `eas.json`
- [ ] Run the `delete_user_account` SQL function in Supabase (see below)
- [ ] Enable GitHub Pages on this repo for the privacy policy

## Supabase — Account Deletion Function

Run this in the Supabase SQL editor to enable self-serve account deletion:

```sql
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_profiles WHERE id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
```

## Links

- **Privacy Policy:** https://cssmith615.github.io/stefana
- **Support:** https://cssmith615.github.io/stefana/support.html
