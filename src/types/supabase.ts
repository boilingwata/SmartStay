export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  smartstay: {
    Tables: {
      amenity_booking_charges: {
        Row: {
          amount: number
          billing_period: string | null
          booking_id: number
          created_at: string
          id: number
          invoice_id: number | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_period?: string | null
          booking_id: number
          created_at?: string
          id?: number
          invoice_id?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_period?: string | null
          booking_id?: number
          created_at?: string
          id?: number
          invoice_id?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amenity_booking_charges_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "amenity_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_booking_charges_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      amenity_booking_checkins: {
        Row: {
          booking_id: number
          checked_in_at: string | null
          checked_in_by: string | null
          checked_out_at: string | null
          checked_out_by: string | null
          created_at: string
          id: number
          note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: number
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string | null
          checked_out_by?: string | null
          created_at?: string
          id?: number
          note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: number
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string | null
          checked_out_by?: string | null
          created_at?: string
          id?: number
          note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amenity_booking_checkins_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "amenity_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_booking_checkins_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_booking_checkins_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_booking_checkins_checked_out_by_fkey"
            columns: ["checked_out_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_booking_checkins_checked_out_by_fkey"
            columns: ["checked_out_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      amenity_booking_exceptions: {
        Row: {
          amenity_id: number | null
          building_id: number | null
          created_at: string
          created_by: string | null
          end_at: string
          exception_type: string
          id: number
          is_active: boolean
          override_json: Json
          policy_id: number | null
          reason: string | null
          room_id: number | null
          service_id: number | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          amenity_id?: number | null
          building_id?: number | null
          created_at?: string
          created_by?: string | null
          end_at: string
          exception_type: string
          id?: number
          is_active?: boolean
          override_json?: Json
          policy_id?: number | null
          reason?: string | null
          room_id?: number | null
          service_id?: number | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          amenity_id?: number | null
          building_id?: number | null
          created_at?: string
          created_by?: string | null
          end_at?: string
          exception_type?: string
          id?: number
          is_active?: boolean
          override_json?: Json
          policy_id?: number | null
          reason?: string | null
          room_id?: number | null
          service_id?: number | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amenity_booking_exceptions_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenity_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_booking_exceptions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_booking_exceptions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "amenity_booking_exceptions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "amenity_booking_exceptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_booking_exceptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_booking_exceptions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "amenity_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_booking_exceptions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "amenity_booking_exceptions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_booking_exceptions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_booking_exceptions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      amenity_bookings: {
        Row: {
          amenity_id: number | null
          amount: number
          booking_date: string
          building_id: number | null
          created_at: string
          created_by: string | null
          id: number
          note: string | null
          party_size: number
          policy_id: number | null
          room_id: number | null
          service_id: number | null
          slot_end_at: string | null
          slot_start_at: string | null
          status: string
          tenant_id: number
          time_slot: string
          updated_at: string
        }
        Insert: {
          amenity_id?: number | null
          amount?: number
          booking_date: string
          building_id?: number | null
          created_at?: string
          created_by?: string | null
          id?: number
          note?: string | null
          party_size?: number
          policy_id?: number | null
          room_id?: number | null
          service_id?: number | null
          slot_end_at?: string | null
          slot_start_at?: string | null
          status?: string
          tenant_id: number
          time_slot: string
          updated_at?: string
        }
        Update: {
          amenity_id?: number | null
          amount?: number
          booking_date?: string
          building_id?: number | null
          created_at?: string
          created_by?: string | null
          id?: number
          note?: string | null
          party_size?: number
          policy_id?: number | null
          room_id?: number | null
          service_id?: number | null
          slot_end_at?: string | null
          slot_start_at?: string | null
          status?: string
          tenant_id?: number
          time_slot?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amenity_bookings_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenity_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "amenity_bookings_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "amenity_bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "amenity_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "amenity_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      amenity_catalog: {
        Row: {
          building_id: number | null
          code: string
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          is_deleted: boolean
          legacy_service_id: number | null
          name: string
          updated_at: string
        }
        Insert: {
          building_id?: number | null
          code: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          legacy_service_id?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          building_id?: number | null
          code?: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          legacy_service_id?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amenity_catalog_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_catalog_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "amenity_catalog_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "amenity_catalog_legacy_service_id_fkey"
            columns: ["legacy_service_id"]
            isOneToOne: true
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      amenity_policies: {
        Row: {
          active_from: string
          active_to: string | null
          allow_waitlist: boolean
          amenity_id: number | null
          approved_at: string | null
          approved_by: string | null
          auto_complete_after_minutes: number
          booking_mode: string
          building_id: number | null
          cancellation_cutoff_hours: number
          charge_mode: string
          code: string
          created_at: string
          created_by: string | null
          current_version_no: number
          deleted_at: string | null
          id: number
          max_advance_days: number
          max_capacity_per_slot: number
          name: string
          notes: string | null
          price_override_amount: number | null
          requires_checkin: boolean
          requires_staff_approval: boolean
          rules_json: Json
          service_id: number | null
          slot_granularity_minutes: number
          status: string
          updated_at: string
        }
        Insert: {
          active_from?: string
          active_to?: string | null
          allow_waitlist?: boolean
          amenity_id?: number | null
          approved_at?: string | null
          approved_by?: string | null
          auto_complete_after_minutes?: number
          booking_mode?: string
          building_id?: number | null
          cancellation_cutoff_hours?: number
          charge_mode?: string
          code: string
          created_at?: string
          created_by?: string | null
          current_version_no?: number
          deleted_at?: string | null
          id?: number
          max_advance_days?: number
          max_capacity_per_slot?: number
          name: string
          notes?: string | null
          price_override_amount?: number | null
          requires_checkin?: boolean
          requires_staff_approval?: boolean
          rules_json?: Json
          service_id?: number | null
          slot_granularity_minutes?: number
          status?: string
          updated_at?: string
        }
        Update: {
          active_from?: string
          active_to?: string | null
          allow_waitlist?: boolean
          amenity_id?: number | null
          approved_at?: string | null
          approved_by?: string | null
          auto_complete_after_minutes?: number
          booking_mode?: string
          building_id?: number | null
          cancellation_cutoff_hours?: number
          charge_mode?: string
          code?: string
          created_at?: string
          created_by?: string | null
          current_version_no?: number
          deleted_at?: string | null
          id?: number
          max_advance_days?: number
          max_capacity_per_slot?: number
          name?: string
          notes?: string | null
          price_override_amount?: number | null
          requires_checkin?: boolean
          requires_staff_approval?: boolean
          rules_json?: Json
          service_id?: number | null
          slot_granularity_minutes?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amenity_policies_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenity_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_policies_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_policies_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_policies_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_policies_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "amenity_policies_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "amenity_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_policies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      amenity_policy_notifications: {
        Row: {
          audience_scope: string
          channel: string
          created_at: string
          created_by: string | null
          id: number
          message: string
          payload_json: Json
          policy_id: number
          sent_at: string | null
          status: string
          title: string
          version_id: number | null
        }
        Insert: {
          audience_scope?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: number
          message: string
          payload_json?: Json
          policy_id: number
          sent_at?: string | null
          status?: string
          title: string
          version_id?: number | null
        }
        Update: {
          audience_scope?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: number
          message?: string
          payload_json?: Json
          policy_id?: number
          sent_at?: string | null
          status?: string
          title?: string
          version_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "amenity_policy_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_policy_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_policy_notifications_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "amenity_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_policy_notifications_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "amenity_policy_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      amenity_policy_versions: {
        Row: {
          change_summary: string | null
          change_type: string
          created_at: string
          id: number
          policy_id: number
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          snapshot_json: Json
          status: string
          submitted_at: string
          submitted_by: string | null
          version_no: number
        }
        Insert: {
          change_summary?: string | null
          change_type?: string
          created_at?: string
          id?: number
          policy_id: number
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          snapshot_json?: Json
          status?: string
          submitted_at?: string
          submitted_by?: string | null
          version_no: number
        }
        Update: {
          change_summary?: string | null
          change_type?: string
          created_at?: string
          id?: number
          policy_id?: number
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          snapshot_json?: Json
          status?: string
          submitted_at?: string
          submitted_by?: string | null
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "amenity_policy_versions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "amenity_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_policy_versions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_policy_versions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_policy_versions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amenity_policy_versions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          building_ids: number[]
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_pinned: boolean
          publish_at: string | null
          status: string
          target_groups: string[]
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          building_ids?: number[]
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean
          publish_at?: string | null
          status?: string
          target_groups?: string[]
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          building_ids?: number[]
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean
          publish_at?: string | null
          status?: string
          target_groups?: string[]
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string | null
          depreciation_years: number | null
          description: string | null
          id: number
          model: string | null
          name: string
          qr_code: string | null
          supplier: string | null
          unit_cost: number | null
          updated_at: string | null
          warranty_months: number | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          depreciation_years?: number | null
          description?: string | null
          id?: number
          model?: string | null
          name: string
          qr_code?: string | null
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          warranty_months?: number | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          depreciation_years?: number | null
          description?: string | null
          id?: number
          model?: string | null
          name?: string
          qr_code?: string | null
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          warranty_months?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: number
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: number
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: number
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_history: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          balance_id: number
          created_at: string | null
          created_by: string | null
          id: number
          invoice_id: number | null
          notes: string | null
          payment_id: number | null
          tenant_id: number
          transaction_type: Database["smartstay"]["Enums"]["balance_transaction_type"]
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          balance_id: number
          created_at?: string | null
          created_by?: string | null
          id?: number
          invoice_id?: number | null
          notes?: string | null
          payment_id?: number | null
          tenant_id: number
          transaction_type: Database["smartstay"]["Enums"]["balance_transaction_type"]
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          balance_id?: number
          created_at?: string | null
          created_by?: string | null
          id?: number
          invoice_id?: number | null
          notes?: string | null
          payment_id?: number | null
          tenant_id?: number
          transaction_type?: Database["smartstay"]["Enums"]["balance_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "balance_history_balance_id_fkey"
            columns: ["balance_id"]
            isOneToOne: false
            referencedRelation: "tenant_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_history_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_runs: {
        Row: {
          billing_period: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_json: Json
          id: number
          lock_version: number
          notes: string | null
          started_at: string | null
          status: Database["smartstay"]["Enums"]["billing_run_status"]
          summary_json: Json
          updated_at: string
        }
        Insert: {
          billing_period: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_json?: Json
          id?: number
          lock_version?: number
          notes?: string | null
          started_at?: string | null
          status?: Database["smartstay"]["Enums"]["billing_run_status"]
          summary_json?: Json
          updated_at?: string
        }
        Update: {
          billing_period?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_json?: Json
          id?: number
          lock_version?: number
          notes?: string | null
          started_at?: string | null
          status?: Database["smartstay"]["Enums"]["billing_run_status"]
          summary_json?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      building_images: {
        Row: {
          building_id: number
          created_at: string
          id: number
          is_main: boolean
          sort_order: number
          url: string
        }
        Insert: {
          building_id: number
          created_at?: string
          id?: number
          is_main?: boolean
          sort_order?: number
          url: string
        }
        Update: {
          building_id?: number
          created_at?: string
          id?: number
          is_main?: boolean
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_images_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_images_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "building_images_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["building_id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string
          amenities: Json | null
          created_at: string | null
          description: string | null
          electricity_provider: string | null
          fire_cert_expiry: string | null
          id: number
          is_deleted: boolean | null
          last_maintenance_date: string | null
          latitude: number | null
          longitude: number | null
          name: string
          opening_date: string | null
          owner_id: string | null
          province: string | null
          search_vector: unknown
          total_floors: number | null
          updated_at: string | null
          uuid: string
          water_provider: string | null
        }
        Insert: {
          address: string
          amenities?: Json | null
          created_at?: string | null
          description?: string | null
          electricity_provider?: string | null
          fire_cert_expiry?: string | null
          id?: number
          is_deleted?: boolean | null
          last_maintenance_date?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_date?: string | null
          owner_id?: string | null
          province?: string | null
          search_vector?: unknown
          total_floors?: number | null
          updated_at?: string | null
          uuid?: string
          water_provider?: string | null
        }
        Update: {
          address?: string
          amenities?: Json | null
          created_at?: string | null
          description?: string | null
          electricity_provider?: string | null
          fire_cert_expiry?: string | null
          id?: number
          is_deleted?: boolean | null
          last_maintenance_date?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_date?: string | null
          owner_id?: string | null
          province?: string | null
          search_vector?: unknown
          total_floors?: number | null
          updated_at?: string | null
          uuid?: string
          water_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buildings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_addendums: {
        Row: {
          addendum_code: string | null
          addendum_type: string
          approved_by: string | null
          content: string | null
          contract_id: number
          created_at: string
          created_by: string | null
          effective_date: string
          id: number
          parent_addendum_id: number | null
          signed_at: string | null
          signed_file_url: string | null
          source_type: string
          status: string
          summary_json: Json
          title: string
          updated_at: string
          version_no: number
        }
        Insert: {
          addendum_code?: string | null
          addendum_type?: string
          approved_by?: string | null
          content?: string | null
          contract_id: number
          created_at?: string
          created_by?: string | null
          effective_date: string
          id?: number
          parent_addendum_id?: number | null
          signed_at?: string | null
          signed_file_url?: string | null
          source_type?: string
          status?: string
          summary_json?: Json
          title: string
          updated_at?: string
          version_no?: number
        }
        Update: {
          addendum_code?: string | null
          addendum_type?: string
          approved_by?: string | null
          content?: string | null
          contract_id?: number
          created_at?: string
          created_by?: string | null
          effective_date?: string
          id?: number
          parent_addendum_id?: number | null
          signed_at?: string | null
          signed_file_url?: string | null
          source_type?: string
          status?: string
          summary_json?: Json
          title?: string
          updated_at?: string
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_addendums_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_addendums_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_addendums_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_addendums_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_addendums_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_addendums_parent_addendum_id_fkey"
            columns: ["parent_addendum_id"]
            isOneToOne: false
            referencedRelation: "contract_addendums"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_renewals: {
        Row: {
          contract_id: number
          created_at: string | null
          id: number
          new_end_date: string
          new_monthly_rent: number
          previous_end_date: string
          reason: string | null
          renewed_by: string | null
        }
        Insert: {
          contract_id: number
          created_at?: string | null
          id?: number
          new_end_date: string
          new_monthly_rent: number
          previous_end_date: string
          reason?: string | null
          renewed_by?: string | null
        }
        Update: {
          contract_id?: number
          created_at?: string | null
          id?: number
          new_end_date?: string
          new_monthly_rent?: number
          previous_end_date?: string
          reason?: string | null
          renewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_renewals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_renewals_renewed_by_fkey"
            columns: ["renewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_renewals_renewed_by_fkey"
            columns: ["renewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_services: {
        Row: {
          contract_id: number
          created_at: string | null
          fixed_price: number
          id: number
          quantity: number | null
          service_catalog_id: number | null
          service_id: number | null
        }
        Insert: {
          contract_id: number
          created_at?: string | null
          fixed_price: number
          id?: number
          quantity?: number | null
          service_catalog_id?: number | null
          service_id?: number | null
        }
        Update: {
          contract_id?: number
          created_at?: string | null
          fixed_price?: number
          id?: number
          quantity?: number | null
          service_catalog_id?: number | null
          service_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_services_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_services_service_catalog_id_fkey"
            columns: ["service_catalog_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_tenants: {
        Row: {
          contract_id: number
          created_at: string | null
          id: number
          is_primary: boolean | null
          tenant_id: number
        }
        Insert: {
          contract_id: number
          created_at?: string | null
          id?: number
          is_primary?: boolean | null
          tenant_id: number
        }
        Update: {
          contract_id?: number
          created_at?: string | null
          id?: number
          is_primary?: boolean | null
          tenant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_tenants_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_terminations: {
        Row: {
          additional_charges: number | null
          contract_id: number
          created_at: string | null
          deposit_refunded: number | null
          deposit_used: number | null
          final_invoice_amount: number | null
          final_invoice_id: number | null
          id: number
          processed_by: string | null
          reason: string | null
        }
        Insert: {
          additional_charges?: number | null
          contract_id: number
          created_at?: string | null
          deposit_refunded?: number | null
          deposit_used?: number | null
          final_invoice_amount?: number | null
          final_invoice_id?: number | null
          id?: number
          processed_by?: string | null
          reason?: string | null
        }
        Update: {
          additional_charges?: number | null
          contract_id?: number
          created_at?: string | null
          deposit_refunded?: number | null
          deposit_used?: number | null
          final_invoice_amount?: number | null
          final_invoice_id?: number | null
          id?: number
          processed_by?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_terminations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_terminations_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_terminations_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_termination_invoice"
            columns: ["final_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_transfers: {
        Row: {
          approved_by: string | null
          carry_over_deposit_amount: number
          created_at: string
          deposit_mode: string
          from_tenant_id: number
          id: number
          new_contract_id: number
          note: string | null
          old_contract_id: number
          room_id: number
          status: Database["smartstay"]["Enums"]["contract_transfer_status"]
          to_tenant_id: number
          transfer_date: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          carry_over_deposit_amount?: number
          created_at?: string
          deposit_mode?: string
          from_tenant_id: number
          id?: number
          new_contract_id: number
          note?: string | null
          old_contract_id: number
          room_id: number
          status?: Database["smartstay"]["Enums"]["contract_transfer_status"]
          to_tenant_id: number
          transfer_date: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          carry_over_deposit_amount?: number
          created_at?: string
          deposit_mode?: string
          from_tenant_id?: number
          id?: number
          new_contract_id?: number
          note?: string | null
          old_contract_id?: number
          room_id?: number
          status?: Database["smartstay"]["Enums"]["contract_transfer_status"]
          to_tenant_id?: number
          transfer_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_transfers_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_transfers_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_transfers_from_tenant_id_fkey"
            columns: ["from_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_transfers_new_contract_id_fkey"
            columns: ["new_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_transfers_old_contract_id_fkey"
            columns: ["old_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_transfers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "contract_transfers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_transfers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_transfers_to_tenant_id_fkey"
            columns: ["to_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          approved_by: string | null
          contract_code: string
          created_at: string | null
          created_by: string | null
          deposit_amount: number | null
          deposit_note: string | null
          deposit_status:
            | Database["smartstay"]["Enums"]["deposit_status"]
            | null
          end_date: string
          id: number
          is_deleted: boolean | null
          linked_contract_id: number | null
          monthly_rent: number
          notice_period_days: number
          occupants_for_billing: number
          payment_cycle_months: number
          payment_due_day: number
          primary_tenant_id: number | null
          room_id: number
          signed_at: string | null
          signed_file_url: string | null
          signing_date: string | null
          start_date: string
          status: Database["smartstay"]["Enums"]["contract_status"] | null
          terminated_at: string | null
          termination_reason: string | null
          terms: Json | null
          updated_at: string | null
          utility_billing_type: string | null
          utility_policy_id: number | null
          uuid: string
        }
        Insert: {
          approved_by?: string | null
          contract_code?: string
          created_at?: string | null
          created_by?: string | null
          deposit_amount?: number | null
          deposit_note?: string | null
          deposit_status?:
            | Database["smartstay"]["Enums"]["deposit_status"]
            | null
          end_date: string
          id?: number
          is_deleted?: boolean | null
          linked_contract_id?: number | null
          monthly_rent: number
          notice_period_days?: number
          occupants_for_billing?: number
          payment_cycle_months?: number
          payment_due_day?: number
          primary_tenant_id?: number | null
          room_id: number
          signed_at?: string | null
          signed_file_url?: string | null
          signing_date?: string | null
          start_date: string
          status?: Database["smartstay"]["Enums"]["contract_status"] | null
          terminated_at?: string | null
          termination_reason?: string | null
          terms?: Json | null
          updated_at?: string | null
          utility_billing_type?: string | null
          utility_policy_id?: number | null
          uuid?: string
        }
        Update: {
          approved_by?: string | null
          contract_code?: string
          created_at?: string | null
          created_by?: string | null
          deposit_amount?: number | null
          deposit_note?: string | null
          deposit_status?:
            | Database["smartstay"]["Enums"]["deposit_status"]
            | null
          end_date?: string
          id?: number
          is_deleted?: boolean | null
          linked_contract_id?: number | null
          monthly_rent?: number
          notice_period_days?: number
          occupants_for_billing?: number
          payment_cycle_months?: number
          payment_due_day?: number
          primary_tenant_id?: number | null
          room_id?: number
          signed_at?: string | null
          signed_file_url?: string | null
          signing_date?: string | null
          start_date?: string
          status?: Database["smartstay"]["Enums"]["contract_status"] | null
          terminated_at?: string | null
          termination_reason?: string | null
          terms?: Json | null
          updated_at?: string | null
          utility_billing_type?: string | null
          utility_policy_id?: number | null
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_linked_contract_id_fkey"
            columns: ["linked_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_primary_tenant_id_fkey"
            columns: ["primary_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "contracts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_utility_policy_id_fkey"
            columns: ["utility_policy_id"]
            isOneToOne: false
            referencedRelation: "utility_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_asset_snapshots: {
        Row: {
          current_condition_score: number
          handover_id: number
          id: number
          note: string | null
          previous_condition_score: number | null
          room_asset_id: number
        }
        Insert: {
          current_condition_score: number
          handover_id: number
          id?: never
          note?: string | null
          previous_condition_score?: number | null
          room_asset_id: number
        }
        Update: {
          current_condition_score?: number
          handover_id?: number
          id?: never
          note?: string | null
          previous_condition_score?: number | null
          room_asset_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "handover_asset_snapshots_handover_id_fkey"
            columns: ["handover_id"]
            isOneToOne: false
            referencedRelation: "handover_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_asset_snapshots_room_asset_id_fkey"
            columns: ["room_asset_id"]
            isOneToOne: false
            referencedRelation: "room_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_asset_snapshots_room_asset_id_fkey"
            columns: ["room_asset_id"]
            isOneToOne: false
            referencedRelation: "vw_room_assets_warranty"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_checklists: {
        Row: {
          contract_id: number | null
          created_at: string | null
          handover_type: Database["smartstay"]["Enums"]["handover_type"]
          id: number
          manager_signature: string | null
          notes: string | null
          performed_at: string | null
          performed_by: string
          room_id: number
          tenant_id: string | null
          tenant_signature: string | null
          updated_at: string | null
          uuid: string | null
        }
        Insert: {
          contract_id?: number | null
          created_at?: string | null
          handover_type: Database["smartstay"]["Enums"]["handover_type"]
          id?: never
          manager_signature?: string | null
          notes?: string | null
          performed_at?: string | null
          performed_by: string
          room_id: number
          tenant_id?: string | null
          tenant_signature?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Update: {
          contract_id?: number | null
          created_at?: string | null
          handover_type?: Database["smartstay"]["Enums"]["handover_type"]
          id?: never
          manager_signature?: string | null
          notes?: string | null
          performed_at?: string | null
          performed_by?: string
          room_id?: number
          tenant_id?: string | null
          tenant_signature?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handover_checklists_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_checklists_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "handover_checklists_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_checklists_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_items: {
        Row: {
          category: string
          handover_id: number
          id: number
          item_name: string
          note: string | null
          photo_urls: string[] | null
          status: string
        }
        Insert: {
          category: string
          handover_id: number
          id?: never
          item_name: string
          note?: string | null
          photo_urls?: string[] | null
          status: string
        }
        Update: {
          category?: string
          handover_id?: number
          id?: never
          item_name?: string
          note?: string | null
          photo_urls?: string[] | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "handover_items_handover_id_fkey"
            columns: ["handover_id"]
            isOneToOne: false
            referencedRelation: "handover_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: number
          invoice_id: number
          item_type: string
          line_total: number
          quantity: number | null
          sort_order: number | null
          source_ref_id: number | null
          source_ref_type: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: number
          invoice_id: number
          item_type?: string
          line_total: number
          quantity?: number | null
          sort_order?: number | null
          source_ref_id?: number | null
          source_ref_type?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: number
          invoice_id?: number
          item_type?: string
          line_total?: number
          quantity?: number | null
          sort_order?: number | null
          source_ref_id?: number | null
          source_ref_type?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_utility_overrides: {
        Row: {
          billing_period: string
          contract_id: number
          created_at: string
          created_by: string | null
          electric_base_override: number | null
          electric_final_override: number | null
          electric_hot_season_multiplier_override: number | null
          id: number
          invoice_id: number | null
          location_multiplier_override: number | null
          new_values_json: Json
          occupants_for_billing_override: number | null
          old_values_json: Json
          reason: string
          season_months_override: Json | null
          updated_at: string
          water_base_override: number | null
          water_final_override: number | null
        }
        Insert: {
          billing_period: string
          contract_id: number
          created_at?: string
          created_by?: string | null
          electric_base_override?: number | null
          electric_final_override?: number | null
          electric_hot_season_multiplier_override?: number | null
          id?: number
          invoice_id?: number | null
          location_multiplier_override?: number | null
          new_values_json?: Json
          occupants_for_billing_override?: number | null
          old_values_json?: Json
          reason: string
          season_months_override?: Json | null
          updated_at?: string
          water_base_override?: number | null
          water_final_override?: number | null
        }
        Update: {
          billing_period?: string
          contract_id?: number
          created_at?: string
          created_by?: string | null
          electric_base_override?: number | null
          electric_final_override?: number | null
          electric_hot_season_multiplier_override?: number | null
          id?: number
          invoice_id?: number | null
          location_multiplier_override?: number | null
          new_values_json?: Json
          occupants_for_billing_override?: number | null
          old_values_json?: Json
          reason?: string
          season_months_override?: Json | null
          updated_at?: string
          water_base_override?: number | null
          water_final_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_utility_overrides_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_utility_overrides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_utility_overrides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_utility_overrides_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_utility_snapshots: {
        Row: {
          billing_period: string
          billing_run_id: number | null
          contract_id: number
          created_at: string
          days_in_period: number
          electric_base_amount: number
          electric_device_surcharge: number
          electric_final_amount: number
          electric_location_multiplier: number
          electric_raw_amount: number
          electric_rounded_amount: number
          electric_season_multiplier: number
          electric_subtotal: number
          formula_snapshot_json: Json
          id: number
          invoice_id: number
          min_electric_floor: number
          min_water_floor: number
          occupants_for_billing: number
          occupied_days: number
          override_id: number | null
          period_end: string
          period_start: string
          policy_source_type: string
          prorate_ratio: number
          resolved_device_surcharges_json: Json
          resolved_policy_id: number | null
          room_id: number
          rounding_increment: number
          warnings_json: Json
          water_base_amount: number
          water_final_amount: number
          water_location_multiplier: number
          water_per_person_amount: number
          water_person_charge: number
          water_raw_amount: number
          water_rounded_amount: number
          water_subtotal: number
        }
        Insert: {
          billing_period: string
          billing_run_id?: number | null
          contract_id: number
          created_at?: string
          days_in_period: number
          electric_base_amount?: number
          electric_device_surcharge?: number
          electric_final_amount?: number
          electric_location_multiplier?: number
          electric_raw_amount?: number
          electric_rounded_amount?: number
          electric_season_multiplier?: number
          electric_subtotal?: number
          formula_snapshot_json?: Json
          id?: number
          invoice_id: number
          min_electric_floor?: number
          min_water_floor?: number
          occupants_for_billing: number
          occupied_days: number
          override_id?: number | null
          period_end: string
          period_start: string
          policy_source_type: string
          prorate_ratio: number
          resolved_device_surcharges_json?: Json
          resolved_policy_id?: number | null
          room_id: number
          rounding_increment?: number
          warnings_json?: Json
          water_base_amount?: number
          water_final_amount?: number
          water_location_multiplier?: number
          water_per_person_amount?: number
          water_person_charge?: number
          water_raw_amount?: number
          water_rounded_amount?: number
          water_subtotal?: number
        }
        Update: {
          billing_period?: string
          billing_run_id?: number | null
          contract_id?: number
          created_at?: string
          days_in_period?: number
          electric_base_amount?: number
          electric_device_surcharge?: number
          electric_final_amount?: number
          electric_location_multiplier?: number
          electric_raw_amount?: number
          electric_rounded_amount?: number
          electric_season_multiplier?: number
          electric_subtotal?: number
          formula_snapshot_json?: Json
          id?: number
          invoice_id?: number
          min_electric_floor?: number
          min_water_floor?: number
          occupants_for_billing?: number
          occupied_days?: number
          override_id?: number | null
          period_end?: string
          period_start?: string
          policy_source_type?: string
          prorate_ratio?: number
          resolved_device_surcharges_json?: Json
          resolved_policy_id?: number | null
          room_id?: number
          rounding_increment?: number
          warnings_json?: Json
          water_base_amount?: number
          water_final_amount?: number
          water_location_multiplier?: number
          water_per_person_amount?: number
          water_person_charge?: number
          water_raw_amount?: number
          water_rounded_amount?: number
          water_subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_utility_snapshots_billing_run_id_fkey"
            columns: ["billing_run_id"]
            isOneToOne: false
            referencedRelation: "billing_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_utility_snapshots_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_utility_snapshots_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: true
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_utility_snapshots_override_id_fkey"
            columns: ["override_id"]
            isOneToOne: false
            referencedRelation: "invoice_utility_overrides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_utility_snapshots_resolved_policy_id_fkey"
            columns: ["resolved_policy_id"]
            isOneToOne: false
            referencedRelation: "utility_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_utility_snapshots_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "invoice_utility_snapshots_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_utility_snapshots_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          balance_due: number | null
          billing_period: string | null
          contract_id: number
          created_at: string | null
          due_date: string | null
          id: number
          invoice_code: string
          notes: string | null
          paid_date: string | null
          status: Database["smartstay"]["Enums"]["invoice_status"] | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
          uuid: string
        }
        Insert: {
          amount_paid?: number | null
          balance_due?: number | null
          billing_period?: string | null
          contract_id: number
          created_at?: string | null
          due_date?: string | null
          id?: number
          invoice_code?: string
          notes?: string | null
          paid_date?: string | null
          status?: Database["smartstay"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
          uuid?: string
        }
        Update: {
          amount_paid?: number | null
          balance_due?: number | null
          billing_period?: string | null
          contract_id?: number
          created_at?: string | null
          due_date?: string | null
          id?: number
          invoice_code?: string
          notes?: string | null
          paid_date?: string | null
          status?: Database["smartstay"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          attachments: Json | null
          cost: number | null
          created_at: string | null
          id: number
          issue_description: string | null
          maintenance_date: string
          next_maintenance_date: string | null
          performed_by: string | null
          room_asset_id: number
        }
        Insert: {
          attachments?: Json | null
          cost?: number | null
          created_at?: string | null
          id?: number
          issue_description?: string | null
          maintenance_date?: string
          next_maintenance_date?: string | null
          performed_by?: string | null
          room_asset_id: number
        }
        Update: {
          attachments?: Json | null
          cost?: number | null
          created_at?: string | null
          id?: number
          issue_description?: string | null
          maintenance_date?: string
          next_maintenance_date?: string | null
          performed_by?: string | null
          room_asset_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_room_asset_id_fkey"
            columns: ["room_asset_id"]
            isOneToOne: false
            referencedRelation: "room_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_room_asset_id_fkey"
            columns: ["room_asset_id"]
            isOneToOne: false
            referencedRelation: "vw_room_assets_warranty"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_read: boolean
          link: string | null
          message: string
          metadata: Json | null
          profile_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          metadata?: Json | null
          profile_id: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          metadata?: Json | null
          profile_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          joined_at: string | null
          member_role: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string | null
          member_role?: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string | null
          member_role?: string
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_feature_flags: {
        Row: {
          enabled: boolean
          flag_key: string
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          flag_key: string
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          flag_key?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organization_feature_flags_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          plan_id: string | null
          primary_owner_id: string | null
          slug: string
          status: string
          suspended_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          plan_id?: string | null
          primary_owner_id?: string | null
          slug: string
          status?: string
          suspended_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          plan_id?: string | null
          primary_owner_id?: string | null
          slug?: string
          status?: string
          suspended_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_primary_owner_id_fkey"
            columns: ["primary_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_attempts: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          bank_name: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          gateway_order_id: string | null
          gateway_payload: Json
          gateway_request_id: string | null
          gateway_transaction_id: string | null
          id: number
          idempotency_key: string | null
          initiated_by: string | null
          invoice_id: number
          method: Database["smartstay"]["Enums"]["payment_attempt_method"]
          notes: string | null
          payment_id: number | null
          receipt_url: string | null
          reference_number: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: Database["smartstay"]["Enums"]["payment_status"]
          updated_at: string
          uuid: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          bank_name?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          gateway_order_id?: string | null
          gateway_payload?: Json
          gateway_request_id?: string | null
          gateway_transaction_id?: string | null
          id?: number
          idempotency_key?: string | null
          initiated_by?: string | null
          invoice_id: number
          method: Database["smartstay"]["Enums"]["payment_attempt_method"]
          notes?: string | null
          payment_id?: number | null
          receipt_url?: string | null
          reference_number?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: Database["smartstay"]["Enums"]["payment_status"]
          updated_at?: string
          uuid?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_name?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          gateway_order_id?: string | null
          gateway_payload?: Json
          gateway_request_id?: string | null
          gateway_transaction_id?: string | null
          id?: number
          idempotency_key?: string | null
          initiated_by?: string | null
          invoice_id?: number
          method?: Database["smartstay"]["Enums"]["payment_attempt_method"]
          notes?: string | null
          payment_id?: number | null
          receipt_url?: string | null
          reference_number?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: Database["smartstay"]["Enums"]["payment_status"]
          updated_at?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          applied_at: string | null
          applied_by: string | null
          bank_name: string | null
          confirmation_source: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          id: number
          invoice_id: number
          method: Database["smartstay"]["Enums"]["payment_method"]
          notes: string | null
          payment_attempt_id: number | null
          payment_code: string
          payment_date: string
          receipt_url: string | null
          reference_number: string | null
          status: Database["smartstay"]["Enums"]["payment_status"]
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          uuid: string
        }
        Insert: {
          amount: number
          applied_at?: string | null
          applied_by?: string | null
          bank_name?: string | null
          confirmation_source?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          id?: number
          invoice_id: number
          method: Database["smartstay"]["Enums"]["payment_method"]
          notes?: string | null
          payment_attempt_id?: number | null
          payment_code?: string
          payment_date?: string
          receipt_url?: string | null
          reference_number?: string | null
          status?: Database["smartstay"]["Enums"]["payment_status"]
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          uuid?: string
        }
        Update: {
          amount?: number
          applied_at?: string | null
          applied_by?: string | null
          bank_name?: string | null
          confirmation_source?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          id?: number
          invoice_id?: number
          method?: Database["smartstay"]["Enums"]["payment_method"]
          notes?: string | null
          payment_attempt_id?: number | null
          payment_code?: string
          payment_date?: string
          receipt_url?: string | null
          reference_number?: string | null
          status?: Database["smartstay"]["Enums"]["payment_status"]
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_attempt_id_fkey"
            columns: ["payment_attempt_id"]
            isOneToOne: false
            referencedRelation: "payment_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string | null
          group_name: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          group_name?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          group_name?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string
          gender: Database["smartstay"]["Enums"]["gender_type"] | null
          id: string
          identity_number: string | null
          is_active: boolean | null
          organization_id: string | null
          phone: string | null
          preferences: Json | null
          role: Database["smartstay"]["Enums"]["user_role"]
          role_id: string | null
          tenant_stage: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name: string
          gender?: Database["smartstay"]["Enums"]["gender_type"] | null
          id: string
          identity_number?: string | null
          is_active?: boolean | null
          organization_id?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["smartstay"]["Enums"]["user_role"]
          role_id?: string | null
          tenant_stage?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string
          gender?: Database["smartstay"]["Enums"]["gender_type"] | null
          id?: string
          identity_number?: string | null
          is_active?: boolean | null
          organization_id?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["smartstay"]["Enums"]["user_role"]
          role_id?: string | null
          tenant_stage?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_applications: {
        Row: {
          created_at: string
          id: number
          notes: string | null
          profile_id: string
          reviewed_at: string | null
          room_id: number
          status: string
          submitted_at: string | null
          updated_at: string
          uuid: string
          verification_method: string | null
          verification_payload: Json
        }
        Insert: {
          created_at?: string
          id?: number
          notes?: string | null
          profile_id: string
          reviewed_at?: string | null
          room_id: number
          status?: string
          submitted_at?: string | null
          updated_at?: string
          uuid?: string
          verification_method?: string | null
          verification_payload?: Json
        }
        Update: {
          created_at?: string
          id?: number
          notes?: string | null
          profile_id?: string
          reviewed_at?: string | null
          room_id?: number
          status?: string
          submitted_at?: string | null
          updated_at?: string
          uuid?: string
          verification_method?: string | null
          verification_payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "rental_applications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_applications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_applications_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "rental_applications_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_applications_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      room_assets: {
        Row: {
          asset_id: number
          assigned_at: string | null
          billing_end_date: string | null
          billing_label: string | null
          billing_notes: string | null
          billing_start_date: string | null
          billing_status: string
          broken_reported_at: string | null
          condition_score: number | null
          created_at: string | null
          id: number
          is_billable: boolean
          last_maintenance: string | null
          location_notes: string | null
          maintenance_interval_months: number | null
          monthly_charge: number
          purchase_date: string | null
          quantity: number | null
          removed_at: string | null
          room_id: number | null
          serial_number: string | null
          status: Database["smartstay"]["Enums"]["asset_status"] | null
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          asset_id: number
          assigned_at?: string | null
          billing_end_date?: string | null
          billing_label?: string | null
          billing_notes?: string | null
          billing_start_date?: string | null
          billing_status?: string
          broken_reported_at?: string | null
          condition_score?: number | null
          created_at?: string | null
          id?: number
          is_billable?: boolean
          last_maintenance?: string | null
          location_notes?: string | null
          maintenance_interval_months?: number | null
          monthly_charge?: number
          purchase_date?: string | null
          quantity?: number | null
          removed_at?: string | null
          room_id?: number | null
          serial_number?: string | null
          status?: Database["smartstay"]["Enums"]["asset_status"] | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          asset_id?: number
          assigned_at?: string | null
          billing_end_date?: string | null
          billing_label?: string | null
          billing_notes?: string | null
          billing_start_date?: string | null
          billing_status?: string
          broken_reported_at?: string | null
          condition_score?: number | null
          created_at?: string | null
          id?: number
          is_billable?: boolean
          last_maintenance?: string | null
          location_notes?: string | null
          maintenance_interval_months?: number | null
          monthly_charge?: number
          purchase_date?: string | null
          quantity?: number | null
          removed_at?: string | null
          room_id?: number | null
          serial_number?: string | null
          status?: Database["smartstay"]["Enums"]["asset_status"] | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_assets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_assets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_assets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      room_images: {
        Row: {
          created_at: string
          id: number
          is_main: boolean
          room_id: number
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_main?: boolean
          room_id: number
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: number
          is_main?: boolean
          room_id?: number
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_images_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_images_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_images_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      room_inquiries: {
        Row: {
          created_at: string | null
          id: number
          inquirer_name: string
          inquirer_phone: string
          message: string | null
          room_id: number
        }
        Insert: {
          created_at?: string | null
          id?: never
          inquirer_name: string
          inquirer_phone: string
          message?: string | null
          room_id: number
        }
        Update: {
          created_at?: string | null
          id?: never
          inquirer_name?: string
          inquirer_phone?: string
          message?: string | null
          room_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_inquiries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_inquiries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_inquiries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      room_occupants: {
        Row: {
          contract_id: number
          created_at: string
          created_by: string | null
          id: number
          is_primary_tenant: boolean
          move_in_at: string
          move_out_at: string | null
          note: string | null
          relationship_to_primary: string | null
          room_id: number
          status: Database["smartstay"]["Enums"]["occupant_status"]
          tenant_id: number
          updated_at: string
        }
        Insert: {
          contract_id: number
          created_at?: string
          created_by?: string | null
          id?: number
          is_primary_tenant?: boolean
          move_in_at: string
          move_out_at?: string | null
          note?: string | null
          relationship_to_primary?: string | null
          room_id: number
          status?: Database["smartstay"]["Enums"]["occupant_status"]
          tenant_id: number
          updated_at?: string
        }
        Update: {
          contract_id?: number
          created_at?: string
          created_by?: string | null
          id?: number
          is_primary_tenant?: boolean
          move_in_at?: string
          move_out_at?: string | null
          note?: string | null
          relationship_to_primary?: string | null
          room_id?: number
          status?: Database["smartstay"]["Enums"]["occupant_status"]
          tenant_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_occupants_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_occupants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_occupants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_occupants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      room_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          days_in_status: number | null
          id: number
          is_automated: boolean | null
          new_status: Database["smartstay"]["Enums"]["room_status"]
          notes: string | null
          previous_status: Database["smartstay"]["Enums"]["room_status"]
          reason: string | null
          room_id: number
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          days_in_status?: number | null
          id?: number
          is_automated?: boolean | null
          new_status: Database["smartstay"]["Enums"]["room_status"]
          notes?: string | null
          previous_status: Database["smartstay"]["Enums"]["room_status"]
          reason?: string | null
          room_id: number
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          days_in_status?: number | null
          id?: number
          is_automated?: boolean | null
          new_status?: Database["smartstay"]["Enums"]["room_status"]
          notes?: string | null
          previous_status?: Database["smartstay"]["Enums"]["room_status"]
          reason?: string | null
          room_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_status_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_status_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_status_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: Json | null
          area_sqm: number | null
          base_rent: number | null
          building_id: number
          condition_score: number | null
          created_at: string | null
          description: string | null
          facing: string | null
          floor_number: number | null
          has_balcony: boolean | null
          has_private_bathroom: boolean | null
          id: number
          is_deleted: boolean | null
          is_listed: boolean | null
          last_inspection: string | null
          max_occupants: number | null
          noise_level: number | null
          room_code: string
          room_type: string | null
          status: Database["smartstay"]["Enums"]["room_status"] | null
          updated_at: string | null
          uuid: string
        }
        Insert: {
          amenities?: Json | null
          area_sqm?: number | null
          base_rent?: number | null
          building_id: number
          condition_score?: number | null
          created_at?: string | null
          description?: string | null
          facing?: string | null
          floor_number?: number | null
          has_balcony?: boolean | null
          has_private_bathroom?: boolean | null
          id?: number
          is_deleted?: boolean | null
          is_listed?: boolean | null
          last_inspection?: string | null
          max_occupants?: number | null
          noise_level?: number | null
          room_code: string
          room_type?: string | null
          status?: Database["smartstay"]["Enums"]["room_status"] | null
          updated_at?: string | null
          uuid?: string
        }
        Update: {
          amenities?: Json | null
          area_sqm?: number | null
          base_rent?: number | null
          building_id?: number
          condition_score?: number | null
          created_at?: string | null
          description?: string | null
          facing?: string | null
          floor_number?: number | null
          has_balcony?: boolean | null
          has_private_bathroom?: boolean | null
          id?: number
          is_deleted?: boolean | null
          is_listed?: boolean | null
          last_inspection?: string | null
          max_occupants?: number | null
          noise_level?: number | null
          room_code?: string
          room_type?: string | null
          status?: Database["smartstay"]["Enums"]["room_status"] | null
          updated_at?: string | null
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "rooms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["building_id"]
          },
        ]
      }
      service_catalog: {
        Row: {
          billing_method: string
          code: string
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          is_deleted: boolean
          legacy_service_id: number | null
          name: string
          service_kind: string
          unit: string
          updated_at: string
        }
        Insert: {
          billing_method?: string
          code: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          legacy_service_id?: number | null
          name: string
          service_kind?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          billing_method?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_deleted?: boolean
          legacy_service_id?: number | null
          name?: string
          service_kind?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_catalog_legacy_service_id_fkey"
            columns: ["legacy_service_id"]
            isOneToOne: true
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_prices: {
        Row: {
          created_at: string | null
          effective_from: string
          effective_to: string | null
          id: number
          is_active: boolean | null
          service_catalog_id: number | null
          service_id: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          effective_from: string
          effective_to?: string | null
          id?: number
          is_active?: boolean | null
          service_catalog_id?: number | null
          service_id?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: number
          is_active?: boolean | null
          service_catalog_id?: number | null
          service_id?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_prices_service_catalog_id_fkey"
            columns: ["service_catalog_id"]
            isOneToOne: false
            referencedRelation: "service_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_prices_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          calc_type: Database["smartstay"]["Enums"]["service_calc_type"]
          created_at: string | null
          id: number
          is_active: boolean | null
          is_deleted: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          calc_type: Database["smartstay"]["Enums"]["service_calc_type"]
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          is_deleted?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          calc_type?: Database["smartstay"]["Enums"]["service_calc_type"]
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          is_deleted?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          building_limit: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          monthly_price: number
          name: string
          room_limit: number
          slug: string
          updated_at: string
          user_limit: number
        }
        Insert: {
          building_limit?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monthly_price?: number
          name: string
          room_limit?: number
          slug: string
          updated_at?: string
          user_limit?: number
        }
        Update: {
          building_limit?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monthly_price?: number
          name?: string
          room_limit?: number
          slug?: string
          updated_at?: string
          user_limit?: number
        }
        Relationships: []
      }
      platform_broadcasts: {
        Row: {
          audience: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          recipient_count: number
          sent_at: string | null
          status: string
          target_org_ids: string[] | null
          target_scope: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          recipient_count?: number
          sent_at?: string | null
          status?: string
          target_org_ids?: string[] | null
          target_scope?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          recipient_count?: number
          sent_at?: string | null
          status?: string
          target_org_ids?: string[] | null
          target_scope?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'platform_broadcasts_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      platform_invoices: {
        Row: {
          amount_due: number
          created_at: string
          currency: string
          due_date: string | null
          id: string
          notes: string | null
          organization_id: string
          paid_amount: number
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_due?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          paid_amount?: number
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_due?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          paid_amount?: number
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'platform_invoices_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      system_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_default: boolean
          kind: string
          name: string
          organization_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean
          kind: string
          name: string
          organization_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean
          kind?: string
          name?: string
          organization_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'system_templates_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          group_name: string | null
          is_sensitive: boolean | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_name?: string | null
          is_sensitive?: boolean | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_name?: string | null
          is_sensitive?: boolean | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      tenant_balances: {
        Row: {
          balance: number | null
          created_at: string | null
          id: number
          last_updated: string | null
          tenant_id: number
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: number
          last_updated?: string | null
          tenant_id: number
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: number
          last_updated?: string | null
          tenant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_balances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          documents: Json | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: Database["smartstay"]["Enums"]["gender_type"] | null
          id: number
          id_number: string
          is_deleted: boolean | null
          permanent_address: string | null
          phone: string | null
          profile_id: string | null
          search_vector: unknown
          updated_at: string | null
          uuid: string
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          documents?: Json | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gender?: Database["smartstay"]["Enums"]["gender_type"] | null
          id?: number
          id_number: string
          is_deleted?: boolean | null
          permanent_address?: string | null
          phone?: string | null
          profile_id?: string | null
          search_vector?: unknown
          updated_at?: string | null
          uuid?: string
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          documents?: Json | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: Database["smartstay"]["Enums"]["gender_type"] | null
          id?: number
          id_number?: string
          is_deleted?: boolean | null
          permanent_address?: string | null
          phone?: string | null
          profile_id?: string | null
          search_vector?: unknown
          updated_at?: string | null
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          attachments: Json | null
          author_id: string | null
          content: string
          created_at: string | null
          id: number
          is_internal: boolean | null
          ticket_id: number
        }
        Insert: {
          attachments?: Json | null
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: number
          is_internal?: boolean | null
          ticket_id: number
        }
        Update: {
          attachments?: Json | null
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: number
          is_internal?: boolean | null
          ticket_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: number
          priority: Database["smartstay"]["Enums"]["priority_type"] | null
          resolution_cost: number | null
          resolution_notes: string | null
          resolved_at: string | null
          room_asset_id: number | null
          room_id: number | null
          satisfaction_rating: number | null
          status: Database["smartstay"]["Enums"]["ticket_status"] | null
          subject: string
          tenant_id: number | null
          ticket_code: string
          updated_at: string | null
          uuid: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          priority?: Database["smartstay"]["Enums"]["priority_type"] | null
          resolution_cost?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          room_asset_id?: number | null
          room_id?: number | null
          satisfaction_rating?: number | null
          status?: Database["smartstay"]["Enums"]["ticket_status"] | null
          subject: string
          tenant_id?: number | null
          ticket_code?: string
          updated_at?: string | null
          uuid?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          priority?: Database["smartstay"]["Enums"]["priority_type"] | null
          resolution_cost?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          room_asset_id?: number | null
          room_id?: number | null
          satisfaction_rating?: number | null
          status?: Database["smartstay"]["Enums"]["ticket_status"] | null
          subject?: string
          tenant_id?: number | null
          ticket_code?: string
          updated_at?: string | null
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_room_asset_id_fkey"
            columns: ["room_asset_id"]
            isOneToOne: false
            referencedRelation: "room_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_room_asset_id_fkey"
            columns: ["room_asset_id"]
            isOneToOne: false
            referencedRelation: "vw_room_assets_warranty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "tickets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_policies: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          effective_from: string
          effective_to: string | null
          electric_base_amount: number
          electric_hot_season_multiplier: number
          id: number
          is_active: boolean
          location_multiplier: number
          min_electric_floor: number
          min_water_floor: number
          name: string
          rounding_increment: number
          scope_id: number | null
          scope_type: Database["smartstay"]["Enums"]["utility_policy_scope"]
          season_months: Json
          updated_at: string
          water_base_amount: number
          water_per_person_amount: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          electric_base_amount?: number
          electric_hot_season_multiplier?: number
          id?: number
          is_active?: boolean
          location_multiplier?: number
          min_electric_floor?: number
          min_water_floor?: number
          name: string
          rounding_increment?: number
          scope_id?: number | null
          scope_type: Database["smartstay"]["Enums"]["utility_policy_scope"]
          season_months?: Json
          updated_at?: string
          water_base_amount?: number
          water_per_person_amount?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          electric_base_amount?: number
          electric_hot_season_multiplier?: number
          id?: number
          is_active?: boolean
          location_multiplier?: number
          min_electric_floor?: number
          min_water_floor?: number
          name?: string
          rounding_increment?: number
          scope_id?: number | null
          scope_type?: Database["smartstay"]["Enums"]["utility_policy_scope"]
          season_months?: Json
          updated_at?: string
          water_base_amount?: number
          water_per_person_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "utility_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_policy_device_adjustments: {
        Row: {
          charge_amount: number
          created_at: string
          device_code: string
          id: number
          is_active: boolean
          notes: string | null
          updated_at: string
          utility_policy_id: number
        }
        Insert: {
          charge_amount?: number
          created_at?: string
          device_code: string
          id?: number
          is_active?: boolean
          notes?: string | null
          updated_at?: string
          utility_policy_id: number
        }
        Update: {
          charge_amount?: number
          created_at?: string
          device_code?: string
          id?: number
          is_active?: boolean
          notes?: string | null
          updated_at?: string
          utility_policy_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "utility_policy_device_adjustments_utility_policy_id_fkey"
            columns: ["utility_policy_id"]
            isOneToOne: false
            referencedRelation: "utility_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: number
          payload: Json
          processed_at: string | null
          provider: string
          received_at: string | null
          retry_count: number | null
          status: Database["smartstay"]["Enums"]["webhook_status"] | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          payload: Json
          processed_at?: string | null
          provider: string
          received_at?: string | null
          retry_count?: number | null
          status?: Database["smartstay"]["Enums"]["webhook_status"] | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          payload?: Json
          processed_at?: string | null
          provider?: string
          received_at?: string | null
          retry_count?: number | null
          status?: Database["smartstay"]["Enums"]["webhook_status"] | null
        }
        Relationships: []
      }
    }
    Views: {
      portal_payment_settings: {
        Row: {
          key: string | null
          value: Json | null
        }
        Insert: {
          key?: string | null
          value?: Json | null
        }
        Update: {
          key?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
      public_room_listings: {
        Row: {
          area_sqm: number | null
          availability_status: string | null
          base_rent: number | null
          building_available_room_count: number | null
          building_address: string | null
          building_amenities: Json | null
          building_description: string | null
          building_id: number | null
          building_name: string | null
          building_uuid: string | null
          condition_score: number | null
          cover_image_url: string | null
          facing: string | null
          floor_number: number | null
          has_balcony: boolean | null
          has_private_bathroom: boolean | null
          max_occupants: number | null
          province: string | null
          room_amenities: Json | null
          room_code: string | null
          room_id: number | null
          room_type: string | null
          room_uuid: string | null
        }
        Relationships: []
      }
      vw_public_room_listings: {
        Row: {
          amenities: Json | null
          area_sqm: number | null
          base_rent: number | null
          building_address: string | null
          building_id: number | null
          building_name: string | null
          description: string | null
          facing: string | null
          floor_number: number | null
          has_balcony: boolean | null
          id: number | null
          room_code: string | null
          room_type: string | null
        }
        Relationships: []
      }
      vw_room_assets_warranty: {
        Row: {
          asset_id: number | null
          condition_score: number | null
          created_at: string | null
          id: number | null
          is_under_warranty: boolean | null
          last_maintenance: string | null
          location_notes: string | null
          maintenance_interval_months: number | null
          purchase_date: string | null
          quantity: number | null
          room_id: number | null
          serial_number: string | null
          status: Database["smartstay"]["Enums"]["asset_status"] | null
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          asset_id?: number | null
          condition_score?: number | null
          created_at?: string | null
          id?: number | null
          is_under_warranty?: never
          last_maintenance?: string | null
          location_notes?: string | null
          maintenance_interval_months?: number | null
          purchase_date?: string | null
          quantity?: number | null
          room_id?: number | null
          serial_number?: string | null
          status?: Database["smartstay"]["Enums"]["asset_status"] | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          asset_id?: number | null
          condition_score?: number | null
          created_at?: string | null
          id?: number | null
          is_under_warranty?: never
          last_maintenance?: string | null
          location_notes?: string | null
          maintenance_interval_months?: number | null
          purchase_date?: string | null
          quantity?: number | null
          room_id?: number | null
          serial_number?: string | null
          status?: Database["smartstay"]["Enums"]["asset_status"] | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_assets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "public_room_listings"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_assets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_assets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "vw_public_room_listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_contract_occupant: {
        Args: {
          p_contract_id: number
          p_move_in_date: string
          p_note?: string
          p_processed_by?: string
          p_relationship_to_primary?: string
          p_tenant_id: number
        }
        Returns: Json
      }
      adjust_balance: {
        Args: {
          p_amount: number
          p_created_by?: string
          p_invoice_id?: number
          p_notes: string
          p_tenant_id: number
          p_transaction_type: string
        }
        Returns: Json
      }
      apply_confirmed_payment: {
        Args: {
          p_confirmation_source: string
          p_confirmed_by?: string
          p_fail_if_applied?: boolean
          p_payment_id: number
        }
        Returns: Json
      }
      approve_payment:
        | {
            Args: { p_confirmed_by?: string; p_payment_id: number }
            Returns: Json
          }
        | {
            Args: {
              p_attempt_id?: number
              p_confirmation_source?: string
              p_confirmed_by?: string
              p_payment_id: number
            }
            Returns: Json
          }
      create_contract: {
        Args: {
          p_deposit_amount: number
          p_end_date: string
          p_mark_deposit_received?: boolean
          p_monthly_rent: number
          p_payment_cycle_months: number
          p_primary_tenant_id: number
          p_room_id: number
          p_service_ids?: number[]
          p_service_prices?: number[]
          p_service_quantities?: number[]
          p_start_date: string
          p_tenant_ids: number[]
        }
        Returns: Json
      }
      create_contract_addendum: {
        Args: {
          p_addendum_type: string
          p_content?: string
          p_contract_id: number
          p_created_by?: string
          p_effective_date?: string
          p_parent_addendum_id?: number
          p_signed_file_url?: string
          p_source_type?: string
          p_status?: string
          p_summary_json?: Json
          p_title: string
        }
        Returns: {
          addendum_code: string | null
          addendum_type: string
          approved_by: string | null
          content: string | null
          contract_id: number
          created_at: string
          created_by: string | null
          effective_date: string
          id: number
          parent_addendum_id: number | null
          signed_at: string | null
          signed_file_url: string | null
          source_type: string
          status: string
          summary_json: Json
          title: string
          updated_at: string
          version_no: number
        }
        SetofOptions: {
          from: "*"
          to: "contract_addendums"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_contract_v3: {
        Args: {
          p_deposit_amount?: number
          p_end_date: string
          p_mark_deposit_received?: boolean
          p_monthly_rent: number
          p_occupant_ids?: number[]
          p_owner_final_acknowledgement?: boolean
          p_owner_has_legal_rental_rights?: boolean
          p_owner_legal_basis_note?: string
          p_owner_legal_basis_type?: string
          p_owner_property_eligibility_confirmed?: boolean
          p_owner_rep_cccd?: string
          p_owner_rep_full_name?: string
          p_owner_rep_role?: string
          p_owner_responsibilities_accepted?: boolean
          p_owner_supporting_document_urls?: string[]
          p_payment_cycle_months?: number
          p_payment_due_day?: number
          p_primary_tenant_id?: number
          p_room_id: number
          p_service_ids?: number[]
          p_service_prices?: number[]
          p_service_quantities?: number[]
          p_start_date: string
          p_utility_policy_id?: number
        }
        Returns: Json
      }
      create_handover_checklist_v1: {
        Args: {
          p_assets: Json
          p_contract_id: number
          p_handover_type: Database["smartstay"]["Enums"]["handover_type"]
          p_items: Json
          p_manager_signature: string
          p_notes: string
          p_performed_by: string
          p_room_id: number
          p_tenant_id: string
          p_tenant_signature: string
        }
        Returns: number
      }
      create_policy_utility_invoice: {
        Args: {
          p_billing_period: string
          p_contract_id: number
          p_due_date: string
          p_invoice_items?: Json
          p_note?: string
          p_snapshot?: Json
          p_subtotal: number
          p_total_amount: number
        }
        Returns: Json
      }
      ensure_tenant_balance_record: {
        Args: { p_tenant_id: number }
        Returns: number
      }
      generate_code: {
        Args: { prefix: string; sequence_name: string }
        Returns: string
      }
      get_domain_schema_health: { Args: never; Returns: Json }
      handle_momo_ipn: {
        Args: {
          p_access_key: string
          p_payload: Json
          p_received_at?: string
          p_secret_key: string
        }
        Returns: Json
      }
      handle_sepay_webhook: {
        Args: { p_api_key?: string; p_payload: Json; p_received_at?: string }
        Returns: Json
      }
      liquidate_contract: {
        Args: {
          p_additional_charges?: number
          p_contract_id: number
          p_deposit_used?: number
          p_processed_by?: string
          p_reason: string
          p_termination_date: string
        }
        Returns: Json
      }
      map_legacy_payment_method: {
        Args: {
          p_method: Database["smartstay"]["Enums"]["payment_attempt_method"]
        }
        Returns: Database["smartstay"]["Enums"]["payment_method"]
      }
      map_payment_attempt_method: {
        Args: { p_method: string }
        Returns: Database["smartstay"]["Enums"]["payment_attempt_method"]
      }
      portal_cancel_invoice: {
        Args: { p_invoice_id: number; p_reason: string }
        Returns: Json
      }
      portal_mark_invoice_paid: {
        Args: { p_invoice_id: number }
        Returns: Json
      }
      portal_record_invoice_payment: {
        Args: {
          p_amount: number
          p_bank_name?: string
          p_invoice_id: number
          p_method: string
          p_notes?: string
          p_payment_date: string
          p_reference?: string
        }
        Returns: Json
      }
      process_payment: {
        Args: {
          p_amount: number
          p_attempt_status?: Database["smartstay"]["Enums"]["payment_status"]
          p_auto_confirm?: boolean
          p_bank_name?: string
          p_confirmed_by?: string
          p_idempotency_key?: string
          p_invoice_id: number
          p_method: string
          p_notes?: string
          p_payment_date: string
          p_receipt_url?: string
          p_reference?: string
        }
        Returns: Json
      }
      remove_contract_occupant: {
        Args: {
          p_contract_id: number
          p_move_out_date: string
          p_note?: string
          p_processed_by?: string
          p_tenant_id: number
        }
        Returns: Json
      }
      schedule_monthly_utility_billing_job: {
        Args: { job_name?: string }
        Returns: number
      }
      transfer_contract_representative: {
        Args: {
          p_approved_by?: string
          p_note?: string
          p_old_contract_id: number
          p_to_tenant_id: number
          p_transfer_date: string
        }
        Returns: Json
      }
      unschedule_monthly_utility_billing_job: {
        Args: { job_name?: string }
        Returns: boolean
      }
      validate_utility_billing_cron_secret: {
        Args: { p_candidate: string }
        Returns: boolean
      }
    }
    Enums: {
      asset_status: "in_use" | "maintenance" | "disposed" | "cancelled"
      balance_transaction_type:
        | "deposit"
        | "deduction"
        | "refund"
        | "adjustment"
      billing_run_status:
        | "draft"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      contract_status:
        | "draft"
        | "pending_signature"
        | "active"
        | "expired"
        | "terminated"
        | "cancelled"
      contract_transfer_status: "pending" | "completed" | "cancelled"
      deposit_status:
        | "pending"
        | "received"
        | "partially_refunded"
        | "refunded"
        | "forfeited"
      gender_type: "male" | "female" | "other"
      handover_type: "check_in" | "check_out" | "periodic" | "other"
      invoice_status:
        | "draft"
        | "pending_payment"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "cancelled"
      occupant_status: "active" | "moved_out"
      payment_attempt_method: "momo" | "cash" | "bank_transfer"
      payment_method:
        | "cash"
        | "bank_transfer"
        | "momo"
        | "zalopay"
        | "vnpay"
        | "stripe"
        | "other"
      payment_status:
        | "pending"
        | "submitted"
        | "processing"
        | "succeeded"
        | "failed"
        | "cancelled"
        | "rejected"
        | "refunded"
      priority_type: "low" | "normal" | "high" | "urgent"
      room_status: "available" | "occupied" | "maintenance" | "reserved"
      service_calc_type: "per_person" | "per_unit" | "flat_rate" | "per_room"
      ticket_status:
        | "new"
        | "in_progress"
        | "pending_confirmation"
        | "resolved"
        | "closed"
      user_role:
        | "admin"
        | "manager"
        | "staff"
        | "landlord"
        | "tenant"
        | "owner"
        | "super_admin"
        | "viewer"
      utility_policy_scope: "system" | "building" | "room" | "contract"
      webhook_status: "received" | "processing" | "success" | "failed" | "retry"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  smartstay: {
    Enums: {
      asset_status: ["in_use", "maintenance", "disposed", "cancelled"],
      balance_transaction_type: [
        "deposit",
        "deduction",
        "refund",
        "adjustment",
      ],
      billing_run_status: [
        "draft",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      contract_status: [
        "draft",
        "pending_signature",
        "active",
        "expired",
        "terminated",
        "cancelled",
      ],
      contract_transfer_status: ["pending", "completed", "cancelled"],
      deposit_status: [
        "pending",
        "received",
        "partially_refunded",
        "refunded",
        "forfeited",
      ],
      gender_type: ["male", "female", "other"],
      handover_type: ["check_in", "check_out", "periodic", "other"],
      invoice_status: [
        "draft",
        "pending_payment",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
      ],
      occupant_status: ["active", "moved_out"],
      payment_attempt_method: ["momo", "cash", "bank_transfer"],
      payment_method: [
        "cash",
        "bank_transfer",
        "momo",
        "zalopay",
        "vnpay",
        "stripe",
        "other",
      ],
      payment_status: [
        "pending",
        "submitted",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
        "rejected",
        "refunded",
      ],
      priority_type: ["low", "normal", "high", "urgent"],
      room_status: ["available", "occupied", "maintenance", "reserved"],
      service_calc_type: ["per_person", "per_unit", "flat_rate", "per_room"],
      ticket_status: [
        "new",
        "in_progress",
        "pending_confirmation",
        "resolved",
        "closed",
      ],
      user_role: [
        "admin",
        "manager",
        "staff",
        "landlord",
        "tenant",
        "owner",
        "super_admin",
        "viewer",
      ],
      utility_policy_scope: ["system", "building", "room", "contract"],
      webhook_status: ["received", "processing", "success", "failed", "retry"],
    },
  },
} as const

// ─── Project-level type aliases ────────────────────────────────────────────────
// These are convenience re-exports that map Db enum types to friendly names.
// They are NOT generated by the CLI — do NOT remove them when regenerating.
// When regenerating supabase.ts, preserve this block from the previous file.

export type DbUserRole = Database["smartstay"]["Enums"]["user_role"]
export type DbTenantStage =
  | "prospect"
  | "applicant"
  | "resident_pending_onboarding"
  | "resident_active"
export type DbRoomStatus = Database["smartstay"]["Enums"]["room_status"]
export type DbContractStatus = Database["smartstay"]["Enums"]["contract_status"]
export type DbDepositStatus = Database["smartstay"]["Enums"]["deposit_status"]
export type DbInvoiceStatus = Database["smartstay"]["Enums"]["invoice_status"]
export type DbPaymentMethod = Database["smartstay"]["Enums"]["payment_method"]
export type DbPriorityType = Database["smartstay"]["Enums"]["priority_type"]
export type DbTicketStatus = Database["smartstay"]["Enums"]["ticket_status"]
export type DbAssetStatus = Database["smartstay"]["Enums"]["asset_status"]
export type DbBalanceTransactionType =
  Database["smartstay"]["Enums"]["balance_transaction_type"]
export type DbGenderType = Database["smartstay"]["Enums"]["gender_type"]
export type DbServiceCalcType = Database["smartstay"]["Enums"]["service_calc_type"]
export type DbWebhookStatus = Database["smartstay"]["Enums"]["webhook_status"]
export type DbUtilityPolicyScope =
  Database["smartstay"]["Enums"]["utility_policy_scope"]
export type DbHandoverType = "check_in" | "check_out" | "periodic" | "other"
export type DbRentalApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "cancelled"
