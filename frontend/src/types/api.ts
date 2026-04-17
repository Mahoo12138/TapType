// API response types matching backend model/res

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface User {
  id: string
  username: string
  email: string
  avatar_media_id?: string | null
  role: 'user' | 'admin'
  is_active: number
  created_at: string
}

export interface LoginData {
  access_token: string
  expires_in: number
  user: User
}

export interface RegisterData {
  id: string
  username: string
  email: string
  role: string
}

export interface RefreshData {
  access_token: string
  expires_in: number
}

// --- Phase 3 types ---

export interface DailyRecord {
  id: string
  user_id: string
  record_date: string
  practice_count: number
  total_duration_ms: number
  avg_wpm: number
  avg_accuracy: number
  streak_day: number
  created_at: string
  updated_at: string
}

export interface TrendPoint {
  date: string
  wpm: number
  raw_wpm: number
  accuracy: number
  count: number
}

export interface KeymapStat {
  key_char: string
  total_hits: number
  total_errors: number
  error_rate: number
  avg_interval_ms: number
}

export interface AnalysisSummary {
  total_sessions: number
  total_duration_ms: number
  total_chars: number
  best_wpm: number
  avg_wpm: number
  avg_accuracy: number
  current_streak: number
  longest_streak: number
  error_word_count: number
  review_due_count: number
}

export interface ErrorRecord {
  id: string
  user_id: string
  session_id: string
  content_type: string
  content_id: string
  error_count: number
  avg_time_ms: number
  last_seen_at: string
  next_review_at: string
  review_interval: number
  easiness_factor: number
  created_at: string
  updated_at: string
  content?: string
}

export interface PaginatedErrors {
  list: ErrorRecord[]
  total: number
  page: number
  page_size: number
}

export interface ReviewQueue {
  list: ErrorRecord[]
  total: number
}

export interface ReviewSessionData {
  session: { id: string; mode: string; source_type: string; started_at: string } | null
  items: { content_type: string; content_id: string; content: string; next_review_at: string; error_count: number }[]
  item_count: string
}

// --- Phase 2 types ---

export interface WordBank {
  id: string
  owner_id: string
  name: string
  description: string
  is_public: number
  word_count: number
  created_at: string
  updated_at: string
}

export interface Word {
  id: string
  bank_id: string
  content: string
  pronunciation: string
  definition: string
  example_sentence: string
  difficulty: number
  tags: string
  created_at: string
  updated_at: string
}

export interface SentenceBank {
  id: string
  owner_id: string
  name: string
  category: string
  is_public: number
  sentence_count: number
  created_at: string
  updated_at: string
}

export interface Sentence {
  id: string
  bank_id: string
  content: string
  translation: string
  translation_source: string
  source: string
  difficulty: number
  word_count: number
  tags: string
  created_at: string
  updated_at: string
}

export interface PaginatedList<T> {
  list: T[]
  total: number
  page: number
  page_size: number
}

export interface PracticeSession {
  id: string
  user_id: string
  mode: string
  source_type: string
  source_id: string
  item_count: number
  started_at: string
  ended_at: string | null
  duration_ms: number | null
  created_at: string
}

export interface PracticeResult {
  id: string
  session_id: string
  wpm: number
  raw_wpm: number
  accuracy: number
  error_count: number
  char_count: number
  consistency: number
  created_at: string
}

export interface KeystrokeStat {
  id: string
  session_id: string
  key_char: string
  hit_count: number
  error_count: number
  avg_interval_ms: number
  created_at: string
}

export interface SessionWithContent {
  session: PracticeSession
  words?: Word[]
  sentences?: Sentence[]
}

export interface SessionListItem extends PracticeSession {
  result?: PracticeResult
}

export interface SessionDetail {
  session: PracticeSession
  result?: PracticeResult
  keystroke_stats: KeystrokeStat[]
  error_items: ErrorRecord[]
  words?: Word[]
  sentences?: Sentence[]
}

// --- Phase 4 types ---

export interface UserGoal {
  id: string
  user_id: string
  goal_type: 'duration' | 'wpm' | 'accuracy' | 'practice_count'
  target_value: number
  current_value: number
  period: string
  start_date: string
  is_active: number
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  key: string
  name: string
  description: string
  icon: string
  condition: string
  created_at: string
  unlocked_at?: string
  unlocked: boolean
}

export interface CompleteResult {
  result: PracticeResult
  new_achievements: Achievement[]
}

// --- Settings types ---

export interface SettingDefinitionItem {
  key: string
  type: 'bool' | 'string' | 'int' | 'float' | 'enum' | 'json'
  label: string
  description?: string
  default_value: string
  current_value: string
  enum_options?: string[]
  is_editable: boolean
}

export interface SettingDefinitionGroup {
  key: string
  items: SettingDefinitionItem[]
}

export interface SettingDefinitionsResponse {
  groups: SettingDefinitionGroup[]
}

export interface SystemSettingItem {
  key: string
  type: string
  group_key: string
  label: string
  description: string
  default_value: string
  current_value: string
  enum_options?: string[]
  validation_rule?: string
}

export interface UserControlItem {
  key: string
  label: string
  is_visible: boolean
  is_editable: boolean
}

// --- Article Library types ---

export interface ArticleBank {
  id: string
  owner_id: string
  name: string
  description: string
  language: string
  is_public: number
  article_count: number
  created_at: string
  updated_at: string
}

export interface Article {
  id: string
  bank_id: string
  title: string
  author: string
  source_url: string
  content?: string
  paragraph_count: number
  total_char_count: number
  difficulty: number
  tags: string
  created_at: string
  updated_at: string
}

export interface ArticleParagraph {
  id: string
  article_id: string
  paragraph_index: number
  content: string
  char_count: number
  sentence_count: number
  created_at: string
}

export interface ArticleSentence {
  id: string
  paragraph_id: string
  sentence_index: number
  content: string
  translation: string
  translation_source: string
  created_at: string
  updated_at: string
}

export interface UserArticleProgress {
  id: string
  user_id: string
  article_id: string
  completed_paragraphs: number
  total_paragraphs: number
  status: 'not_started' | 'in_progress' | 'completed'
  last_practiced_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ArticleDetail extends Article {
  paragraphs: ArticleParagraph[]
  progress: UserArticleProgress | null
}

export interface ParagraphDetail {
  paragraph: ArticleParagraph
  sentences: ArticleSentence[]
  progress: UserArticleProgress | null
}

export interface ProgressItem extends UserArticleProgress {
  article_title: string
}

// --- Open API Token types ---

export interface ApiToken {
  id: string
  name: string
  prefix: string
  scopes: string
  expires_at: string | null
  last_used_at: string | null
  is_active: number
  created_at: string
}

export interface CreateApiTokenResponse {
  token: ApiToken
  raw_token: string
}
