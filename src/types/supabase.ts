// Generated for the smartstay schema and adjusted to match the currently connected project.
// Keep this file aligned with the real Supabase schema; do not add speculative tables/views here.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Database enum types
export type DbUserRole = 'admin' | 'manager' | 'staff' | 'landlord' | 'tenant'
export type DbTenantStage = 'prospect' | 'applicant' | 'resident_pending_onboarding' | 'resident_active'
export type DbRoomStatus = 'available' | 'occupied' | 'maintenance' | 'reserved'
export type DbContractStatus = 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated' | 'cancelled'
export type DbDepositStatus = 'pending' | 'received' | 'partially_refunded' | 'refunded' | 'forfeited'
export type DbInvoiceStatus = 'draft' | 'pending_payment' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'
export type DbPaymentMethod = 'cash' | 'bank_transfer' | 'momo' | 'zalopay' | 'vnpay' | 'stripe' | 'other'
export type DbPriorityType = 'low' | 'normal' | 'high' | 'urgent'
export type DbTicketStatus = 'new' | 'in_progress' | 'pending_confirmation' | 'resolved' | 'closed'
export type DbAssetStatus = 'in_use' | 'maintenance' | 'disposed' | 'cancelled'
export type DbBalanceTransactionType = 'deposit' | 'deduction' | 'refund' | 'adjustment'
export type DbGenderType = 'male' | 'female' | 'other'
export type DbServiceCalcType = 'per_person' | 'per_unit' | 'flat_rate' | 'per_room'
export type DbWebhookStatus = 'received' | 'processing' | 'success' | 'failed' | 'retry'
export type DbRentalApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'cancelled'

export interface Database {
  smartstay: {
    Tables: {
      assets: {
        Row: {
          id: number
          name: string
          category: string | null
          brand: string | null
          model: string | null
          warranty_months: number | null
          depreciation_years: number | null
          unit_cost: number | null
          supplier: string | null
          description: string | null
          qr_code: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          name: string
          category?: string | null
          brand?: string | null
          model?: string | null
          warranty_months?: number | null
          depreciation_years?: number | null
          unit_cost?: number | null
          supplier?: string | null
          description?: string | null
          qr_code?: string | null
        }
        Update: {
          name?: string
          category?: string | null
          brand?: string | null
          model?: string | null
          warranty_months?: number | null
          depreciation_years?: number | null
          unit_cost?: number | null
          supplier?: string | null
          description?: string | null
          qr_code?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: number
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      balance_history: {
        Row: {
          id: number
          tenant_id: number
          balance_id: number
          transaction_type: DbBalanceTransactionType
          amount: number
          invoice_id: number | null
          payment_id: number | null
          balance_before: number
          balance_after: number
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          tenant_id: number
          balance_id: number
          transaction_type: DbBalanceTransactionType
          amount: number
          invoice_id?: number | null
          payment_id?: number | null
          balance_before: number
          balance_after: number
          notes?: string | null
          created_by?: string | null
        }
        Update: {
          tenant_id?: number
          balance_id?: number
          transaction_type?: DbBalanceTransactionType
          amount?: number
          invoice_id?: number | null
          payment_id?: number | null
          balance_before?: number
          balance_after?: number
          notes?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      room_images: {
        Row: {
          id: number
          room_id: number
          url: string
          is_main: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          room_id: number
          url: string
          is_main?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          room_id?: number
          url?: string
          is_main?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      building_images: {
        Row: {
          id: number
          building_id: number
          url: string
          is_main: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          building_id: number
          url: string
          is_main?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          building_id?: number
          url?: string
          is_main?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'building_images_building_id_fkey'
            columns: ['building_id']
            referencedRelation: 'buildings'
            referencedColumns: ['id']
          }
        ]
      }
      buildings: {
        Row: {
          id: number
          uuid: string
          name: string
          address: string
          description: string | null
          amenities: Json | null
          owner_id: string | null
          total_floors: number | null
          opening_date: string | null
          latitude: number | null
          longitude: number | null
          electricity_provider: string | null
          water_provider: string | null
          fire_cert_expiry: string | null
          last_maintenance_date: string | null
          is_deleted: boolean | null
          created_at: string | null
          updated_at: string | null
          search_vector: unknown | null
        }
        Insert: {
          name: string
          address: string
          description?: string | null
          amenities?: Json | null
          owner_id?: string | null
          total_floors?: number | null
          opening_date?: string | null
          latitude?: number | null
          longitude?: number | null
          electricity_provider?: string | null
          water_provider?: string | null
          fire_cert_expiry?: string | null
          last_maintenance_date?: string | null
          is_deleted?: boolean | null
        }
        Update: {
          name?: string
          address?: string
          description?: string | null
          amenities?: Json | null
          owner_id?: string | null
          total_floors?: number | null
          opening_date?: string | null
          latitude?: number | null
          longitude?: number | null
          electricity_provider?: string | null
          water_provider?: string | null
          fire_cert_expiry?: string | null
          last_maintenance_date?: string | null
          is_deleted?: boolean | null
        }
        Relationships: []
      }
      contract_renewals: {
        Row: {
          id: number
          contract_id: number
          previous_end_date: string
          new_end_date: string
          new_monthly_rent: number
          reason: string | null
          renewed_by: string | null
          created_at: string | null
        }
        Insert: {
          contract_id: number
          previous_end_date: string
          new_end_date: string
          new_monthly_rent: number
          reason?: string | null
          renewed_by?: string | null
        }
        Update: {
          contract_id?: number
          previous_end_date?: string
          new_end_date?: string
          new_monthly_rent?: number
          reason?: string | null
          renewed_by?: string | null
        }
        Relationships: []
      }
      contract_services: {
        Row: {
          id: number
          contract_id: number
          service_id: number
          quantity: number | null
          fixed_price: number
          created_at: string | null
        }
        Insert: {
          contract_id: number
          service_id: number
          quantity?: number | null
          fixed_price: number
        }
        Update: {
          contract_id?: number
          service_id?: number
          quantity?: number | null
          fixed_price?: number
        }
        Relationships: []
      }
      contract_tenants: {
        Row: {
          id: number
          contract_id: number
          tenant_id: number
          is_primary: boolean | null
          created_at: string | null
        }
        Insert: {
          contract_id: number
          tenant_id: number
          is_primary?: boolean | null
        }
        Update: {
          contract_id?: number
          tenant_id?: number
          is_primary?: boolean | null
        }
        Relationships: []
      }
      contract_terminations: {
        Row: {
          id: number
          contract_id: number
          final_invoice_id: number | null
          final_invoice_amount: number | null
          deposit_used: number | null
          deposit_refunded: number | null
          additional_charges: number | null
          reason: string | null
          processed_by: string | null
          created_at: string | null
        }
        Insert: {
          contract_id: number
          final_invoice_id?: number | null
          final_invoice_amount?: number | null
          deposit_used?: number | null
          deposit_refunded?: number | null
          additional_charges?: number | null
          reason?: string | null
          processed_by?: string | null
        }
        Update: {
          contract_id?: number
          final_invoice_id?: number | null
          final_invoice_amount?: number | null
          deposit_used?: number | null
          deposit_refunded?: number | null
          additional_charges?: number | null
          reason?: string | null
          processed_by?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          id: number
          uuid: string
          contract_code: string
          room_id: number
          start_date: string
          end_date: string
          signing_date: string | null
          payment_cycle_months: number
          monthly_rent: number
          deposit_amount: number | null
          deposit_status: DbDepositStatus | null
          status: DbContractStatus | null
          termination_reason: string | null
          terms: Json | null
          is_deleted: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          room_id: number
          start_date: string
          end_date: string
          signing_date?: string | null
          payment_cycle_months: number
          monthly_rent: number
          deposit_amount?: number | null
          deposit_status?: DbDepositStatus | null
          status?: DbContractStatus | null
          termination_reason?: string | null
          terms?: Json | null
          is_deleted?: boolean | null
        }
        Update: {
          room_id?: number
          start_date?: string
          end_date?: string
          signing_date?: string | null
          payment_cycle_months?: number
          monthly_rent?: number
          deposit_amount?: number | null
          deposit_status?: DbDepositStatus | null
          status?: DbContractStatus | null
          termination_reason?: string | null
          terms?: Json | null
          is_deleted?: boolean | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          id: number
          invoice_id: number
          description: string
          quantity: number | null
          unit_price: number
          line_total: number
          meter_reading_id: number | null
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          invoice_id: number
          description: string
          quantity?: number | null
          unit_price: number
          line_total: number
          meter_reading_id?: number | null
          sort_order?: number | null
        }
        Update: {
          invoice_id?: number
          description?: string
          quantity?: number | null
          unit_price?: number
          line_total?: number
          meter_reading_id?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: number
          uuid: string
          invoice_code: string
          contract_id: number
          billing_period: string | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          amount_paid: number | null
          balance_due: number | null
          due_date: string | null
          paid_date: string | null
          status: DbInvoiceStatus | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          contract_id: number
          billing_period?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          amount_paid?: number | null
          balance_due?: number | null
          due_date?: string | null
          paid_date?: string | null
          status?: DbInvoiceStatus | null
          notes?: string | null
        }
        Update: {
          contract_id?: number
          billing_period?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          amount_paid?: number | null
          balance_due?: number | null
          due_date?: string | null
          paid_date?: string | null
          status?: DbInvoiceStatus | null
          notes?: string | null
        }
        Relationships: []
      }
      maintenance_logs: {
        Row: {
          id: number
          room_asset_id: number
          maintenance_date: string
          issue_description: string | null
          cost: number | null
          performed_by: string | null
          next_maintenance_date: string | null
          attachments: Json | null
          created_at: string | null
        }
        Insert: {
          room_asset_id: number
          maintenance_date: string
          issue_description?: string | null
          cost?: number | null
          performed_by?: string | null
          next_maintenance_date?: string | null
          attachments?: Json | null
        }
        Update: {
          room_asset_id?: number
          maintenance_date?: string
          issue_description?: string | null
          cost?: number | null
          performed_by?: string | null
          next_maintenance_date?: string | null
          attachments?: Json | null
        }
        Relationships: []
      }
      meter_readings: {
        Row: {
          id: number
          room_id: number
          billing_period: string
          electricity_previous: number
          electricity_current: number
          electricity_usage: number | null
          water_previous: number
          water_current: number
          water_usage: number | null
          previous_reading_id: number | null
          reading_date: string
          read_by: string | null
          created_at: string | null
        }
        Insert: {
          room_id: number
          billing_period: string
          electricity_previous: number
          electricity_current: number
          electricity_usage?: number | null
          water_previous: number
          water_current: number
          water_usage?: number | null
          previous_reading_id?: number | null
          reading_date: string
          read_by?: string | null
        }
        Update: {
          room_id?: number
          billing_period?: string
          electricity_previous?: number
          electricity_current?: number
          electricity_usage?: number | null
          water_previous?: number
          water_current?: number
          water_usage?: number | null
          previous_reading_id?: number | null
          reading_date?: string
          read_by?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: number
          uuid: string
          payment_code: string
          invoice_id: number
          amount: number
          method: DbPaymentMethod
          bank_name: string | null
          reference_number: string | null
          receipt_url: string | null
          payment_date: string
          confirmed_by: string | null
          confirmed_at: string | null
          stripe_payment_intent_id: string | null
          stripe_charge_id: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          invoice_id: number
          amount: number
          method: DbPaymentMethod
          bank_name?: string | null
          reference_number?: string | null
          receipt_url?: string | null
          payment_date: string
          confirmed_by?: string | null
          confirmed_at?: string | null
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          notes?: string | null
        }
        Update: {
          invoice_id?: number
          amount?: number
          method?: DbPaymentMethod
          bank_name?: string | null
          reference_number?: string | null
          receipt_url?: string | null
          payment_date?: string
          confirmed_by?: string | null
          confirmed_at?: string | null
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          profile_id: string
          title: string
          message: string
          type: string
          link: string | null
          is_read: boolean
          metadata: Json | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          title: string
          message: string
          type?: string
          link?: string | null
          is_read?: boolean
          metadata?: Json | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          title?: string
          message?: string
          type?: string
          link?: string | null
          is_read?: boolean
          metadata?: Json | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          role: DbUserRole
          tenant_stage: DbTenantStage
          preferences: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          identity_number: string | null
          date_of_birth: string | null
          gender: DbGenderType | null
          address: string | null
          role_id: string | null
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          role?: DbUserRole
          tenant_stage?: DbTenantStage
          preferences?: Json | null
          is_active?: boolean | null
          identity_number?: string | null
          date_of_birth?: string | null
          gender?: DbGenderType | null
          address?: string | null
          role_id?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: DbUserRole
          tenant_stage?: DbTenantStage
          preferences?: Json | null
          is_active?: boolean | null
          identity_number?: string | null
          date_of_birth?: string | null
          gender?: DbGenderType | null
          address?: string | null
          role_id?: string | null
        }
        Relationships: []
      }
      rental_applications: {
        Row: {
          id: number
          uuid: string
          profile_id: string
          room_id: number
          status: DbRentalApplicationStatus
          verification_method: string | null
          verification_payload: Json
          notes: string | null
          submitted_at: string | null
          reviewed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          uuid?: string
          profile_id: string
          room_id: number
          status?: DbRentalApplicationStatus
          verification_method?: string | null
          verification_payload?: Json
          notes?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          uuid?: string
          profile_id?: string
          room_id?: number
          status?: DbRentalApplicationStatus
          verification_method?: string | null
          verification_payload?: Json
          notes?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      room_assets: {
        Row: {
          id: number
          room_id: number
          asset_id: number
          serial_number: string | null
          quantity: number | null
          status: DbAssetStatus | null
          condition_score: number | null
          purchase_date: string | null
          warranty_expiry: string | null
          last_maintenance: string | null
          maintenance_interval_months: number | null
          location_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          room_id: number
          asset_id: number
          serial_number?: string | null
          quantity?: number | null
          status?: DbAssetStatus | null
          condition_score?: number | null
          purchase_date?: string | null
          warranty_expiry?: string | null
          last_maintenance?: string | null
          maintenance_interval_months?: number | null
          location_notes?: string | null
        }
        Update: {
          room_id?: number
          asset_id?: number
          serial_number?: string | null
          quantity?: number | null
          status?: DbAssetStatus | null
          condition_score?: number | null
          purchase_date?: string | null
          warranty_expiry?: string | null
          last_maintenance?: string | null
          maintenance_interval_months?: number | null
          location_notes?: string | null
        }
        Relationships: []
      }
      room_status_history: {
        Row: {
          id: number
          room_id: number
          previous_status: DbRoomStatus
          new_status: DbRoomStatus
          changed_at: string | null
          changed_by: string | null
          reason: string | null
          notes: string | null
          days_in_status: number | null
          is_automated: boolean | null
        }
        Insert: {
          room_id: number
          previous_status: DbRoomStatus
          new_status: DbRoomStatus
          changed_at?: string | null
          changed_by?: string | null
          reason?: string | null
          notes?: string | null
          days_in_status?: number | null
          is_automated?: boolean | null
        }
        Update: {
          room_id?: number
          previous_status?: DbRoomStatus
          new_status?: DbRoomStatus
          changed_at?: string | null
          changed_by?: string | null
          reason?: string | null
          notes?: string | null
          days_in_status?: number | null
          is_automated?: boolean | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          id: number
          uuid: string
          building_id: number
          room_code: string
          floor_number: number | null
          area_sqm: number | null
          room_type: string | null
          max_occupants: number | null
          has_balcony: boolean | null
          has_private_bathroom: boolean | null
          facing: string | null
          amenities: Json | null
          base_rent: number | null
          condition_score: number | null
          noise_level: number | null
          last_inspection: string | null
          status: DbRoomStatus | null
          is_deleted: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          building_id: number
          room_code: string
          floor_number?: number | null
          area_sqm?: number | null
          room_type?: string | null
          max_occupants?: number | null
          has_balcony?: boolean | null
          has_private_bathroom?: boolean | null
          facing?: string | null
          amenities?: Json | null
          base_rent?: number | null
          condition_score?: number | null
          noise_level?: number | null
          last_inspection?: string | null
          status?: DbRoomStatus | null
          is_deleted?: boolean | null
        }
        Update: {
          building_id?: number
          room_code?: string
          floor_number?: number | null
          area_sqm?: number | null
          room_type?: string | null
          max_occupants?: number | null
          has_balcony?: boolean | null
          has_private_bathroom?: boolean | null
          facing?: string | null
          amenities?: Json | null
          base_rent?: number | null
          condition_score?: number | null
          noise_level?: number | null
          last_inspection?: string | null
          status?: DbRoomStatus | null
          is_deleted?: boolean | null
        }
        Relationships: []
      }
      service_prices: {
        Row: {
          id: number
          service_id: number
          unit_price: number
          effective_from: string
          effective_to: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          service_id: number
          unit_price: number
          effective_from: string
          effective_to?: string | null
          is_active?: boolean | null
        }
        Update: {
          service_id?: number
          unit_price?: number
          effective_from?: string
          effective_to?: string | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      services: {
        Row: {
          id: number
          name: string
          calc_type: DbServiceCalcType
          is_active: boolean | null
          is_deleted: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          name: string
          calc_type: DbServiceCalcType
          is_active?: boolean | null
          is_deleted?: boolean | null
        }
        Update: {
          name?: string
          calc_type?: DbServiceCalcType
          is_active?: boolean | null
          is_deleted?: boolean | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          value: Json
          description: string | null
          group_name: string | null
          is_sensitive: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          key: string
          value: Json
          description?: string | null
          group_name?: string | null
          is_sensitive?: boolean | null
        }
        Update: {
          key?: string
          value?: Json
          description?: string | null
          group_name?: string | null
          is_sensitive?: boolean | null
        }
        Relationships: []
      }
      tenant_balances: {
        Row: {
          id: number
          tenant_id: number
          balance: number | null
          last_updated: string | null
          created_at: string | null
        }
        Insert: {
          tenant_id: number
          balance?: number | null
          last_updated?: string | null
        }
        Update: {
          tenant_id?: number
          balance?: number | null
          last_updated?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          id: number
          uuid: string
          profile_id: string | null
          full_name: string
          id_number: string
          date_of_birth: string | null
          gender: DbGenderType | null
          phone: string | null
          email: string | null
          permanent_address: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          documents: Json | null
          is_deleted: boolean | null
          created_at: string | null
          updated_at: string | null
          search_vector: unknown | null
        }
        Insert: {
          profile_id?: string | null
          full_name: string
          id_number: string
          date_of_birth?: string | null
          gender?: DbGenderType | null
          phone?: string | null
          email?: string | null
          permanent_address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          documents?: Json | null
          is_deleted?: boolean | null
        }
        Update: {
          profile_id?: string | null
          full_name?: string
          id_number?: string
          date_of_birth?: string | null
          gender?: DbGenderType | null
          phone?: string | null
          email?: string | null
          permanent_address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          documents?: Json | null
          is_deleted?: boolean | null
        }
        Relationships: []
      }
      ticket_comments: {
        Row: {
          id: number
          ticket_id: number
          author_id: string | null
          content: string
          is_internal: boolean | null
          attachments: Json | null
          created_at: string | null
        }
        Insert: {
          ticket_id: number
          author_id?: string | null
          content: string
          is_internal?: boolean | null
          attachments?: Json | null
        }
        Update: {
          ticket_id?: number
          author_id?: string | null
          content?: string
          is_internal?: boolean | null
          attachments?: Json | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          id: number
          uuid: string
          ticket_code: string
          tenant_id: number | null
          room_id: number | null
          room_asset_id: number | null
          subject: string
          description: string | null
          category: string | null
          priority: DbPriorityType | null
          status: DbTicketStatus | null
          assigned_to: string | null
          resolved_at: string | null
          resolution_notes: string | null
          resolution_cost: number | null
          satisfaction_rating: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          tenant_id?: number | null
          room_id?: number | null
          room_asset_id?: number | null
          subject: string
          description?: string | null
          category?: string | null
          priority?: DbPriorityType | null
          status?: DbTicketStatus | null
          assigned_to?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          resolution_cost?: number | null
          satisfaction_rating?: number | null
        }
        Update: {
          tenant_id?: number | null
          room_id?: number | null
          room_asset_id?: number | null
          subject?: string
          description?: string | null
          category?: string | null
          priority?: DbPriorityType | null
          status?: DbTicketStatus | null
          assigned_to?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          resolution_cost?: number | null
          satisfaction_rating?: number | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          id: number
          provider: string
          payload: Json
          received_at: string | null
          processed_at: string | null
          status: DbWebhookStatus | null
          retry_count: number | null
          error_message: string | null
          created_at: string | null
        }
        Insert: {
          provider: string
          payload: Json
          received_at?: string | null
          processed_at?: string | null
          status?: DbWebhookStatus | null
          retry_count?: number | null
          error_message?: string | null
        }
        Update: {
          provider?: string
          payload?: Json
          received_at?: string | null
          processed_at?: string | null
          status?: DbWebhookStatus | null
          retry_count?: number | null
          error_message?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vw_room_assets_warranty: {
        Row: {
          id: number | null
          room_id: number | null
          asset_id: number | null
          serial_number: string | null
          quantity: number | null
          status: DbAssetStatus | null
          condition_score: number | null
          purchase_date: string | null
          warranty_expiry: string | null
          last_maintenance: string | null
          maintenance_interval_months: number | null
          location_notes: string | null
          created_at: string | null
          updated_at: string | null
          is_under_warranty: boolean | null
        }
        Relationships: []
      }
      /**
       * PL-01 FIX: Added public_room_listings view to generated types.
       * This view must exist in the DB for the public listings feature to work.
       * If it does not exist, queries will return an empty array (gracefully caught).
       * SQL to create:
       *   CREATE OR REPLACE VIEW smartstay.public_room_listings AS
       *   SELECT r.id AS room_id, r.uuid AS room_uuid, r.room_code, r.room_type, ...
       *   FROM smartstay.rooms r JOIN smartstay.buildings b ON r.building_id = b.id
       *   WHERE r.status = 'available' AND r.is_deleted = false;
       */
      public_room_listings: {
        Row: {
          room_id: number
          room_uuid: string
          room_code: string
          room_type: string | null
          area_sqm: number | null
          base_rent: number | null
          max_occupants: number | null
          floor_number: number | null
          has_balcony: boolean | null
          has_private_bathroom: boolean | null
          facing: string | null
          condition_score: number | null
          room_amenities: unknown
          building_id: number
          building_uuid: string
          building_name: string
          building_address: string
          building_description: string | null
          building_amenities: unknown
          availability_status: string
        }
        Relationships: []
      }
    }
    Functions: {
      generate_code: {
        Args: { prefix: string; sequence_name: string }
        Returns: string
      }
    }
    Enums: {
      asset_status: DbAssetStatus
      balance_transaction_type: DbBalanceTransactionType
      contract_status: DbContractStatus
      deposit_status: DbDepositStatus
      gender_type: DbGenderType
      invoice_status: DbInvoiceStatus
      payment_method: DbPaymentMethod
      priority_type: DbPriorityType
      room_status: DbRoomStatus
      service_calc_type: DbServiceCalcType
      ticket_status: DbTicketStatus
      user_role: DbUserRole
      webhook_status: DbWebhookStatus
    }
  }
}
