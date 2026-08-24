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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      _bizzarrini_migration_ids: {
        Row: {
          done: boolean | null
          photo_id: number
        }
        Insert: {
          done?: boolean | null
          photo_id: number
        }
        Update: {
          done?: boolean | null
          photo_id?: number
        }
        Relationships: []
      }
      _bizzarrini_missing: {
        Row: {
          photo_id: number | null
        }
        Insert: {
          photo_id?: number | null
        }
        Update: {
          photo_id?: number | null
        }
        Relationships: []
      }
      _lancia_migration_ids: {
        Row: {
          photo_id: number
        }
        Insert: {
          photo_id: number
        }
        Update: {
          photo_id?: number
        }
        Relationships: []
      }
      _lancia_missing: {
        Row: {
          photo_id: number | null
        }
        Insert: {
          photo_id?: number | null
        }
        Update: {
          photo_id?: number | null
        }
        Relationships: []
      }
      _lancia_missing2: {
        Row: {
          photo_id: number | null
        }
        Insert: {
          photo_id?: number | null
        }
        Update: {
          photo_id?: number | null
        }
        Relationships: []
      }
      _lancia_sanitize_map: {
        Row: {
          new_key: string | null
          old_r2_path: string | null
          photo_id: number
        }
        Insert: {
          new_key?: string | null
          old_r2_path?: string | null
          photo_id: number
        }
        Update: {
          new_key?: string | null
          old_r2_path?: string | null
          photo_id?: number
        }
        Relationships: []
      }
      _lancia_webp_gen_ids: {
        Row: {
          photo_id: number
        }
        Insert: {
          photo_id: number
        }
        Update: {
          photo_id?: number
        }
        Relationships: []
      }
      _mangusta_migration_ids: {
        Row: {
          photo_id: number
        }
        Insert: {
          photo_id: number
        }
        Update: {
          photo_id?: number
        }
        Relationships: []
      }
      _mangusta_missing: {
        Row: {
          photo_id: number | null
        }
        Insert: {
          photo_id?: number | null
        }
        Update: {
          photo_id?: number | null
        }
        Relationships: []
      }
      _migration_retry_ids: {
        Row: {
          done: boolean | null
          photo_id: number
        }
        Insert: {
          done?: boolean | null
          photo_id: number
        }
        Update: {
          done?: boolean | null
          photo_id?: number
        }
        Relationships: []
      }
      _migration_webp_ids: {
        Row: {
          done: boolean | null
          photo_id: number
        }
        Insert: {
          done?: boolean | null
          photo_id: number
        }
        Update: {
          done?: boolean | null
          photo_id?: number
        }
        Relationships: []
      }
      _webp_gen_ids: {
        Row: {
          photo_id: number
        }
        Insert: {
          photo_id: number
        }
        Update: {
          photo_id?: number
        }
        Relationships: []
      }
      books: {
        Row: {
          couverture_url: string | null
          created_at: string
          id: number
          lien_achat: string | null
          marque: string | null
          ordre: number
          titre: string
        }
        Insert: {
          couverture_url?: string | null
          created_at?: string
          id?: never
          lien_achat?: string | null
          marque?: string | null
          ordre?: number
          titre: string
        }
        Update: {
          couverture_url?: string | null
          created_at?: string
          id?: never
          lien_achat?: string | null
          marque?: string | null
          ordre?: number
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_marque_fkey"
            columns: ["marque"]
            isOneToOne: false
            referencedRelation: "marques"
            referencedColumns: ["slug"]
          },
        ]
      }
      demandes_acces: {
        Row: {
          created_at: string
          marque: string
          raison: string | null
          statut: string
          token_validation: string
          user_id: string
        }
        Insert: {
          created_at?: string
          marque: string
          raison?: string | null
          statut?: string
          token_validation?: string
          user_id: string
        }
        Update: {
          created_at?: string
          marque?: string
          raison?: string | null
          statut?: string
          token_validation?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandes_acces_marque_fkey"
            columns: ["marque"]
            isOneToOne: false
            referencedRelation: "marques"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "demandes_acces_profil_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_detectes: {
        Row: {
          chassis_detecte: string | null
          created_at: string
          dossier_source: string
          fichier: string
          id: number
          marque: string | null
          notes: string | null
          resume: string | null
          statut: string
          texte_ocr: string | null
          type_document: string | null
          valide_le: string | null
          voiture_id: number | null
        }
        Insert: {
          chassis_detecte?: string | null
          created_at?: string
          dossier_source: string
          fichier: string
          id?: never
          marque?: string | null
          notes?: string | null
          resume?: string | null
          statut?: string
          texte_ocr?: string | null
          type_document?: string | null
          valide_le?: string | null
          voiture_id?: number | null
        }
        Update: {
          chassis_detecte?: string | null
          created_at?: string
          dossier_source?: string
          fichier?: string
          id?: never
          marque?: string | null
          notes?: string | null
          resume?: string | null
          statut?: string
          texte_ocr?: string | null
          type_document?: string | null
          valide_le?: string | null
          voiture_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_detectes_marque_fkey"
            columns: ["marque"]
            isOneToOne: false
            referencedRelation: "marques"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "documents_detectes_voiture_id_fkey"
            columns: ["voiture_id"]
            isOneToOne: false
            referencedRelation: "voitures"
            referencedColumns: ["id"]
          },
        ]
      }
      marques: {
        Row: {
          actif: boolean
          books_title: string | null
          couleur: string | null
          created_at: string
          favicon: string | null
          hero_image: string | null
          logo: string | null
          nom_affichage: string
          ordre: number | null
          site_url: string | null
          slug: string
          youtube_playlist: string | null
        }
        Insert: {
          actif?: boolean
          books_title?: string | null
          couleur?: string | null
          created_at?: string
          favicon?: string | null
          hero_image?: string | null
          logo?: string | null
          nom_affichage: string
          ordre?: number | null
          site_url?: string | null
          slug: string
          youtube_playlist?: string | null
        }
        Update: {
          actif?: boolean
          books_title?: string | null
          couleur?: string | null
          created_at?: string
          favicon?: string | null
          hero_image?: string | null
          logo?: string | null
          nom_affichage?: string
          ordre?: number | null
          site_url?: string | null
          slug?: string
          youtube_playlist?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          created_at: string
          date_evenement: string | null
          date_source: string | null
          date_source_type: string | null
          evenement: string | null
          filename: string
          id: number
          ordre: number
          pays_course: string | null
          retouchee: boolean
          statut_date: string | null
          voiture_id: number | null
        }
        Insert: {
          created_at?: string
          date_evenement?: string | null
          date_source?: string | null
          date_source_type?: string | null
          evenement?: string | null
          filename: string
          id?: never
          ordre?: number
          pays_course?: string | null
          retouchee?: boolean
          statut_date?: string | null
          voiture_id?: number | null
        }
        Update: {
          created_at?: string
          date_evenement?: string | null
          date_source?: string | null
          date_source_type?: string | null
          evenement?: string | null
          filename?: string
          id?: never
          ordre?: number
          pays_course?: string | null
          retouchee?: boolean
          statut_date?: string | null
          voiture_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_voiture_id_fkey"
            columns: ["voiture_id"]
            isOneToOne: false
            referencedRelation: "voitures"
            referencedColumns: ["id"]
          },
        ]
      }
      profils: {
        Row: {
          created_at: string
          email: string | null
          est_admin: boolean
          id: string
          marque: string | null
          nom: string
          prenom: string
          raison: string | null
          statut: string
          telephone: string | null
          token_validation: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          est_admin?: boolean
          id: string
          marque?: string | null
          nom: string
          prenom: string
          raison?: string | null
          statut?: string
          telephone?: string | null
          token_validation?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          est_admin?: boolean
          id?: string
          marque?: string | null
          nom?: string
          prenom?: string
          raison?: string | null
          statut?: string
          telephone?: string | null
          token_validation?: string
        }
        Relationships: [
          {
            foreignKeyName: "profils_marque_fkey"
            columns: ["marque"]
            isOneToOne: false
            referencedRelation: "marques"
            referencedColumns: ["slug"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          description: string | null
          id: number
          marque: string
          ordre: number
          public: boolean
          titre: string
          voiture_id: number | null
          youtube_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: never
          marque: string
          ordre?: number
          public?: boolean
          titre: string
          voiture_id?: number | null
          youtube_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: never
          marque?: string
          ordre?: number
          public?: boolean
          titre?: string
          voiture_id?: number | null
          youtube_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_marque_fkey"
            columns: ["marque"]
            isOneToOne: false
            referencedRelation: "marques"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "videos_voiture_id_fkey"
            columns: ["voiture_id"]
            isOneToOne: false
            referencedRelation: "voitures"
            referencedColumns: ["id"]
          },
        ]
      }
      voiture_details: {
        Row: {
          description: string | null
          description_en: string | null
          description_fr: string | null
          description_it: string | null
          updated_at: string
          voiture_id: number
        }
        Insert: {
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          description_it?: string | null
          updated_at?: string
          voiture_id: number
        }
        Update: {
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          description_it?: string | null
          updated_at?: string
          voiture_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "voiture_details_voiture_id_fkey"
            columns: ["voiture_id"]
            isOneToOne: true
            referencedRelation: "voitures"
            referencedColumns: ["id"]
          },
        ]
      }
      voiture_details_historique: {
        Row: {
          description_en: string | null
          description_fr: string | null
          description_it: string | null
          id: number
          modifie_le: string
          voiture_id: number
        }
        Insert: {
          description_en?: string | null
          description_fr?: string | null
          description_it?: string | null
          id?: never
          modifie_le?: string
          voiture_id: number
        }
        Update: {
          description_en?: string | null
          description_fr?: string | null
          description_it?: string | null
          id?: never
          modifie_le?: string
          voiture_id?: number
        }
        Relationships: []
      }
      voitures: {
        Row: {
          annee: number | null
          annee_evenement: string | null
          chassis: string | null
          cover_photo: string
          created_at: string
          id: number
          marque: string
          modele: string
          ordre_affichage: number | null
          pays_evenement: string | null
          photo_count: number
          photo_prefix: string
          slug: string
          storage_path: string
          titre: string
          type_fiche_hillclimb: string | null
        }
        Insert: {
          annee?: number | null
          annee_evenement?: string | null
          chassis?: string | null
          cover_photo: string
          created_at?: string
          id?: never
          marque: string
          modele: string
          ordre_affichage?: number | null
          pays_evenement?: string | null
          photo_count?: number
          photo_prefix: string
          slug: string
          storage_path?: string
          titre: string
          type_fiche_hillclimb?: string | null
        }
        Update: {
          annee?: number | null
          annee_evenement?: string | null
          chassis?: string | null
          cover_photo?: string
          created_at?: string
          id?: never
          marque?: string
          modele?: string
          ordre_affichage?: number | null
          pays_evenement?: string | null
          photo_count?: number
          photo_prefix?: string
          slug?: string
          storage_path?: string
          titre?: string
          type_fiche_hillclimb?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voitures_marque_fkey"
            columns: ["marque"]
            isOneToOne: false
            referencedRelation: "marques"
            referencedColumns: ["slug"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      est_admin: { Args: { _uid: string }; Returns: boolean }
      est_valide: { Args: { _uid: string }; Returns: boolean }
      photo_storage_publique: { Args: { _name: string }; Returns: boolean }
      sanitize_storage_key: { Args: { txt: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
