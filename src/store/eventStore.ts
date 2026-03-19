import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  Event, ChecklistItem, Vendor, Expense, Guest, AiConversation,
  CreateEventInput, CreateChecklistItemInput, CreateVendorInput,
  CreateExpenseInput, CreateGuestInput,
} from '../types';

interface EventState {
  activeEventId: string | null;
  events: Event[];
  checklistItems: ChecklistItem[];
  vendors: Vendor[];
  expenses: Expense[];
  guests: Guest[];
  aiConversation: AiConversation | null;

  loadingEvents: boolean;
  loadingChecklist: boolean;

  loadEvents: (userId: string) => Promise<void>;
  createEvent: (data: CreateEventInput, userId: string, tier: string) => Promise<{ id?: string; error?: string }>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<{ error?: string }>;
  setActiveEvent: (id: string) => Promise<void>;

  loadChecklist: (eventId: string) => Promise<void>;
  addChecklistItem: (item: CreateChecklistItemInput) => Promise<{ error?: string }>;
  toggleChecklistItem: (id: string) => Promise<void>;
  deleteChecklistItem: (id: string) => Promise<void>;
  seedChecklistFromTemplate: (eventId: string, eventDate: string | null) => Promise<void>;

  loadVendors: (eventId: string) => Promise<void>;
  addVendor: (vendor: CreateVendorInput) => Promise<{ id?: string; error?: string }>;
  updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;

  loadExpenses: (eventId: string) => Promise<void>;
  addExpense: (expense: CreateExpenseInput) => Promise<{ error?: string }>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  loadGuests: (eventId: string) => Promise<void>;
  addGuest: (guest: CreateGuestInput) => Promise<{ error?: string }>;
  updateGuest: (id: string, updates: Partial<Guest>) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;
}

export const useEventStore = create<EventState>((set, get) => ({
  activeEventId: null,
  events: [],
  checklistItems: [],
  vendors: [],
  expenses: [],
  guests: [],
  aiConversation: null,
  loadingEvents: false,
  loadingChecklist: false,

  loadEvents: async (userId) => {
    set({ loadingEvents: true });
    const { data } = await supabase
      .from('events')
      .select('*')
      .or(`owner_id.eq.${userId},planner_id.eq.${userId}`)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });
    set({ events: (data as Event[]) ?? [], loadingEvents: false });
  },

  createEvent: async (data, userId, tier) => {
    const events = get().events;
    if (tier === 'free' && events.length >= 1) return { error: 'upgrade_required' };

    const { data: created, error } = await supabase
      .from('events')
      .insert({ ...data, owner_id: userId })
      .select()
      .single();

    if (error) return { error: error.message };
    set({ events: [created as Event, ...get().events] });
    return { id: created.id };
  },

  updateEvent: async (id, updates) => {
    const { data, error } = await supabase
      .from('events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return { error: error.message };
    set({ events: get().events.map(e => e.id === id ? data as Event : e) });
    if (get().activeEventId === id) {
      // refresh checklist due dates if event_date changed
      if (updates.event_date) await get().loadChecklist(id);
    }
    return {};
  },

  setActiveEvent: async (id) => {
    set({ activeEventId: id });
    await Promise.all([
      get().loadChecklist(id),
      get().loadVendors(id),
      get().loadExpenses(id),
      get().loadGuests(id),
    ]);
  },

  loadChecklist: async (eventId) => {
    set({ loadingChecklist: true });
    const { data } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('event_id', eventId)
      .order('months_before', { ascending: false })
      .order('sort_order', { ascending: true });
    set({ checklistItems: (data as ChecklistItem[]) ?? [], loadingChecklist: false });
  },

  addChecklistItem: async (item) => {
    const { data, error } = await supabase
      .from('checklist_items')
      .insert({ ...item, is_custom: true })
      .select()
      .single();
    if (error) return { error: error.message };
    set({ checklistItems: [...get().checklistItems, data as ChecklistItem] });
    return {};
  },

  toggleChecklistItem: async (id) => {
    const item = get().checklistItems.find(i => i.id === id);
    if (!item) return;
    const newValue = !item.is_completed;
    // Optimistic update
    set({
      checklistItems: get().checklistItems.map(i =>
        i.id === id ? { ...i, is_completed: newValue, completed_at: newValue ? new Date().toISOString() : null } : i
      ),
    });
    const { error } = await supabase
      .from('checklist_items')
      .update({ is_completed: newValue, completed_at: newValue ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      // Roll back
      set({
        checklistItems: get().checklistItems.map(i =>
          i.id === id ? { ...i, is_completed: item.is_completed, completed_at: item.completed_at } : i
        ),
      });
    }
  },

  deleteChecklistItem: async (id) => {
    await supabase.from('checklist_items').delete().eq('id', id);
    set({ checklistItems: get().checklistItems.filter(i => i.id !== id) });
  },

  seedChecklistFromTemplate: async (eventId, eventDate) => {
    const { data: templates } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('event_type', 'wedding')
      .order('months_before', { ascending: false })
      .order('sort_order', { ascending: true });

    if (!templates || templates.length === 0) return;

    const items = templates.map((t: any) => {
      let due_date: string | null = null;
      if (eventDate) {
        const date = new Date(eventDate);
        date.setMonth(date.getMonth() - t.months_before);
        due_date = date.toISOString().split('T')[0];
      }
      return {
        event_id: eventId,
        title: t.title,
        category: t.category,
        months_before: t.months_before,
        due_date,
        sort_order: t.sort_order,
        is_custom: false,
        ai_generated: false,
      };
    });

    const { data } = await supabase.from('checklist_items').insert(items).select();
    if (data) set({ checklistItems: data as ChecklistItem[] });
  },

  loadVendors: async (eventId) => {
    const { data } = await supabase
      .from('vendors')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    set({ vendors: (data as Vendor[]) ?? [] });
  },

  addVendor: async (vendor) => {
    const { data, error } = await supabase.from('vendors').insert(vendor).select().single();
    if (error) return { error: error.message };
    set({ vendors: [data as Vendor, ...get().vendors] });
    return { id: data.id };
  },

  updateVendor: async (id, updates) => {
    const { data } = await supabase
      .from('vendors')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (data) set({ vendors: get().vendors.map(v => v.id === id ? data as Vendor : v) });
  },

  deleteVendor: async (id) => {
    await supabase.from('vendors').delete().eq('id', id);
    set({ vendors: get().vendors.filter(v => v.id !== id) });
  },

  loadExpenses: async (eventId) => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('event_id', eventId)
      .order('paid_date', { ascending: false });
    set({ expenses: (data as Expense[]) ?? [] });
  },

  addExpense: async (expense) => {
    const { data, error } = await supabase.from('expenses').insert(expense).select().single();
    if (error) return { error: error.message };
    set({ expenses: [data as Expense, ...get().expenses] });
    return {};
  },

  updateExpense: async (id, updates) => {
    const { data } = await supabase.from('expenses').update(updates).eq('id', id).select().single();
    if (data) set({ expenses: get().expenses.map(e => e.id === id ? data as Expense : e) });
  },

  deleteExpense: async (id) => {
    await supabase.from('expenses').delete().eq('id', id);
    set({ expenses: get().expenses.filter(e => e.id !== id) });
  },

  loadGuests: async (eventId) => {
    const { data } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', eventId)
      .order('last_name', { ascending: true });
    set({ guests: (data as Guest[]) ?? [] });
  },

  addGuest: async (guest) => {
    const { data, error } = await supabase.from('guests').insert(guest).select().single();
    if (error) return { error: error.message };
    set({ guests: [...get().guests, data as Guest] });
    return {};
  },

  updateGuest: async (id, updates) => {
    const { data } = await supabase
      .from('guests')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (data) set({ guests: get().guests.map(g => g.id === id ? data as Guest : g) });
  },

  deleteGuest: async (id) => {
    await supabase.from('guests').delete().eq('id', id);
    set({ guests: get().guests.filter(g => g.id !== id) });
  },
}));
