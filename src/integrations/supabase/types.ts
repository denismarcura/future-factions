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
  public: {
    Tables: {
      admin_prizes: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          estimated_value: number | null
          id: string
          image_url: string | null
          name: string
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          id?: string
          image_url?: string | null
          name: string
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          id?: string
          image_url?: string | null
          name?: string
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      challenge_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      challenge_ratings: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      challenge_result_audit: {
        Row: {
          challenge_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_result: Json | null
          notes: string | null
          previous_result: Json | null
          source: string
        }
        Insert: {
          challenge_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_result?: Json | null
          notes?: string | null
          previous_result?: Json | null
          source: string
        }
        Update: {
          challenge_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_result?: Json | null
          notes?: string | null
          previous_result?: Json | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_result_audit_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_results_log: {
        Row: {
          challenge_id: string
          confidence: number | null
          created_at: string
          error: string | null
          id: string
          payload: Json | null
          source: string | null
          status_at_check:
            | Database["public"]["Enums"]["apuration_status"]
            | null
          triggered_by: string | null
        }
        Insert: {
          challenge_id: string
          confidence?: number | null
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          source?: string | null
          status_at_check?:
            | Database["public"]["Enums"]["apuration_status"]
            | null
          triggered_by?: string | null
        }
        Update: {
          challenge_id?: string
          confidence?: number | null
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          source?: string | null
          status_at_check?:
            | Database["public"]["Enums"]["apuration_status"]
            | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_results_log_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "challenge_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_winners: {
        Row: {
          challenge_id: string
          created_at: string
          email_notified_at: string | null
          id: string
          notes: string | null
          palpite_id: string | null
          reason: string
          released_at: string | null
          released_by: string | null
          status: Database["public"]["Enums"]["winner_payout_status"]
          tokens: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          email_notified_at?: string | null
          id?: string
          notes?: string | null
          palpite_id?: string | null
          reason: string
          released_at?: string | null
          released_by?: string | null
          status?: Database["public"]["Enums"]["winner_payout_status"]
          tokens?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          email_notified_at?: string | null
          id?: string
          notes?: string | null
          palpite_id?: string | null
          reason?: string
          released_at?: string | null
          released_by?: string | null
          status?: Database["public"]["Enums"]["winner_payout_status"]
          tokens?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_winners_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_winners_palpite_id_fkey"
            columns: ["palpite_id"]
            isOneToOne: false
            referencedRelation: "palpites"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          apuration_status: Database["public"]["Enums"]["apuration_status"]
          away_flag_code: string | null
          away_score: number | null
          away_team: string | null
          category: string | null
          closes_at: string | null
          created_at: string
          description: string | null
          entry_fee: number
          fifa_match_id: string | null
          fifa_match_url: string | null
          home_flag_code: string | null
          home_score: number | null
          home_team: string | null
          id: string
          image_url: string | null
          is_draw: boolean | null
          is_physical_prize: boolean
          match_date: string | null
          match_kickoff: string | null
          match_status: string | null
          match_time: string | null
          owner_id: string | null
          prize_pool: number
          result_checked_at: string | null
          result_confirmed_at: string | null
          result_payload_json: Json | null
          result_source: string | null
          title: string
          updated_at: string
          winner_team: string | null
        }
        Insert: {
          apuration_status?: Database["public"]["Enums"]["apuration_status"]
          away_flag_code?: string | null
          away_score?: number | null
          away_team?: string | null
          category?: string | null
          closes_at?: string | null
          created_at?: string
          description?: string | null
          entry_fee?: number
          fifa_match_id?: string | null
          fifa_match_url?: string | null
          home_flag_code?: string | null
          home_score?: number | null
          home_team?: string | null
          id?: string
          image_url?: string | null
          is_draw?: boolean | null
          is_physical_prize?: boolean
          match_date?: string | null
          match_kickoff?: string | null
          match_status?: string | null
          match_time?: string | null
          owner_id?: string | null
          prize_pool?: number
          result_checked_at?: string | null
          result_confirmed_at?: string | null
          result_payload_json?: Json | null
          result_source?: string | null
          title: string
          updated_at?: string
          winner_team?: string | null
        }
        Update: {
          apuration_status?: Database["public"]["Enums"]["apuration_status"]
          away_flag_code?: string | null
          away_score?: number | null
          away_team?: string | null
          category?: string | null
          closes_at?: string | null
          created_at?: string
          description?: string | null
          entry_fee?: number
          fifa_match_id?: string | null
          fifa_match_url?: string | null
          home_flag_code?: string | null
          home_score?: number | null
          home_team?: string | null
          id?: string
          image_url?: string | null
          is_draw?: boolean | null
          is_physical_prize?: boolean
          match_date?: string | null
          match_kickoff?: string | null
          match_status?: string | null
          match_time?: string | null
          owner_id?: string | null
          prize_pool?: number
          result_checked_at?: string | null
          result_confirmed_at?: string | null
          result_payload_json?: Json | null
          result_source?: string | null
          title?: string
          updated_at?: string
          winner_team?: string | null
        }
        Relationships: []
      }
      corporate_challenges: {
        Row: {
          banner_url: string | null
          category: string | null
          company_name: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          instagram_arts: Json
          invite_reward_text: string | null
          logo_url: string | null
          missions: Json
          owner_id: string | null
          participants: number
          prize_name: string | null
          regulation: string | null
          starts_at: string
          status: string
          subcategory: string | null
          subs: Json
          tiebreaker: string | null
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          category?: string | null
          company_name?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id: string
          instagram_arts?: Json
          invite_reward_text?: string | null
          logo_url?: string | null
          missions?: Json
          owner_id?: string | null
          participants?: number
          prize_name?: string | null
          regulation?: string | null
          starts_at?: string
          status?: string
          subcategory?: string | null
          subs?: Json
          tiebreaker?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          category?: string | null
          company_name?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          instagram_arts?: Json
          invite_reward_text?: string | null
          logo_url?: string | null
          missions?: Json
          owner_id?: string | null
          participants?: number
          prize_name?: string | null
          regulation?: string | null
          starts_at?: string
          status?: string
          subcategory?: string | null
          subs?: Json
          tiebreaker?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          challenge_id: string
          created_at: string
          error: string | null
          id: string
          points: number | null
          position: number | null
          recipient_email: string
          sent_at: string | null
          status: string
          template: string
          tokens: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          error?: string | null
          id?: string
          points?: number | null
          position?: number | null
          recipient_email: string
          sent_at?: string | null
          status?: string
          template: string
          tokens?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          error?: string | null
          id?: string
          points?: number | null
          position?: number | null
          recipient_email?: string
          sent_at?: string | null
          status?: string
          template?: string
          tokens?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      mission_claims: {
        Row: {
          context: string
          created_at: string
          id: string
          mission_id: string
          tokens_awarded: number
          user_id: string
        }
        Insert: {
          context?: string
          created_at?: string
          id?: string
          mission_id: string
          tokens_awarded?: number
          user_id: string
        }
        Update: {
          context?: string
          created_at?: string
          id?: string
          mission_id?: string
          tokens_awarded?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_claims_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          action_type: string
          active: boolean
          bonus_tokens: number
          created_at: string
          id: string
          link: string
          platform: string
          sponsor_name: string
          title: string
          tokens: number
          updated_at: string
        }
        Insert: {
          action_type: string
          active?: boolean
          bonus_tokens?: number
          created_at?: string
          id?: string
          link: string
          platform: string
          sponsor_name: string
          title: string
          tokens?: number
          updated_at?: string
        }
        Update: {
          action_type?: string
          active?: boolean
          bonus_tokens?: number
          created_at?: string
          id?: string
          link?: string
          platform?: string
          sponsor_name?: string
          title?: string
          tokens?: number
          updated_at?: string
        }
        Relationships: []
      }
      palpites: {
        Row: {
          challenge_id: string
          created_at: string
          evaluated_at: string | null
          id: string
          is_correct: boolean | null
          kind: Database["public"]["Enums"]["palpite_kind"]
          option_value: string | null
          predicted_away_score: number | null
          predicted_home_score: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          evaluated_at?: string | null
          id?: string
          is_correct?: boolean | null
          kind: Database["public"]["Enums"]["palpite_kind"]
          option_value?: string | null
          predicted_away_score?: number | null
          predicted_home_score?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          evaluated_at?: string | null
          id?: string
          is_correct?: boolean | null
          kind?: Database["public"]["Enums"]["palpite_kind"]
          option_value?: string | null
          predicted_away_score?: number | null
          predicted_home_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "palpites_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          full_name: string | null
          id: string
          instagram: string | null
          marketing_opt_in: boolean
          numero: string | null
          provider: string | null
          signup_city: string | null
          signup_ip: string | null
          status: string
          terms_accepted_at: string | null
          updated_at: string
          welcome_bonus: number
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          full_name?: string | null
          id: string
          instagram?: string | null
          marketing_opt_in?: boolean
          numero?: string | null
          provider?: string | null
          signup_city?: string | null
          signup_ip?: string | null
          status?: string
          terms_accepted_at?: string | null
          updated_at?: string
          welcome_bonus?: number
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          full_name?: string | null
          id?: string
          instagram?: string | null
          marketing_opt_in?: boolean
          numero?: string | null
          provider?: string | null
          signup_city?: string | null
          signup_ip?: string | null
          status?: string
          terms_accepted_at?: string | null
          updated_at?: string
          welcome_bonus?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      signup_attempts: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          id: string
          ip: string
          user_id: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip: string
          user_id?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          ip?: string
          user_id?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          challenge_id: string | null
          created_at: string
          delta: number
          id: string
          reason: string
          user_id: string
          winner_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          created_at?: string
          delta: number
          id?: string
          reason: string
          user_id: string
          winner_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          user_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_transactions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_transactions_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "challenge_winners"
            referencedColumns: ["id"]
          },
        ]
      }
      top100_snapshots: {
        Row: {
          challenges_count: number
          created_at: string
          id: string
          month_key: string
          points: number
          rank: number
          total_participants: number
          user_id: string
        }
        Insert: {
          challenges_count?: number
          created_at?: string
          id?: string
          month_key: string
          points?: number
          rank: number
          total_participants?: number
          user_id: string
        }
        Update: {
          challenges_count?: number
          created_at?: string
          id?: string
          month_key?: string
          points?: number
          rank?: number
          total_participants?: number
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
      world_cup_results: {
        Row: {
          away_score: number
          away_team: string
          created_at: string
          home_score: number
          home_team: string
          id: string
          image_url: string | null
          match_date: string
          status: string
          updated_at: string
        }
        Insert: {
          away_score?: number
          away_team: string
          created_at?: string
          home_score?: number
          home_team: string
          id?: string
          image_url?: string | null
          match_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          away_score?: number
          away_team?: string
          created_at?: string
          home_score?: number
          home_team?: string
          id?: string
          image_url?: string | null
          match_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      apuration_status:
        | "aguardando_jogo"
        | "jogo_em_andamento"
        | "aguardando_resultado"
        | "resultado_encontrado"
        | "apurado_automaticamente"
        | "requer_revisao_manual"
        | "finalizado"
        | "erro_na_consulta"
      palpite_kind:
        | "vencedor"
        | "empate"
        | "placar_exato"
        | "mais_2"
        | "menos_2"
        | "ambos_marcam"
      winner_payout_status:
        | "pendente"
        | "liberado"
        | "aguardando_premio_fisico"
        | "cancelado"
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
  public: {
    Enums: {
      app_role: ["admin", "user"],
      apuration_status: [
        "aguardando_jogo",
        "jogo_em_andamento",
        "aguardando_resultado",
        "resultado_encontrado",
        "apurado_automaticamente",
        "requer_revisao_manual",
        "finalizado",
        "erro_na_consulta",
      ],
      palpite_kind: [
        "vencedor",
        "empate",
        "placar_exato",
        "mais_2",
        "menos_2",
        "ambos_marcam",
      ],
      winner_payout_status: [
        "pendente",
        "liberado",
        "aguardando_premio_fisico",
        "cancelado",
      ],
    },
  },
} as const
