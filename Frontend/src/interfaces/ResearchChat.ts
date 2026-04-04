export interface ResearchChatSession {
  id: string;
  title: string;
  source_type: string;
  source_summary: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ResearchChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ResearchQuestionResponse {
  user_message: ResearchChatMessage;
  assistant_message: ResearchChatMessage;
  retrieved_chunks: string[];
}

export interface ResearchSessionDetail {
  session: ResearchChatSession;
  messages: ResearchChatMessage[];
}

export interface ResearchSessionSeedResponse {
  session: ResearchChatSession;
}

export interface ResearchContextResponse {
  sourceType: number | string;
  context: string;
}
