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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          ip: string | null
          payload: Json
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
          payload?: Json
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
          payload?: Json
          target_user_id?: string | null
        }
        Relationships: []
      }
      background_check_events: {
        Row: {
          background_check_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json
          received_at: string
          signature_verified: boolean
          vendor: Database["public"]["Enums"]["background_check_vendor"]
          vendor_event_id: string
        }
        Insert: {
          background_check_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload: Json
          received_at?: string
          signature_verified?: boolean
          vendor: Database["public"]["Enums"]["background_check_vendor"]
          vendor_event_id: string
        }
        Update: {
          background_check_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          received_at?: string
          signature_verified?: boolean
          vendor?: Database["public"]["Enums"]["background_check_vendor"]
          vendor_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_check_events_background_check_id_fkey"
            columns: ["background_check_id"]
            isOneToOne: false
            referencedRelation: "provider_background_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          duration_minutes: number
          hourly_rate_cents: number
          id: string
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          payment_status: string
          provider_comment: string | null
          provider_id: string
          provider_rating: number | null
          reminder_sent_at: string | null
          scheduled_at: string
          senior_id: string
          service_type: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          hourly_rate_cents: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_status?: string
          provider_comment?: string | null
          provider_id: string
          provider_rating?: number | null
          reminder_sent_at?: string | null
          scheduled_at: string
          senior_id: string
          service_type?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          hourly_rate_cents?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_status?: string
          provider_comment?: string | null
          provider_id?: string
          provider_rating?: number | null
          reminder_sent_at?: string | null
          scheduled_at?: string
          senior_id?: string
          service_type?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcasts: {
        Row: {
          audience: Database["public"]["Enums"]["broadcast_audience"]
          body: string
          created_at: string
          created_by: string
          dismissible: boolean
          ends_at: string | null
          id: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["broadcast_audience"]
          body: string
          created_at?: string
          created_by: string
          dismissible?: boolean
          ends_at?: string | null
          id?: string
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["broadcast_audience"]
          body?: string
          created_at?: string
          created_by?: string
          dismissible?: boolean
          ends_at?: string | null
          id?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      change_requests: {
        Row: {
          created_at: string
          decline_reason: string | null
          expires_at: string
          id: string
          kind: Database["public"]["Enums"]["change_request_kind"]
          payload: Json
          reason: string
          requester_id: string
          resolved_at: string | null
          senior_id: string
          status: Database["public"]["Enums"]["change_request_status"]
          target_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          decline_reason?: string | null
          expires_at?: string
          id?: string
          kind: Database["public"]["Enums"]["change_request_kind"]
          payload?: Json
          reason: string
          requester_id: string
          resolved_at?: string | null
          senior_id: string
          status?: Database["public"]["Enums"]["change_request_status"]
          target_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          decline_reason?: string | null
          expires_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["change_request_kind"]
          payload?: Json
          reason?: string
          requester_id?: string
          resolved_at?: string | null
          senior_id?: string
          status?: Database["public"]["Enums"]["change_request_status"]
          target_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          participant_a: string
          participant_b: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          participant_a: string
          participant_b: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          participant_a?: string
          participant_b?: string
          updated_at?: string
        }
        Relationships: []
      }
      cs_tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          due_at: string | null
          id: string
          notes: string | null
          priority: Database["public"]["Enums"]["cs_task_priority"]
          status: Database["public"]["Enums"]["cs_task_status"]
          target_user_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["cs_task_priority"]
          status?: Database["public"]["Enums"]["cs_task_status"]
          target_user_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["cs_task_priority"]
          status?: Database["public"]["Enums"]["cs_task_status"]
          target_user_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_invites: {
        Row: {
          code: string
          created_at: string
          email: string | null
          expires_at: string
          id: string
          permission: string
          redeemed_at: string | null
          redeemed_by: string | null
          revoked_at: string | null
          senior_id: string
        }
        Insert: {
          code: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          permission?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          revoked_at?: string | null
          senior_id: string
        }
        Update: {
          code?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          permission?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          revoked_at?: string | null
          senior_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invites_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invites_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_links: {
        Row: {
          approved: boolean
          created_at: string
          family_id: string
          id: string
          permission: string
          senior_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          family_id: string
          id?: string
          permission?: string
          senior_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          family_id?: string
          id?: string
          permission?: string
          senior_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_links_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_links_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_notification_prefs: {
        Row: {
          created_at: string
          email: boolean
          push: boolean
          sms: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: boolean
          push?: boolean
          sms?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: boolean
          push?: boolean
          sms?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          key: string
          rollout_percent: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          key: string
          rollout_percent?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          key?: string
          rollout_percent?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          booking_id: string | null
          category: Database["public"]["Enums"]["incident_category"]
          created_at: string
          id: string
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: number
          status: Database["public"]["Enums"]["incident_status"]
          subject_user_id: string | null
          summary: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          category: Database["public"]["Enums"]["incident_category"]
          created_at?: string
          id?: string
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: number
          status?: Database["public"]["Enums"]["incident_status"]
          subject_user_id?: string | null
          summary: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          category?: Database["public"]["Enums"]["incident_category"]
          created_at?: string
          id?: string
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: number
          status?: Database["public"]["Enums"]["incident_status"]
          subject_user_id?: string | null
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      message_flags: {
        Row: {
          conversation_id: string
          created_at: string
          dismissed: boolean
          id: string
          matched_text: string | null
          message_id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          dismissed?: boolean
          id?: string
          matched_text?: string | null
          message_id: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          dismissed?: boolean
          id?: string
          matched_text?: string | null
          message_id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_flags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_flags_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link: string | null
          read_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          read_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          read_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_ledger: {
        Row: {
          amount_cents: number
          booking_id: string | null
          created_at: string
          currency: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id: string
          memo: string | null
          posted_at: string | null
          provider_id: string
          senior_id: string | null
          status: Database["public"]["Enums"]["ledger_status"]
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          stripe_transfer_id: string | null
          training_referral_id: string | null
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          amount_cents: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          memo?: string | null
          posted_at?: string | null
          provider_id: string
          senior_id?: string | null
          status?: Database["public"]["Enums"]["ledger_status"]
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          training_referral_id?: string | null
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          amount_cents?: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"]
          id?: string
          memo?: string | null
          posted_at?: string | null
          provider_id?: string
          senior_id?: string | null
          status?: Database["public"]["Enums"]["ledger_status"]
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          training_referral_id?: string | null
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_ledger_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_ledger_training_referral_id_fkey"
            columns: ["training_referral_id"]
            isOneToOne: false
            referencedRelation: "training_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_ledger_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          care_home_notes: string | null
          care_medical_notes: string | null
          care_no_go_notes: string | null
          care_notes: string | null
          city: string | null
          created_at: string
          deleted_at: string | null
          full_name: string | null
          id: string
          monthly_budget_cents: number | null
          onboarded_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          stripe_pm_brand: string | null
          stripe_pm_last4: string | null
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          care_home_notes?: string | null
          care_medical_notes?: string | null
          care_no_go_notes?: string | null
          care_notes?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id: string
          monthly_budget_cents?: number | null
          onboarded_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_pm_brand?: string | null
          stripe_pm_last4?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          care_home_notes?: string | null
          care_medical_notes?: string | null
          care_no_go_notes?: string | null
          care_notes?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id?: string
          monthly_budget_cents?: number | null
          onboarded_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_pm_brand?: string | null
          stripe_pm_last4?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_availability: {
        Row: {
          active: boolean
          created_at: string
          end_time: string
          id: string
          provider_id: string
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_time: string
          id?: string
          provider_id: string
          start_time: string
          updated_at?: string
          weekday: number
        }
        Update: {
          active?: boolean
          created_at?: string
          end_time?: string
          id?: string
          provider_id?: string
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_background_checks: {
        Row: {
          adjudication: Database["public"]["Enums"]["background_check_adjudication"]
          completed_at: string | null
          cost_cents: number | null
          created_at: string
          error_message: string | null
          id: string
          invitation_expires_at: string | null
          invitation_url: string | null
          ordered_at: string
          package_code: string
          package_tier: Database["public"]["Enums"]["background_check_package_tier"]
          provider_id: string
          raw_last_event: Json | null
          status: Database["public"]["Enums"]["background_check_status"]
          updated_at: string
          vendor: Database["public"]["Enums"]["background_check_vendor"]
          vendor_candidate_id: string | null
          vendor_report_id: string | null
        }
        Insert: {
          adjudication?: Database["public"]["Enums"]["background_check_adjudication"]
          completed_at?: string | null
          cost_cents?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          invitation_expires_at?: string | null
          invitation_url?: string | null
          ordered_at?: string
          package_code: string
          package_tier: Database["public"]["Enums"]["background_check_package_tier"]
          provider_id: string
          raw_last_event?: Json | null
          status?: Database["public"]["Enums"]["background_check_status"]
          updated_at?: string
          vendor: Database["public"]["Enums"]["background_check_vendor"]
          vendor_candidate_id?: string | null
          vendor_report_id?: string | null
        }
        Update: {
          adjudication?: Database["public"]["Enums"]["background_check_adjudication"]
          completed_at?: string | null
          cost_cents?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          invitation_expires_at?: string | null
          invitation_url?: string | null
          ordered_at?: string
          package_code?: string
          package_tier?: Database["public"]["Enums"]["background_check_package_tier"]
          provider_id?: string
          raw_last_event?: Json | null
          status?: Database["public"]["Enums"]["background_check_status"]
          updated_at?: string
          vendor?: Database["public"]["Enums"]["background_check_vendor"]
          vendor_candidate_id?: string | null
          vendor_report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_background_checks_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_capabilities: {
        Row: {
          capability_code: string
          created_at: string
          opted_in: boolean
          provider_id: string
        }
        Insert: {
          capability_code: string
          created_at?: string
          opted_in?: boolean
          provider_id: string
        }
        Update: {
          capability_code?: string
          created_at?: string
          opted_in?: boolean
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_capabilities_capability_code_fkey"
            columns: ["capability_code"]
            isOneToOne: false
            referencedRelation: "service_capabilities"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "provider_capabilities_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_consents: {
        Row: {
          created_at: string
          document_text_hash: string
          document_version: string
          id: string
          ip_address: unknown
          kind: Database["public"]["Enums"]["consent_kind"]
          provider_id: string
          signed_at: string
          signed_full_name: string
          state: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          document_text_hash: string
          document_version: string
          id?: string
          ip_address?: unknown
          kind: Database["public"]["Enums"]["consent_kind"]
          provider_id: string
          signed_at?: string
          signed_full_name: string
          state?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          document_text_hash?: string
          document_version?: string
          id?: string
          ip_address?: unknown
          kind?: Database["public"]["Enums"]["consent_kind"]
          provider_id?: string
          signed_at?: string
          signed_full_name?: string
          state?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_consents_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_credentials: {
        Row: {
          created_at: string
          document_path: string | null
          expires_on: string | null
          id: string
          issued_on: string | null
          issuing_state: string | null
          kind: Database["public"]["Enums"]["credential_kind"]
          notes: string | null
          provider_id: string
          source_ref: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_path?: string | null
          expires_on?: string | null
          id?: string
          issued_on?: string | null
          issuing_state?: string | null
          kind: Database["public"]["Enums"]["credential_kind"]
          notes?: string | null
          provider_id: string
          source_ref?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_path?: string | null
          expires_on?: string | null
          id?: string
          issued_on?: string | null
          issuing_state?: string | null
          kind?: Database["public"]["Enums"]["credential_kind"]
          notes?: string | null
          provider_id?: string
          source_ref?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_credentials_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_documents: {
        Row: {
          byte_size: number | null
          capture_metadata: Json
          created_at: string
          document_type: string | null
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["identity_document_kind"]
          mime_type: string | null
          provider_id: string
          rejected_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["identity_document_status"]
          storage_path: string
          updated_at: string
          uploaded_at: string
          width: number | null
        }
        Insert: {
          byte_size?: number | null
          capture_metadata?: Json
          created_at?: string
          document_type?: string | null
          height?: number | null
          id?: string
          kind: Database["public"]["Enums"]["identity_document_kind"]
          mime_type?: string | null
          provider_id: string
          rejected_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["identity_document_status"]
          storage_path: string
          updated_at?: string
          uploaded_at?: string
          width?: number | null
        }
        Update: {
          byte_size?: number | null
          capture_metadata?: Json
          created_at?: string
          document_type?: string | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["identity_document_kind"]
          mime_type?: string | null
          provider_id?: string
          rejected_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["identity_document_status"]
          storage_path?: string
          updated_at?: string
          uploaded_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_documents_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_identity: {
        Row: {
          address_history: Json
          created_at: string
          current_address: Json | null
          date_of_birth: string | null
          drivers_license_expires_on: string | null
          drivers_license_number: string | null
          drivers_license_state: string | null
          email: string | null
          identity_completed_at: string | null
          legal_first_name: string | null
          legal_last_name: string | null
          legal_middle_name: string | null
          other_names_used: Json
          phone: string | null
          provider_id: string
          ssn_last4: string | null
          ssn_provided_at: string | null
          updated_at: string
        }
        Insert: {
          address_history?: Json
          created_at?: string
          current_address?: Json | null
          date_of_birth?: string | null
          drivers_license_expires_on?: string | null
          drivers_license_number?: string | null
          drivers_license_state?: string | null
          email?: string | null
          identity_completed_at?: string | null
          legal_first_name?: string | null
          legal_last_name?: string | null
          legal_middle_name?: string | null
          other_names_used?: Json
          phone?: string | null
          provider_id: string
          ssn_last4?: string | null
          ssn_provided_at?: string | null
          updated_at?: string
        }
        Update: {
          address_history?: Json
          created_at?: string
          current_address?: Json | null
          date_of_birth?: string | null
          drivers_license_expires_on?: string | null
          drivers_license_number?: string | null
          drivers_license_state?: string | null
          email?: string | null
          identity_completed_at?: string | null
          legal_first_name?: string | null
          legal_last_name?: string | null
          legal_middle_name?: string | null
          other_names_used?: Json
          phone?: string | null
          provider_id?: string
          ssn_last4?: string | null
          ssn_provided_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_identity_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_identity_verifications: {
        Row: {
          client_secret: string | null
          created_at: string
          hosted_url: string | null
          id: string
          last_error: string | null
          provider_id: string
          raw_last_event: Json | null
          status: Database["public"]["Enums"]["idv_status"]
          updated_at: string
          vendor: string
          vendor_report_id: string | null
          vendor_session_id: string | null
          verified_at: string | null
        }
        Insert: {
          client_secret?: string | null
          created_at?: string
          hosted_url?: string | null
          id?: string
          last_error?: string | null
          provider_id: string
          raw_last_event?: Json | null
          status?: Database["public"]["Enums"]["idv_status"]
          updated_at?: string
          vendor?: string
          vendor_report_id?: string | null
          vendor_session_id?: string | null
          verified_at?: string | null
        }
        Update: {
          client_secret?: string | null
          created_at?: string
          hosted_url?: string | null
          id?: string
          last_error?: string | null
          provider_id?: string
          raw_last_event?: Json | null
          status?: Database["public"]["Enums"]["idv_status"]
          updated_at?: string
          vendor?: string
          vendor_report_id?: string | null
          vendor_session_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      provider_module_completions: {
        Row: {
          attempts: number
          created_at: string
          id: string
          module_code: string
          passed: boolean
          passed_at: string | null
          provider_id: string
          score: number
          total: number
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          module_code: string
          passed: boolean
          passed_at?: string | null
          provider_id: string
          score: number
          total: number
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          module_code?: string
          passed?: boolean
          passed_at?: string | null
          provider_id?: string
          score?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_module_completions_module_code_fkey"
            columns: ["module_code"]
            isOneToOne: false
            referencedRelation: "provider_training_modules"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "provider_module_completions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_onboarding_events: {
        Row: {
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          provider_id: string
          step: string | null
        }
        Insert: {
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          provider_id: string
          step?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          provider_id?: string
          step?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_onboarding_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_time_off: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          provider_id: string
          reason: string | null
          starts_on: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          provider_id: string
          reason?: string | null
          starts_on: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          provider_id?: string
          reason?: string | null
          starts_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_time_off_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_training_modules: {
        Row: {
          code: string
          created_at: string
          is_active: boolean
          pass_threshold: number
          required_for_tier: number
          title: string
          total_questions: number
          version: number
        }
        Insert: {
          code: string
          created_at?: string
          is_active?: boolean
          pass_threshold?: number
          required_for_tier?: number
          title: string
          total_questions?: number
          version?: number
        }
        Update: {
          code?: string
          created_at?: string
          is_active?: boolean
          pass_threshold?: number
          required_for_tier?: number
          title?: string
          total_questions?: number
          version?: number
        }
        Relationships: []
      }
      providers: {
        Row: {
          acknowledged_serious_at: string | null
          bio: string | null
          created_at: string
          headline: string | null
          hourly_rate_cents: number
          id: string
          is_active: boolean
          languages: string[]
          last_onboarding_activity_at: string | null
          motivation: string | null
          onboarding_step: number
          rating_avg: number | null
          rating_count: number
          reengagement_paused_at: string | null
          reengagement_stage: number
          service_area: string | null
          service_tier: number
          specialties: string[]
          stripe_account_id: string | null
          stripe_charges_enabled: boolean
          stripe_details_submitted: boolean
          stripe_payouts_enabled: boolean
          tier: Database["public"]["Enums"]["provider_tier"]
          updated_at: string
          verification_state: Database["public"]["Enums"]["provider_verification_state"]
          years_experience: number | null
        }
        Insert: {
          acknowledged_serious_at?: string | null
          bio?: string | null
          created_at?: string
          headline?: string | null
          hourly_rate_cents?: number
          id: string
          is_active?: boolean
          languages?: string[]
          last_onboarding_activity_at?: string | null
          motivation?: string | null
          onboarding_step?: number
          rating_avg?: number | null
          rating_count?: number
          reengagement_paused_at?: string | null
          reengagement_stage?: number
          service_area?: string | null
          service_tier?: number
          specialties?: string[]
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_details_submitted?: boolean
          stripe_payouts_enabled?: boolean
          tier?: Database["public"]["Enums"]["provider_tier"]
          updated_at?: string
          verification_state?: Database["public"]["Enums"]["provider_verification_state"]
          years_experience?: number | null
        }
        Update: {
          acknowledged_serious_at?: string | null
          bio?: string | null
          created_at?: string
          headline?: string | null
          hourly_rate_cents?: number
          id?: string
          is_active?: boolean
          languages?: string[]
          last_onboarding_activity_at?: string | null
          motivation?: string | null
          onboarding_step?: number
          rating_avg?: number | null
          rating_count?: number
          reengagement_paused_at?: string | null
          reengagement_stage?: number
          service_area?: string | null
          service_tier?: number
          specialties?: string[]
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_details_submitted?: boolean
          stripe_payouts_enabled?: boolean
          tier?: Database["public"]["Enums"]["provider_tier"]
          updated_at?: string
          verification_state?: Database["public"]["Enums"]["provider_verification_state"]
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      senior_invites: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          family_id: string
          id: string
          permission: string
          redeemed_at: string | null
          redeemed_by: string | null
          relationship: string | null
          revoked_at: string | null
          senior_email: string | null
          senior_name: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          family_id: string
          id?: string
          permission?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          relationship?: string | null
          revoked_at?: string | null
          senior_email?: string | null
          senior_name?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          family_id?: string
          id?: string
          permission?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          relationship?: string | null
          revoked_at?: string | null
          senior_email?: string | null
          senior_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "senior_invites_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "senior_invites_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      senior_preferences: {
        Row: {
          call_for_changes: boolean
          care_needs: string[]
          created_at: string
          extras_monthly_budget_cents: number
          family_can_edit: boolean
          family_can_see: boolean
          high_contrast: boolean
          notify_before_visit: boolean
          reduce_motion: boolean
          text_size: Database["public"]["Enums"]["text_size"]
          updated_at: string
          user_id: string
        }
        Insert: {
          call_for_changes?: boolean
          care_needs?: string[]
          created_at?: string
          extras_monthly_budget_cents?: number
          family_can_edit?: boolean
          family_can_see?: boolean
          high_contrast?: boolean
          notify_before_visit?: boolean
          reduce_motion?: boolean
          text_size?: Database["public"]["Enums"]["text_size"]
          updated_at?: string
          user_id: string
        }
        Update: {
          call_for_changes?: boolean
          care_needs?: string[]
          created_at?: string
          extras_monthly_budget_cents?: number
          family_can_edit?: boolean
          family_can_see?: boolean
          high_contrast?: boolean
          notify_before_visit?: boolean
          reduce_motion?: boolean
          text_size?: Database["public"]["Enums"]["text_size"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_capabilities: {
        Row: {
          active: boolean
          category: string
          code: string
          description: string | null
          label: string
          required_credential:
            | Database["public"]["Enums"]["credential_kind"]
            | null
          required_tier: number
          sort_order: number
        }
        Insert: {
          active?: boolean
          category: string
          code: string
          description?: string | null
          label: string
          required_credential?:
            | Database["public"]["Enums"]["credential_kind"]
            | null
          required_tier?: number
          sort_order?: number
        }
        Update: {
          active?: boolean
          category?: string
          code?: string
          description?: string | null
          label?: string
          required_credential?:
            | Database["public"]["Enums"]["credential_kind"]
            | null
          required_tier?: number
          sort_order?: number
        }
        Relationships: []
      }
      staff_impersonation_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          expires_at: string
          id: string
          reason: string
          staff_id: string
          target_user_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          expires_at: string
          id?: string
          reason: string
          staff_id: string
          target_user_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          expires_at?: string
          id?: string
          reason?: string
          staff_id?: string
          target_user_id?: string
          token_hash?: string
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          internal: boolean
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          internal?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assignee_id: string | null
          body: string
          category: string | null
          created_at: string
          id: string
          last_activity_at: string
          portal: Database["public"]["Enums"]["support_portal"]
          priority: Database["public"]["Enums"]["support_priority"]
          requester_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          body: string
          category?: string | null
          created_at?: string
          id?: string
          last_activity_at?: string
          portal?: Database["public"]["Enums"]["support_portal"]
          priority?: Database["public"]["Enums"]["support_priority"]
          requester_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          body?: string
          category?: string | null
          created_at?: string
          id?: string
          last_activity_at?: string
          portal?: Database["public"]["Enums"]["support_portal"]
          priority?: Database["public"]["Enums"]["support_priority"]
          requester_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_programs: {
        Row: {
          active: boolean
          bounty_cents: number
          city: string | null
          cost_cents: number | null
          created_at: string
          credential_kind: Database["public"]["Enums"]["credential_kind"]
          description: string | null
          duration_weeks: number | null
          format: string | null
          id: string
          name: string
          our_referral_id: string
          provider_org: string
          state: string | null
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          bounty_cents?: number
          city?: string | null
          cost_cents?: number | null
          created_at?: string
          credential_kind: Database["public"]["Enums"]["credential_kind"]
          description?: string | null
          duration_weeks?: number | null
          format?: string | null
          id?: string
          name: string
          our_referral_id: string
          provider_org: string
          state?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          bounty_cents?: number
          city?: string | null
          cost_cents?: number | null
          created_at?: string
          credential_kind?: Database["public"]["Enums"]["credential_kind"]
          description?: string | null
          duration_weeks?: number | null
          format?: string | null
          id?: string
          name?: string
          our_referral_id?: string
          provider_org?: string
          state?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      training_referrals: {
        Row: {
          applied_at: string | null
          clicked_at: string
          completed_at: string | null
          created_at: string
          enrolled_at: string | null
          external_ref: string | null
          id: string
          payout_cents: number
          payout_status: Database["public"]["Enums"]["referral_payout_status"]
          program_id: string
          provider_id: string
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          clicked_at?: string
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string | null
          external_ref?: string | null
          id?: string
          payout_cents?: number
          payout_status?: Database["public"]["Enums"]["referral_payout_status"]
          program_id: string
          provider_id: string
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          clicked_at?: string
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string | null
          external_ref?: string | null
          id?: string
          payout_cents?: number
          payout_status?: Database["public"]["Enums"]["referral_payout_status"]
          program_id?: string
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_referrals_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_referrals_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_legal_acceptances: {
        Row: {
          accepted_at: string
          document_hash: string
          document_version: string
          id: string
          ip_address: string | null
          kind: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          document_hash: string
          document_version: string
          id?: string
          ip_address?: string | null
          kind: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          document_hash?: string
          document_version?: string
          id?: string
          ip_address?: string | null
          kind?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verifications: {
        Row: {
          created_at: string
          expires_on: string | null
          id: string
          kind: Database["public"]["Enums"]["verification_kind"]
          provider_id: string
          status: Database["public"]["Enums"]["verification_status"]
          vendor: string | null
          verified_on: string | null
        }
        Insert: {
          created_at?: string
          expires_on?: string | null
          id?: string
          kind: Database["public"]["Enums"]["verification_kind"]
          provider_id: string
          status?: Database["public"]["Enums"]["verification_status"]
          vendor?: string | null
          verified_on?: string | null
        }
        Update: {
          created_at?: string
          expires_on?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["verification_kind"]
          provider_id?: string
          status?: Database["public"]["Enums"]["verification_status"]
          vendor?: string | null
          verified_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verifications_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_bonuses: {
        Row: {
          amount_cents: number
          awarded_at: string
          created_at: string
          id: string
          ledger_id: string | null
          milestone: number
          provider_id: string
          senior_id: string
          visit_id: string | null
        }
        Insert: {
          amount_cents: number
          awarded_at?: string
          created_at?: string
          id?: string
          ledger_id?: string | null
          milestone: number
          provider_id: string
          senior_id: string
          visit_id?: string | null
        }
        Update: {
          amount_cents?: number
          awarded_at?: string
          created_at?: string
          id?: string
          ledger_id?: string | null
          milestone?: number
          provider_id?: string
          senior_id?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_bonuses_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "payment_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_bonuses_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_bonuses_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_bonuses_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_extras: {
        Row: {
          amount_cents: number
          booking_id: string
          created_at: string
          created_by: string
          id: string
          kind: string
          note: string | null
          status: string
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          amount_cents: number
          booking_id: string
          created_at?: string
          created_by: string
          id?: string
          kind: string
          note?: string | null
          status?: string
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          amount_cents?: number
          booking_id?: string
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          note?: string | null
          status?: string
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_extras_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_extras_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          booking_id: string
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_lat: number | null
          checkin_lng: number | null
          checkout_summary_text: string | null
          checkout_voice_url: string | null
          created_at: string
          id: string
          plan_items: Json
          provider_notes: string | null
          rated_at: string | null
          senior_comment: string | null
          senior_rating: string | null
          senior_rating_num: number | null
        }
        Insert: {
          booking_id: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          checkin_lat?: number | null
          checkin_lng?: number | null
          checkout_summary_text?: string | null
          checkout_voice_url?: string | null
          created_at?: string
          id?: string
          plan_items?: Json
          provider_notes?: string | null
          rated_at?: string | null
          senior_comment?: string | null
          senior_rating?: string | null
          senior_rating_num?: number | null
        }
        Update: {
          booking_id?: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          checkin_lat?: number | null
          checkin_lng?: number | null
          checkout_summary_text?: string | null
          checkout_voice_url?: string | null
          created_at?: string
          id?: string
          plan_items?: Json
          provider_notes?: string | null
          rated_at?: string | null
          senior_comment?: string | null
          senior_rating?: string | null
          senior_rating_num?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_change_request: {
        Args: { _actor_id: string; _request_id: string }
        Returns: undefined
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recompute_provider_verification_state: {
        Args: { _provider_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "senior"
        | "family"
        | "provider"
        | "admin"
        | "staff"
        | "support"
        | "finance"
        | "success"
        | "trust_safety"
      background_check_adjudication:
        | "pending"
        | "engaged"
        | "pre_adverse_action"
        | "adverse_action"
        | "cleared"
      background_check_package_tier:
        | "basic"
        | "basic_plus"
        | "enhanced"
        | "enhanced_plus_mvr"
      background_check_status:
        | "created"
        | "invitation_sent"
        | "pending_candidate_info"
        | "pending_vendor"
        | "clear"
        | "consider"
        | "suspended"
        | "dispute"
        | "canceled"
        | "error"
      background_check_vendor:
        | "certn"
        | "checkr"
        | "yardstik"
        | "goodhire"
        | "manual"
      booking_status:
        | "requested"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      broadcast_audience: "all" | "senior" | "family" | "provider" | "staff"
      change_request_kind:
        | "budget"
        | "permission"
        | "cancel_visit"
        | "care_note"
      change_request_status:
        | "pending"
        | "approved"
        | "declined"
        | "expired"
        | "cancelled"
      consent_kind:
        | "fcra_disclosure"
        | "fcra_summary_of_rights"
        | "background_check_authorization"
        | "investigative_consumer_report"
        | "continuous_monitoring"
        | "mvr_authorization"
        | "state_addendum_ca"
        | "state_addendum_ny"
        | "state_addendum_wa"
        | "state_addendum_ma"
        | "state_addendum_nj"
        | "state_addendum_mn"
      credential_kind:
        | "background_check"
        | "id_verification"
        | "tb_test"
        | "cpr"
        | "first_aid"
        | "pca"
        | "hha"
        | "cna"
        | "med_tech"
        | "phlebotomy"
        | "lpn"
        | "rn"
        | "driver_license"
        | "auto_insurance"
      cs_task_priority: "low" | "normal" | "high"
      cs_task_status: "open" | "in_progress" | "done" | "snoozed"
      identity_document_kind:
        | "id_front"
        | "id_back"
        | "selfie_liveness"
        | "selfie_with_id"
        | "proof_of_address"
        | "ssn_card"
        | "passport"
      identity_document_status:
        | "uploaded"
        | "accepted"
        | "rejected"
        | "superseded"
      idv_status:
        | "not_started"
        | "processing"
        | "requires_input"
        | "verified"
        | "canceled"
        | "failed"
      incident_category:
        | "no_show"
        | "safety"
        | "abuse"
        | "theft"
        | "quality"
        | "billing"
        | "other"
      incident_status: "open" | "triaged" | "resolved" | "dismissed"
      ledger_entry_type:
        | "charge"
        | "platform_fee"
        | "provider_payout"
        | "refund"
        | "adjustment"
      ledger_status: "pending" | "posted" | "reversed"
      notification_kind:
        | "booking_request"
        | "booking_accepted"
        | "booking_declined"
        | "visit_check_in"
        | "visit_check_out"
        | "message"
        | "invite_redeemed"
        | "verification_update"
        | "payout_posted"
        | "system"
      provider_tier: "bronze" | "silver" | "gold"
      provider_verification_state:
        | "pending"
        | "provisional"
        | "verified"
        | "suspended"
      referral_payout_status: "none" | "pending" | "posted" | "void"
      support_portal: "senior" | "family" | "provider" | "other"
      support_priority: "low" | "normal" | "high" | "urgent"
      support_status: "open" | "pending" | "resolved" | "closed"
      text_size: "normal" | "large" | "xlarge"
      verification_kind:
        | "id_check"
        | "background_check"
        | "license_check"
        | "references"
        | "insurance"
      verification_status: "pending" | "passed" | "failed" | "expired"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: [
        "senior",
        "family",
        "provider",
        "admin",
        "staff",
        "support",
        "finance",
        "success",
        "trust_safety",
      ],
      background_check_adjudication: [
        "pending",
        "engaged",
        "pre_adverse_action",
        "adverse_action",
        "cleared",
      ],
      background_check_package_tier: [
        "basic",
        "basic_plus",
        "enhanced",
        "enhanced_plus_mvr",
      ],
      background_check_status: [
        "created",
        "invitation_sent",
        "pending_candidate_info",
        "pending_vendor",
        "clear",
        "consider",
        "suspended",
        "dispute",
        "canceled",
        "error",
      ],
      background_check_vendor: [
        "certn",
        "checkr",
        "yardstik",
        "goodhire",
        "manual",
      ],
      booking_status: [
        "requested",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      broadcast_audience: ["all", "senior", "family", "provider", "staff"],
      change_request_kind: [
        "budget",
        "permission",
        "cancel_visit",
        "care_note",
      ],
      change_request_status: [
        "pending",
        "approved",
        "declined",
        "expired",
        "cancelled",
      ],
      consent_kind: [
        "fcra_disclosure",
        "fcra_summary_of_rights",
        "background_check_authorization",
        "investigative_consumer_report",
        "continuous_monitoring",
        "mvr_authorization",
        "state_addendum_ca",
        "state_addendum_ny",
        "state_addendum_wa",
        "state_addendum_ma",
        "state_addendum_nj",
        "state_addendum_mn",
      ],
      credential_kind: [
        "background_check",
        "id_verification",
        "tb_test",
        "cpr",
        "first_aid",
        "pca",
        "hha",
        "cna",
        "med_tech",
        "phlebotomy",
        "lpn",
        "rn",
        "driver_license",
        "auto_insurance",
      ],
      cs_task_priority: ["low", "normal", "high"],
      cs_task_status: ["open", "in_progress", "done", "snoozed"],
      identity_document_kind: [
        "id_front",
        "id_back",
        "selfie_liveness",
        "selfie_with_id",
        "proof_of_address",
        "ssn_card",
        "passport",
      ],
      identity_document_status: [
        "uploaded",
        "accepted",
        "rejected",
        "superseded",
      ],
      idv_status: [
        "not_started",
        "processing",
        "requires_input",
        "verified",
        "canceled",
        "failed",
      ],
      incident_category: [
        "no_show",
        "safety",
        "abuse",
        "theft",
        "quality",
        "billing",
        "other",
      ],
      incident_status: ["open", "triaged", "resolved", "dismissed"],
      ledger_entry_type: [
        "charge",
        "platform_fee",
        "provider_payout",
        "refund",
        "adjustment",
      ],
      ledger_status: ["pending", "posted", "reversed"],
      notification_kind: [
        "booking_request",
        "booking_accepted",
        "booking_declined",
        "visit_check_in",
        "visit_check_out",
        "message",
        "invite_redeemed",
        "verification_update",
        "payout_posted",
        "system",
      ],
      provider_tier: ["bronze", "silver", "gold"],
      provider_verification_state: [
        "pending",
        "provisional",
        "verified",
        "suspended",
      ],
      referral_payout_status: ["none", "pending", "posted", "void"],
      support_portal: ["senior", "family", "provider", "other"],
      support_priority: ["low", "normal", "high", "urgent"],
      support_status: ["open", "pending", "resolved", "closed"],
      text_size: ["normal", "large", "xlarge"],
      verification_kind: [
        "id_check",
        "background_check",
        "license_check",
        "references",
        "insurance",
      ],
      verification_status: ["pending", "passed", "failed", "expired"],
    },
  },
} as const
