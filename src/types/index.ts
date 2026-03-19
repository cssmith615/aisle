// ─── Enums / string literals ───────────────────────────────────────────────

export type UserTier = 'free' | 'premium' | 'pro';
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

export type ExpenseType = 'deposit' | 'final_payment' | 'misc';

export type RsvpStatus = 'attending' | 'declined' | 'no_response' | 'maybe';

export type GuestGroup =
  | 'family_bride'
  | 'family_groom'
  | 'friends_bride'
  | 'friends_groom'
  | 'work'
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
