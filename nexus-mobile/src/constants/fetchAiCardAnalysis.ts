import { API_BASE_URL } from '../../src/constants/api';
import { AiCardAnalysis } from '../../src/types';

export async function fetchAiCardAnalysis(transactionId: string, token?: string): Promise<AiCardAnalysis | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/plaid/transaction/${transactionId}/ai-analysis`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.ai_card_analysis || null;
  } catch (e) {
    return null;
  }
}
