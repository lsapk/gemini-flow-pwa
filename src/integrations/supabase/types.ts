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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_pending_actions: {
        Row: {
          action_data: Json
          action_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          action_data: Json
          action_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_requests: {
        Row: {
          created_at: string | null
          id: string
          service: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          service: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          service?: string
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_by_period: {
        Row: {
          id: number
          metaId: number
          periodStart: string | null
          periodUnit: number
          type: number
          value: number
        }
        Insert: {
          id?: number
          metaId: number
          periodStart?: string | null
          periodUnit: number
          type: number
          value: number
        }
        Update: {
          id?: number
          metaId?: number
          periodStart?: string | null
          periodUnit?: number
          type?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "FK_83eea8e9024d109d055721dfb40"
            columns: ["metaId"]
            isOneToOne: false
            referencedRelation: "analytics_metadata"
            referencedColumns: ["metaId"]
          },
        ]
      }
      analytics_metadata: {
        Row: {
          metaId: number
          projectId: string | null
          projectName: string
          workflowId: string | null
          workflowName: string
        }
        Insert: {
          metaId?: number
          projectId?: string | null
          projectName: string
          workflowId?: string | null
          workflowName: string
        }
        Update: {
          metaId?: number
          projectId?: string | null
          projectName?: string
          workflowId?: string | null
          workflowName?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_b06b8962721cf6ef7a508d52a66"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_b14a2a0105c036afaa293b1c57e"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_raw: {
        Row: {
          id: number
          metaId: number
          timestamp: string
          type: number
          value: number
        }
        Insert: {
          id?: number
          metaId: number
          timestamp?: string
          type: number
          value: number
        }
        Update: {
          id?: number
          metaId?: number
          timestamp?: string
          type?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "FK_e4cdf6fe2f1d8a494da5569ed13"
            columns: ["metaId"]
            isOneToOne: false
            referencedRelation: "analytics_metadata"
            referencedColumns: ["metaId"]
          },
        ]
      }
      annotation_tag_entity: {
        Row: {
          createdAt: string
          id: string
          name: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id: string
          name: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          id?: string
          name?: string
          updatedAt?: string
        }
        Relationships: []
      }
      auth_identity: {
        Row: {
          createdAt: string
          providerId: string
          providerType: string
          updatedAt: string
          userId: string | null
        }
        Insert: {
          createdAt?: string
          providerId: string
          providerType: string
          updatedAt?: string
          userId?: string | null
        }
        Update: {
          createdAt?: string
          providerId?: string
          providerType?: string
          updatedAt?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_identity_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_provider_sync_history: {
        Row: {
          created: number
          disabled: number
          endedAt: string
          error: string | null
          id: number
          providerType: string
          runMode: string
          scanned: number
          startedAt: string
          status: string
          updated: number
        }
        Insert: {
          created: number
          disabled: number
          endedAt?: string
          error?: string | null
          id?: number
          providerType: string
          runMode: string
          scanned: number
          startedAt?: string
          status: string
          updated: number
        }
        Update: {
          created?: number
          disabled?: number
          endedAt?: string
          error?: string | null
          id?: number
          providerType?: string
          runMode?: string
          scanned?: number
          startedAt?: string
          status?: string
          updated?: number
        }
        Relationships: []
      }
      background_focus_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          is_active: boolean | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credentials_entity: {
        Row: {
          createdAt: string
          data: string
          id: string
          isManaged: boolean
          name: string
          type: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          data: string
          id: string
          isManaged?: boolean
          name: string
          type: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          data?: string
          id?: string
          isManaged?: boolean
          name?: string
          type?: string
          updatedAt?: string
        }
        Relationships: []
      }
      daily_reflections: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          user_id?: string
        }
        Relationships: []
      }
      event_destinations: {
        Row: {
          createdAt: string
          destination: Json
          id: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          destination: Json
          id: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          destination?: Json
          id?: string
          updatedAt?: string
        }
        Relationships: []
      }
      execution_annotation_tags: {
        Row: {
          annotationId: number
          tagId: string
        }
        Insert: {
          annotationId: number
          tagId: string
        }
        Update: {
          annotationId?: number
          tagId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_a3697779b366e131b2bbdae2976"
            columns: ["tagId"]
            isOneToOne: false
            referencedRelation: "annotation_tag_entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_c1519757391996eb06064f0e7c8"
            columns: ["annotationId"]
            isOneToOne: false
            referencedRelation: "execution_annotations"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_annotations: {
        Row: {
          createdAt: string
          executionId: number
          id: number
          note: string | null
          updatedAt: string
          vote: string | null
        }
        Insert: {
          createdAt?: string
          executionId: number
          id?: number
          note?: string | null
          updatedAt?: string
          vote?: string | null
        }
        Update: {
          createdAt?: string
          executionId?: number
          id?: number
          note?: string | null
          updatedAt?: string
          vote?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "FK_97f863fa83c4786f19565084960"
            columns: ["executionId"]
            isOneToOne: false
            referencedRelation: "execution_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_data: {
        Row: {
          data: string
          executionId: number
          workflowData: Json
        }
        Insert: {
          data: string
          executionId: number
          workflowData: Json
        }
        Update: {
          data?: string
          executionId?: number
          workflowData?: Json
        }
        Relationships: [
          {
            foreignKeyName: "execution_data_fk"
            columns: ["executionId"]
            isOneToOne: true
            referencedRelation: "execution_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_entity: {
        Row: {
          createdAt: string
          deletedAt: string | null
          finished: boolean
          id: number
          mode: string
          retryOf: string | null
          retrySuccessId: string | null
          startedAt: string | null
          status: string
          stoppedAt: string | null
          waitTill: string | null
          workflowId: string
        }
        Insert: {
          createdAt?: string
          deletedAt?: string | null
          finished: boolean
          id?: number
          mode: string
          retryOf?: string | null
          retrySuccessId?: string | null
          startedAt?: string | null
          status: string
          stoppedAt?: string | null
          waitTill?: string | null
          workflowId: string
        }
        Update: {
          createdAt?: string
          deletedAt?: string | null
          finished?: boolean
          id?: number
          mode?: string
          retryOf?: string | null
          retrySuccessId?: string | null
          startedAt?: string | null
          status?: string
          stoppedAt?: string | null
          waitTill?: string | null
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_execution_entity_workflow_id"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_metadata: {
        Row: {
          executionId: number
          id: number
          key: string
          value: string
        }
        Insert: {
          executionId: number
          id?: number
          key: string
          value: string
        }
        Update: {
          executionId?: number
          id?: number
          key?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_31d0b4c93fb85ced26f6005cda3"
            columns: ["executionId"]
            isOneToOne: false
            referencedRelation: "execution_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration: number
          id: string
          started_at: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration: number
          id?: string
          started_at?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration?: number
          id?: string
          started_at?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      folder: {
        Row: {
          createdAt: string
          id: string
          name: string
          parentFolderId: string | null
          projectId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id: string
          name: string
          parentFolderId?: string | null
          projectId: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          id?: string
          name?: string
          parentFolderId?: string | null
          projectId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_804ea52f6729e3940498bd54d78"
            columns: ["parentFolderId"]
            isOneToOne: false
            referencedRelation: "folder"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_a8260b0b36939c6247f385b8221"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      folder_tag: {
        Row: {
          folderId: string
          tagId: string
        }
        Insert: {
          folderId: string
          tagId: string
        }
        Update: {
          folderId?: string
          tagId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_94a60854e06f2897b2e0d39edba"
            columns: ["folderId"]
            isOneToOne: false
            referencedRelation: "folder"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_dc88164176283de80af47621746"
            columns: ["tagId"]
            isOneToOne: false
            referencedRelation: "tag_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string | null
          completed: boolean
          created_at: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          progress: number | null
          sort_order: number | null
          target_date: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          completed?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          progress?: number | null
          sort_order?: number | null
          target_date?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          completed?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          progress?: number | null
          sort_order?: number | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      good_action_comments: {
        Row: {
          content: string
          created_at: string | null
          good_action_id: string
          id: string
          is_deleted: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          good_action_id: string
          id?: string
          is_deleted?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          good_action_id?: string
          id?: string
          is_deleted?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "good_action_comments_good_action_id_fkey"
            columns: ["good_action_id"]
            isOneToOne: false
            referencedRelation: "good_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      good_action_likes: {
        Row: {
          created_at: string | null
          good_action_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          good_action_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          good_action_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "good_action_likes_good_action_id_fkey"
            columns: ["good_action_id"]
            isOneToOne: false
            referencedRelation: "good_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      good_actions: {
        Row: {
          category: string
          comments_count: number
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean
          likes_count: number
          title: string
          user_id: string
        }
        Insert: {
          category: string
          comments_count?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          likes_count?: number
          title: string
          user_id: string
        }
        Update: {
          category?: string
          comments_count?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          likes_count?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_date: string | null
          created_at: string | null
          habit_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          habit_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          habit_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          frequency: string
          id: string
          is_archived: boolean | null
          last_completed_at: string | null
          linked_goal_id: string | null
          sort_order: number | null
          streak: number | null
          target: number
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          frequency: string
          id?: string
          is_archived?: boolean | null
          last_completed_at?: string | null
          linked_goal_id?: string | null
          sort_order?: number | null
          streak?: number | null
          target: number
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          frequency?: string
          id?: string
          is_archived?: boolean | null
          last_completed_at?: string | null
          linked_goal_id?: string | null
          sort_order?: number | null
          streak?: number | null
          target?: number
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      installed_nodes: {
        Row: {
          latestVersion: number
          name: string
          package: string
          type: string
        }
        Insert: {
          latestVersion?: number
          name: string
          package: string
          type: string
        }
        Update: {
          latestVersion?: number
          name?: string
          package?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_73f857fc5dce682cef8a99c11dbddbc969618951"
            columns: ["package"]
            isOneToOne: false
            referencedRelation: "installed_packages"
            referencedColumns: ["packageName"]
          },
        ]
      }
      installed_packages: {
        Row: {
          authorEmail: string | null
          authorName: string | null
          createdAt: string
          installedVersion: string
          packageName: string
          updatedAt: string
        }
        Insert: {
          authorEmail?: string | null
          authorName?: string | null
          createdAt?: string
          installedVersion: string
          packageName: string
          updatedAt?: string
        }
        Update: {
          authorEmail?: string | null
          authorName?: string | null
          createdAt?: string
          installedVersion?: string
          packageName?: string
          updatedAt?: string
        }
        Relationships: []
      }
      invalid_auth_token: {
        Row: {
          expiresAt: string
          token: string
        }
        Insert: {
          expiresAt: string
          token: string
        }
        Update: {
          expiresAt?: string
          token?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string | null
          id: string
          mood: string | null
          tags: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          mood?: string | null
          tags?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          mood?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string | null
          data: Json | null
          difficulty: string | null
          id: string
          subject_id: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          data?: Json | null
          difficulty?: string | null
          id?: string
          subject_id: string
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          data?: Json | null
          difficulty?: string | null
          id?: string
          subject_id?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          id: number
          name: string
          timestamp: number
        }
        Insert: {
          id?: number
          name: string
          timestamp: number
        }
        Update: {
          id?: number
          name?: string
          timestamp?: number
        }
        Relationships: []
      }
      processed_data: {
        Row: {
          context: string
          createdAt: string
          updatedAt: string
          value: string
          workflowId: string
        }
        Insert: {
          context: string
          createdAt?: string
          updatedAt?: string
          value: string
          workflowId: string
        }
        Update: {
          context?: string
          createdAt?: string
          updatedAt?: string
          value?: string
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_06a69a7032c97a763c2c7599464"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      project: {
        Row: {
          createdAt: string
          icon: Json | null
          id: string
          name: string
          type: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          icon?: Json | null
          id: string
          name: string
          type: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          icon?: Json | null
          id?: string
          name?: string
          type?: string
          updatedAt?: string
        }
        Relationships: []
      }
      project_relation: {
        Row: {
          createdAt: string
          projectId: string
          role: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          projectId: string
          role: string
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          projectId?: string
          role?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_5f0643f6717905a05164090dde7"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_61448d56d61802b5dfde5cdb002"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      role: {
        Row: {
          createdAt: string
          id: number
          name: string
          scope: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: number
          name: string
          scope: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          id?: number
          name?: string
          scope?: string
          updatedAt?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          loadOnStartup: boolean
          value: string
        }
        Insert: {
          key: string
          loadOnStartup?: boolean
          value: string
        }
        Update: {
          key?: string
          loadOnStartup?: boolean
          value?: string
        }
        Relationships: []
      }
      shared_credentials: {
        Row: {
          createdAt: string
          credentialsId: string
          projectId: string
          role: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          credentialsId: string
          projectId: string
          role: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          credentialsId?: string
          projectId?: string
          role?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_416f66fc846c7c442970c094ccf"
            columns: ["credentialsId"]
            isOneToOne: false
            referencedRelation: "credentials_entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_812c2852270da1247756e77f5a4"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_workflow: {
        Row: {
          createdAt: string
          projectId: string
          role: string
          updatedAt: string
          workflowId: string
        }
        Insert: {
          createdAt?: string
          projectId: string
          role: string
          updatedAt?: string
          workflowId: string
        }
        Update: {
          createdAt?: string
          projectId?: string
          role?: string
          updatedAt?: string
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_a45ea5f27bcfdc21af9b4188560"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_daa206a04983d47d0a9c34649ce"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          completed_at: string | null
          duration: number
          id: string
          lesson_id: string | null
          score: number | null
          session_type: string
          subject_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          duration: number
          id?: string
          lesson_id?: string | null
          score?: number | null
          session_type: string
          subject_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          duration?: number
          id?: string
          lesson_id?: string | null
          score?: number | null
          session_type?: string
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          lessons_count: number | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          lessons_count?: number | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          lessons_count?: number | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subobjectives: {
        Row: {
          completed: boolean
          created_at: string | null
          description: string | null
          id: string
          parent_goal_id: string
          sort_order: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          parent_goal_id: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          parent_goal_id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subobjectives_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          purchase_time: string | null
          purchase_token: string | null
          subscription_end: string | null
          subscription_tier: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          purchase_time?: string | null
          purchase_token?: string | null
          subscription_end?: string | null
          subscription_tier?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          purchase_time?: string | null
          purchase_token?: string | null
          subscription_end?: string | null
          subscription_tier?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          id: string
          parent_task_id: string
          priority: string | null
          sort_order: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          parent_task_id: string
          priority?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          parent_task_id?: string
          priority?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_entity: {
        Row: {
          createdAt: string
          id: string
          name: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id: string
          name: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          id?: string
          name?: string
          updatedAt?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          linked_goal_id: string | null
          parent_task_id: string | null
          priority: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_goal_id?: string | null
          parent_task_id?: string | null
          priority?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_goal_id?: string | null
          parent_task_id?: string | null
          priority?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      test_case_execution: {
        Row: {
          completedAt: string | null
          createdAt: string
          errorCode: string | null
          errorDetails: Json | null
          evaluationExecutionId: number | null
          executionId: number | null
          id: string
          metrics: Json | null
          pastExecutionId: number | null
          runAt: string | null
          status: string
          testRunId: string
          updatedAt: string
        }
        Insert: {
          completedAt?: string | null
          createdAt?: string
          errorCode?: string | null
          errorDetails?: Json | null
          evaluationExecutionId?: number | null
          executionId?: number | null
          id: string
          metrics?: Json | null
          pastExecutionId?: number | null
          runAt?: string | null
          status: string
          testRunId: string
          updatedAt?: string
        }
        Update: {
          completedAt?: string | null
          createdAt?: string
          errorCode?: string | null
          errorDetails?: Json | null
          evaluationExecutionId?: number | null
          executionId?: number | null
          id?: string
          metrics?: Json | null
          pastExecutionId?: number | null
          runAt?: string | null
          status?: string
          testRunId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_258d954733841d51edd826a562b"
            columns: ["pastExecutionId"]
            isOneToOne: false
            referencedRelation: "execution_entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_8e4b4774db42f1e6dda3452b2af"
            columns: ["testRunId"]
            isOneToOne: false
            referencedRelation: "test_run"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_dfbe194e3ebdfe49a87bc4692ca"
            columns: ["evaluationExecutionId"]
            isOneToOne: false
            referencedRelation: "execution_entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_e48965fac35d0f5b9e7f51d8c44"
            columns: ["executionId"]
            isOneToOne: false
            referencedRelation: "execution_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      test_definition: {
        Row: {
          annotationTagId: string | null
          createdAt: string
          description: string | null
          evaluationWorkflowId: string | null
          id: string
          mockedNodes: Json
          name: string
          updatedAt: string
          workflowId: string
        }
        Insert: {
          annotationTagId?: string | null
          createdAt?: string
          description?: string | null
          evaluationWorkflowId?: string | null
          id: string
          mockedNodes?: Json
          name: string
          updatedAt?: string
          workflowId: string
        }
        Update: {
          annotationTagId?: string | null
          createdAt?: string
          description?: string | null
          evaluationWorkflowId?: string | null
          id?: string
          mockedNodes?: Json
          name?: string
          updatedAt?: string
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_9ec1ce6fbf82305f489adb971d3"
            columns: ["evaluationWorkflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_b0dd0087fe3da02b0ffa4b9c5bb"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_d5d7ea64662dbc62f5e266fbeb0"
            columns: ["annotationTagId"]
            isOneToOne: false
            referencedRelation: "annotation_tag_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      test_metric: {
        Row: {
          createdAt: string
          id: string
          name: string
          testDefinitionId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id: string
          name: string
          testDefinitionId: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          id?: string
          name?: string
          testDefinitionId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_3a4e9cf37111ac3270e2469b475"
            columns: ["testDefinitionId"]
            isOneToOne: false
            referencedRelation: "test_definition"
            referencedColumns: ["id"]
          },
        ]
      }
      test_run: {
        Row: {
          completedAt: string | null
          createdAt: string
          errorCode: string | null
          errorDetails: string | null
          failedCases: number | null
          id: string
          metrics: Json | null
          passedCases: number | null
          runAt: string | null
          status: string
          testDefinitionId: string
          totalCases: number | null
          updatedAt: string
        }
        Insert: {
          completedAt?: string | null
          createdAt?: string
          errorCode?: string | null
          errorDetails?: string | null
          failedCases?: number | null
          id: string
          metrics?: Json | null
          passedCases?: number | null
          runAt?: string | null
          status: string
          testDefinitionId: string
          totalCases?: number | null
          updatedAt?: string
        }
        Update: {
          completedAt?: string | null
          createdAt?: string
          errorCode?: string | null
          errorDetails?: string | null
          failedCases?: number | null
          id?: string
          metrics?: Json | null
          passedCases?: number | null
          runAt?: string | null
          status?: string
          testDefinitionId?: string
          totalCases?: number | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_3a81713a76f2295b12b46cdfcab"
            columns: ["testDefinitionId"]
            isOneToOne: false
            referencedRelation: "test_definition"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          createdAt: string
          disabled: boolean
          email: string | null
          firstName: string | null
          id: string
          lastName: string | null
          mfaEnabled: boolean
          mfaRecoveryCodes: string | null
          mfaSecret: string | null
          password: string | null
          personalizationAnswers: Json | null
          role: string
          settings: Json | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          disabled?: boolean
          email?: string | null
          firstName?: string | null
          id?: string
          lastName?: string | null
          mfaEnabled?: boolean
          mfaRecoveryCodes?: string | null
          mfaSecret?: string | null
          password?: string | null
          personalizationAnswers?: Json | null
          role: string
          settings?: Json | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          disabled?: boolean
          email?: string | null
          firstName?: string | null
          id?: string
          lastName?: string | null
          mfaEnabled?: boolean
          mfaRecoveryCodes?: string | null
          mfaSecret?: string | null
          password?: string | null
          personalizationAnswers?: Json | null
          role?: string
          settings?: Json | null
          updatedAt?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          apiKey: string
          createdAt: string
          id: string
          label: string
          updatedAt: string
          userId: string
        }
        Insert: {
          apiKey: string
          createdAt?: string
          id: string
          label: string
          updatedAt?: string
          userId: string
        }
        Update: {
          apiKey?: string
          createdAt?: string
          id?: string
          label?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_e131705cbbc8fb589889b02d457"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          photo_url: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          photo_url?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          photo_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          clock_format: string | null
          created_at: string | null
          dark_mode: boolean | null
          focus_mode: boolean | null
          gemini_api_key: string | null
          id: string
          karma_points: number | null
          language: string | null
          notifications_enabled: boolean | null
          sound_enabled: boolean | null
          theme: string | null
          unlocked_features: Json | null
          updated_at: string | null
        }
        Insert: {
          clock_format?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          focus_mode?: boolean | null
          gemini_api_key?: string | null
          id: string
          karma_points?: number | null
          language?: string | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          unlocked_features?: Json | null
          updated_at?: string | null
        }
        Update: {
          clock_format?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          focus_mode?: boolean | null
          gemini_api_key?: string | null
          id?: string
          karma_points?: number | null
          language?: string | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          unlocked_features?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      variables: {
        Row: {
          id: string
          key: string
          type: string
          value: string | null
        }
        Insert: {
          id: string
          key: string
          type?: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          type?: string
          value?: string | null
        }
        Relationships: []
      }
      video_analyses: {
        Row: {
          annotated_video_url: string | null
          created_at: string | null
          distance_covered: number | null
          error: string | null
          heatmap_url: string | null
          id: string
          max_speed: number | null
          raw_data: Json | null
          sprints: number | null
          status: string
          updated_at: string | null
          user_id: string
          veo_url: string
          video_url: string | null
        }
        Insert: {
          annotated_video_url?: string | null
          created_at?: string | null
          distance_covered?: number | null
          error?: string | null
          heatmap_url?: string | null
          id?: string
          max_speed?: number | null
          raw_data?: Json | null
          sprints?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
          veo_url: string
          video_url?: string | null
        }
        Update: {
          annotated_video_url?: string | null
          created_at?: string | null
          distance_covered?: number | null
          error?: string | null
          heatmap_url?: string | null
          id?: string
          max_speed?: number | null
          raw_data?: Json | null
          sprints?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
          veo_url?: string
          video_url?: string | null
        }
        Relationships: []
      }
      webhook_entity: {
        Row: {
          method: string
          node: string
          pathLength: number | null
          webhookId: string | null
          webhookPath: string
          workflowId: string
        }
        Insert: {
          method: string
          node: string
          pathLength?: number | null
          webhookId?: string | null
          webhookPath: string
          workflowId: string
        }
        Update: {
          method?: string
          node?: string
          pathLength?: number | null
          webhookId?: string | null
          webhookPath?: string
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_webhook_entity_workflow_id"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_entity: {
        Row: {
          active: boolean
          connections: Json
          createdAt: string
          id: string
          meta: Json | null
          name: string
          nodes: Json
          parentFolderId: string | null
          pinData: Json | null
          settings: Json | null
          staticData: Json | null
          triggerCount: number
          updatedAt: string
          versionId: string | null
        }
        Insert: {
          active: boolean
          connections: Json
          createdAt?: string
          id: string
          meta?: Json | null
          name: string
          nodes: Json
          parentFolderId?: string | null
          pinData?: Json | null
          settings?: Json | null
          staticData?: Json | null
          triggerCount?: number
          updatedAt?: string
          versionId?: string | null
        }
        Update: {
          active?: boolean
          connections?: Json
          createdAt?: string
          id?: string
          meta?: Json | null
          name?: string
          nodes?: Json
          parentFolderId?: string | null
          pinData?: Json | null
          settings?: Json | null
          staticData?: Json | null
          triggerCount?: number
          updatedAt?: string
          versionId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_workflow_parent_folder"
            columns: ["parentFolderId"]
            isOneToOne: false
            referencedRelation: "folder"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_history: {
        Row: {
          authors: string
          connections: Json
          createdAt: string
          nodes: Json
          updatedAt: string
          versionId: string
          workflowId: string
        }
        Insert: {
          authors: string
          connections: Json
          createdAt?: string
          nodes: Json
          updatedAt?: string
          versionId: string
          workflowId: string
        }
        Update: {
          authors?: string
          connections?: Json
          createdAt?: string
          nodes?: Json
          updatedAt?: string
          versionId?: string
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_1e31657f5fe46816c34be7c1b4b"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_statistics: {
        Row: {
          count: number | null
          latestEvent: string | null
          name: string
          workflowId: string
        }
        Insert: {
          count?: number | null
          latestEvent?: string | null
          name: string
          workflowId: string
        }
        Update: {
          count?: number | null
          latestEvent?: string | null
          name?: string
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_workflow_statistics_workflow_id"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows_tags: {
        Row: {
          tagId: string
          workflowId: string
        }
        Insert: {
          tagId: string
          workflowId: string
        }
        Update: {
          tagId?: string
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_workflows_tags_tag_id"
            columns: ["tagId"]
            isOneToOne: false
            referencedRelation: "tag_entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_workflows_tags_workflow_id"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
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
