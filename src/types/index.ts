// ─── Enums / string literals ───────────────────────────────────────────────

export type UserTier = 'free' | 'premium' | 'pro';

export type WeddingPartyRole =
  | 'maid_of_honor'
  | 'bridesmaid'
  | 'best_man'
  | 'groomsman'
  | 'flower_girl'
  | 'ring_bearer'
  | 'parent'
  | 'other';
export type UserRole = 'user' | 'planner';

export type EventType =
  | 'wedding'
  | 'baby_shower'
  | 'birthday'
  | 'corporate'
  | 'graduation'
  | 'other';

export type ChecklistCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'videography'
  | 'florals'
  | 'music'
  | 'attire'
  | 'hair_makeup'
  | 'cake'
  | 'invitations'
  | 'transport'
  | 'accommodation'
  | 'honeymoon'
  | 'favors'
  | 'officiant'
  | 'rentals'
  | 'legal'
  | 'other';

export type VendorStatus = 'shortlisted' | 'contacted' | 'booked' | 'cancelled';

export interface PaymentMilestone {
  id: string;
  label: string;
  amount: number;
  due_date: string; // YYYY-MM-DD
  paid: boolean;
  paid_date?: string;
}

export type ExpenseType = 'deposit' | 'final_payment' | 'misc';

export type RsvpStatus = 'attending' | 'declined' | 'no_response' | 'maybe';

export type GuestGroup =
  | 'family_bride'
  | 'family_groom'
  | 'friends_bride'
  | 'friends_groom'
  | 'work'
  | 'other';

export type MoodboardCategory =
  | 'dress'
  | 'venue'
  | 'florals'
  | 'colors'
  | 'cake'
  | 'hair_makeup'
  | 'decor'
  | 'other';

export type TimelineCategory =
  | 'getting_ready'
  | 'ceremony'
  | 'photos'
  | 'cocktail_hour'
  | 'reception'
  | 'travel'
  | 'other';

// ─── Database row types ─────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  tier: UserTier;
  role: UserRole;
  onboarding_done: boolean;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  owner_id: string;
  planner_id: string | null;
  client_name: string | null;
  event_type: EventType;
  event_name: string;
  event_date: string | null; // YYYY-MM-DD
  venue_name: string | null;
  guest_count_estimate: number | null;
  total_budget: number | null;
  budget_allocations: Record<ChecklistCategory, number> | null; // JSONB
  currency: string;
  theme_palette: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  category: ChecklistCategory | null;
  months_before: number | null;
  due_date: string | null; // YYYY-MM-DD
  is_completed: boolean;
  completed_at: string | null;
  vendor_id: string | null;
  assigned_to_id: string | null;
  sort_order: number;
  is_custom: boolean;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplate {
  id: string;
  event_type: EventType;
  title: string;
  description: string | null;
  category: ChecklistCategory;
  months_before: number;
  sort_order: number;
}

export interface Vendor {
  id: string;
  event_id: string;
  category: ChecklistCategory;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  status: VendorStatus;
  contract_signed: boolean;
  contract_url: string | null;
  contract_notes: string | null;
  payment_schedule: PaymentMilestone[] | null;
  notes: string | null;
  total_cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  event_id: string;
  vendor_id: string | null;
  category: ChecklistCategory;
  description: string;
  amount: number;
  expense_type: ExpenseType;
  paid_date: string; // YYYY-MM-DD
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface Guest {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  group_tag: GuestGroup | null;
  rsvp_status: RsvpStatus;
  rsvp_date: string | null;
  plus_one: boolean;
  plus_one_name: string | null;
  dietary_notes: string | null;
  table_number: number | null;
  invitation_sent: boolean;
  thank_you_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeddingPartyMember {
  id: string;
  event_id: string;
  name: string;
  role: WeddingPartyRole;
  email: string | null;
  share_code: string;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  event_id: string;
  time: string; // HH:MM 24-hour
  title: string;
  duration_minutes: number;
  category: TimelineCategory;
  location: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MoodboardItem {
  id: string;
  event_id: string;
  image_url: string;
  category: MoodboardCategory;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface CreateMoodboardItemInput {
  event_id: string;
  image_url: string;
  category: MoodboardCategory;
  caption?: string;
  sort_order?: number;
}

export interface CreateTimelineEventInput {
  event_id: string;
  time: string;
  title: string;
  duration_minutes: number;
  category: TimelineCategory;
  location?: string;
  notes?: string;
  sort_order?: number;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AiConversation {
  id: string;
  event_id: string;
  user_id: string;
  messages: AiMessage[];
  created_at: string;
  updated_at: string;
}

// ─── Input types ────────────────────────────────────────────────────────────

export interface CreateEventInput {
  event_type: EventType;
  event_name: string;
  event_date?: string;
  guest_count_estimate?: number;
  total_budget?: number;
}

export interface CreateChecklistItemInput {
  event_id: string;
  title: string;
  description?: string;
  category?: ChecklistCategory;
  due_date?: string;
  vendor_id?: string;
}

export interface CreateVendorInput {
  event_id: string;
  category: ChecklistCategory;
  business_name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  notes?: string;
  total_cost?: number;
}

export interface CreateExpenseInput {
  event_id: string;
  vendor_id?: string;
  category: ChecklistCategory;
  description: string;
  amount: number;
  expense_type: ExpenseType;
  paid_date: string;
  notes?: string;
}

export interface CreateGuestInput {
  event_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  group_tag?: GuestGroup;
  plus_one?: boolean;
  dietary_notes?: string;
  table_number?: number;
}

// ─── Registry ────────────────────────────────────────────────────────────────

export type RegistryStore =
  | 'Zola'
  | 'The Knot'
  | 'Amazon'
  | 'Target'
  | 'Crate & Barrel'
  | 'Williams-Sonoma'
  | 'Pottery Barn'
  | "Bed Bath & Beyond"
  | "Macy's"
  | 'Other';

export interface Registry {
  id: string;
  event_id: string;
  store_name: string;
  url: string;
  notes: string | null;
  created_at: string;
}

export interface CreateRegistryInput {
  event_id: string;
  store_name: string;
  url: string;
  notes?: string;
}

// ─── Song Wishlist ────────────────────────────────────────────────────────────

export type SongMoment =
  | 'processional'
  | 'first_dance'
  | 'father_daughter'
  | 'mother_son'
  | 'cocktail_hour'
  | 'reception'
  | 'last_dance'
  | 'recessional'
  | 'other';

export interface Song {
  id: string;
  event_id: string;
  title: string;
  artist: string | null;
  moment: SongMoment;
  created_at: string;
}

export interface CreateSongInput {
  event_id: string;
  title: string;
  artist?: string;
  moment: SongMoment;
}

// ─── Seating config ───────────────────────────────────────────────────────────

export type TableShape = 'round' | 'rectangular' | 'sweetheart' | 'head';

export interface SeatingTableConfig {
  shape: TableShape;
  name?: string;
}

export type SeatingConfig = Record<string, SeatingTableConfig>; // key = table number string
