export type UserRole = "therapist" | "client";
export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";
export type TemplateKind = "check_in" | "prompt";
export type CheckInFrequency = "daily" | "weekly" | "biweekly" | "monthly";
export type BookStatus = "recommended" | "optional" | "advanced";
export type AssignmentStatus = "assigned" | "completed";
export type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "scale"
  | "slider"
  | "yes_no"
  | "short_reflection";

export interface QuestionConfig {
  options?: string[];
  min?: number;
  max?: number;
  max_length?: number;
}

export type AnswerValue = string | string[] | number | boolean;

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          role: UserRole;
          first_name: string;
          last_name: string;
          email: string;
          is_active: boolean;
          preferred_checkin_frequency: CheckInFrequency;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          first_name: string;
          last_name: string;
          email: string;
          is_active?: boolean;
          preferred_checkin_frequency?: CheckInFrequency;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      invitations: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          token: string;
          status: InvitationStatus;
          invited_by: string;
          created_at: string;
          expires_at: string;
          accepted_at: string | null;
        };
        Insert: {
          email: string;
          first_name: string;
          last_name: string;
          invited_by: string;
          status?: InvitationStatus;
          expires_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invitations"]["Insert"]>;
      };
      settings: {
        Row: {
          id: true;
          practice_name: string;
          primary_color: string;
          accent_color: string;
          welcome_message: string;
          session_timeout_minutes: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["settings"]["Row"]>;
      };
      access_gate: {
        Row: { id: true; code: string; updated_at: string };
        Insert: { code: string };
        Update: { code: string };
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string;
          action: string;
          target_type: string | null;
          target_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          actor_id: string;
          action: string;
          target_type?: string;
          target_id?: string;
          metadata?: Record<string, unknown>;
        };
        Update: never;
      };
      templates: {
        Row: {
          id: string;
          kind: TemplateKind;
          title: string;
          description: string | null;
          is_active: boolean;
          frequency: CheckInFrequency | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          kind: TemplateKind;
          title: string;
          description?: string | null;
          is_active?: boolean;
          frequency?: CheckInFrequency | null;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["templates"]["Insert"]>;
      };
      template_questions: {
        Row: {
          id: string;
          template_id: string;
          position: number;
          type: QuestionType;
          label: string;
          config: QuestionConfig;
          is_required: boolean;
          created_at: string;
        };
        Insert: {
          template_id: string;
          position: number;
          type: QuestionType;
          label: string;
          config?: QuestionConfig;
          is_required?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["template_questions"]["Insert"]>;
      };
      responses: {
        Row: {
          id: string;
          template_id: string | null;
          client_id: string;
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          shared_with_therapist: boolean;
        };
        Insert: {
          template_id: string;
          client_id: string;
          shared_with_therapist?: boolean;
        };
        Update: {
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          shared_with_therapist?: boolean;
        };
      };
      response_answers: {
        Row: {
          id: string;
          response_id: string;
          question_id: string | null;
          question_label: string | null;
          value: AnswerValue;
        };
        Insert: {
          response_id: string;
          question_id: string;
          question_label: string;
          value: AnswerValue;
        };
        Update: never;
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          body: string;
          cover_image_url: string | null;
          category: string | null;
          is_published: boolean;
          published_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          slug: string;
          excerpt?: string | null;
          body: string;
          cover_image_url?: string | null;
          category?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["blog_posts"]["Insert"]>;
      };
      books: {
        Row: {
          id: string;
          title: string;
          author: string;
          cover_image_url: string | null;
          description: string | null;
          why_recommended: string | null;
          who_its_for: string | null;
          favorite_chapters: string | null;
          amazon_url: string | null;
          library_url: string | null;
          worksheet_url: string | null;
          status: BookStatus;
          categories: string[];
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          author: string;
          cover_image_url?: string | null;
          description?: string | null;
          why_recommended?: string | null;
          who_its_for?: string | null;
          favorite_chapters?: string | null;
          amazon_url?: string | null;
          library_url?: string | null;
          worksheet_url?: string | null;
          status?: BookStatus;
          categories?: string[];
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["books"]["Insert"]>;
      };
      currently_reading: {
        Row: {
          id: true;
          book_title: string | null;
          author: string | null;
          cover_image_url: string | null;
          progress_note: string | null;
          why_reading: string | null;
          learning_note: string | null;
          favorite_quote: string | null;
          recommended_chapter: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["currently_reading"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["currently_reading"]["Row"]>;
      };
      webinars: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          speaker: string | null;
          video_url: string | null;
          thumbnail_url: string | null;
          length_minutes: number | null;
          slides_url: string | null;
          worksheet_url: string | null;
          scheduled_at: string | null;
          registration_url: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          speaker?: string | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          length_minutes?: number | null;
          slides_url?: string | null;
          worksheet_url?: string | null;
          scheduled_at?: string | null;
          registration_url?: string | null;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["webinars"]["Insert"]>;
      };
      webinar_completions: {
        Row: { webinar_id: string; client_id: string; completed_at: string };
        Insert: { webinar_id: string; client_id: string };
        Update: never;
      };
      support_groups: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          who_should_attend: string | null;
          meets_at: string | null;
          location: string | null;
          virtual_link: string | null;
          is_recurring: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          who_should_attend?: string | null;
          meets_at?: string | null;
          location?: string | null;
          virtual_link?: string | null;
          is_recurring?: boolean;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["support_groups"]["Insert"]>;
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          created_by: string;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          title: string;
          body: string;
          created_by: string;
          expires_at?: string | null;
        };
        Update: never;
      };
      assignments: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          instructions: string;
          reflection_prompt: string | null;
          reflection_max_length: number | null;
          status: AssignmentStatus;
          reflection_response: string | null;
          attachment_url: string | null;
          attachment_name: string | null;
          attachment_type: string | null;
          completed_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          title: string;
          instructions: string;
          reflection_prompt?: string | null;
          reflection_max_length?: number | null;
          attachment_url?: string | null;
          attachment_name?: string | null;
          attachment_type?: string | null;
          created_by: string;
        };
        Update: {
          status?: AssignmentStatus;
          reflection_response?: string | null;
          completed_at?: string | null;
        };
      };
      client_template_preferences: {
        Row: {
          client_id: string;
          template_id: string;
          frequency: CheckInFrequency;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          template_id: string;
          frequency: CheckInFrequency;
        };
        Update: { frequency: CheckInFrequency };
      };
      client_checkin_assignments: {
        Row: { client_id: string; template_id: string; assigned_at: string };
        Insert: { client_id: string; template_id: string };
        Update: never;
      };
      checkin_library: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          frequency: CheckInFrequency;
          questions: unknown;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          frequency?: CheckInFrequency;
          questions: unknown;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["checkin_library"]["Insert"]>;
      };
      pathways: {
        Row: {
          id: string;
          title: string;
          category: string;
          description: string | null;
          cover_image_url: string | null;
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          category: string;
          description?: string | null;
          cover_image_url?: string | null;
          is_active?: boolean;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["pathways"]["Insert"]>;
      };
      pathway_steps: {
        Row: {
          id: string;
          pathway_id: string;
          position: number;
          title: string;
          content: string;
          reflection_prompt: string | null;
          reflection_max_length: number | null;
          created_at: string;
        };
        Insert: {
          pathway_id: string;
          position: number;
          title: string;
          content: string;
          reflection_prompt?: string | null;
          reflection_max_length?: number | null;
        };
        Update: never;
      };
      pathway_enrollments: {
        Row: {
          client_id: string;
          pathway_id: string;
          started_at: string;
          completed_at: string | null;
        };
        Insert: { client_id: string; pathway_id: string };
        Update: { completed_at?: string | null };
      };
      pathway_step_completions: {
        Row: {
          id: string;
          client_id: string;
          step_id: string;
          reflection_response: string | null;
          completed_at: string;
        };
        Insert: {
          client_id: string;
          step_id: string;
          reflection_response?: string | null;
        };
        Update: never;
      };
      assignment_templates: {
        Row: {
          id: string;
          title: string;
          instructions: string;
          reflection_prompt: string | null;
          reflection_max_length: number | null;
          attachment_url: string | null;
          attachment_name: string | null;
          attachment_type: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          instructions: string;
          reflection_prompt?: string | null;
          reflection_max_length?: number | null;
          attachment_url?: string | null;
          attachment_name?: string | null;
          attachment_type?: string | null;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["assignment_templates"]["Insert"]>;
      };
      terms_content: {
        Row: { id: true; version: number; body: string; updated_at: string };
        Insert: { body?: string };
        Update: { body: string };
      };
      terms_acceptances: {
        Row: { id: string; client_id: string; version: number; accepted_at: string };
        Insert: { client_id: string; version: number };
        Update: never;
      };
    };
    Functions: {
      get_invitation_by_token: {
        Args: { p_token: string };
        Returns: {
          email: string;
          first_name: string;
          last_name: string;
          status: InvitationStatus;
          expires_at: string;
        }[];
      };
      accept_invitation: {
        Args: { p_token: string; p_user_id: string };
        Returns: void;
      };
      is_therapist: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      verify_access_code: {
        Args: { p_code: string };
        Returns: boolean;
      };
      join_with_access_code: {
        Args: {
          p_code: string;
          p_user_id: string;
          p_first_name: string;
          p_last_name: string;
          p_email: string;
        };
        Returns: void;
      };
    };
  };
}
