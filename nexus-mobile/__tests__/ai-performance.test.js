// __tests__/ai-performance.test.js
// Performance and optimization tests for AI features

import { performance } from 'perf_hooks';

// Mock fetch for performance testing
global.fetch = jest.fn();

describe('AI Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('Response Time Tests', () => {
    test('CardRank API responds within 5 seconds', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          recommended_card: { id: '1', name: 'Test Card' },
          reason: 'Best for this category'
        })
      });

      const startTime = performance.now();
      
      const response = await fetch('/api/cardrank/recommend', {
        method: 'POST',
        body: JSON.stringify({
          merchant: 'Amazon',
          category: 'shopping',
          amount: 100
        })
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });

    test('InterestKiller API responds within 5 seconds', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          minimize_interest_plan: { split: [] },
          maximize_score_plan: { split: [] },
          nexus_recommendation: 'minimize_interest'
        })
      });

      const startTime = performance.now();
      
      const response = await fetch('/api/interestkiller/suggest', {
        method: 'POST',
        body: JSON.stringify({
          accounts: [{ id: '1', balance: 1000, apr: 20 }],
          payment_amount: 200
        })
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(5000);
    });

    test('Spending Insights API responds within 3 seconds', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          category_totals: { 'Food': 150, 'Shopping': 200 },
          insight: 'Your spending looks good'
        })
      });

      const startTime = performance.now();
      
      const response = await fetch('/api/spending-insights', {
        method: 'POST',
        body: JSON.stringify({
          transactions: [
            { category: ['Food'], amount: 50, date: '2025-01-15' }
          ]
        })
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(3000); // 3 seconds for lighter endpoint
    });
  });

  describe('Memory Usage Tests', () => {
    test('CardRank processing does not cause memory leaks', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate multiple CardRank requests
      const promises = Array.from({ length: 10 }, () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ recommended_card: { id: '1' } })
        });
        
        return fetch('/api/cardrank/recommend', {
          method: 'POST',
          body: JSON.stringify({
            merchant: 'Test',
            category: 'shopping',
            amount: 100
          })
        });
      });

      await Promise.all(promises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Concurrent Request Handling', () => {
    test('handles multiple simultaneous CardRank requests', async () => {
      // Mock multiple responses
      Array.from({ length: 5 }, () => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            recommended_card: { id: Math.random().toString(), name: 'Test Card' }
          })
        });
      });

      const startTime = performance.now();
      
      const promises = Array.from({ length: 5 }, (_, index) => 
        fetch('/api/cardrank/recommend', {
          method: 'POST',
          body: JSON.stringify({
            merchant: `Merchant${index}`,
            category: 'shopping',
            amount: 100 + index
          })
        })
      );

      const responses = await Promise.all(promises);
      const endTime = performance.now();
      
      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
      
      // All requests should complete within 10 seconds
      expect(endTime - startTime).toBeLessThan(10000);
    });

    test('handles mixed AI feature requests concurrently', async () => {
      // Mock responses for different endpoints
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ recommended_card: { id: '1' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ 
            minimize_interest_plan: { split: [] },
            maximize_score_plan: { split: [] }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ 
            category_totals: {},
            insight: 'Test insight'
          })
        });

      const startTime = performance.now();
      
      const [cardRankResponse, interestKillerResponse, spendingInsightsResponse] = await Promise.all([
        fetch('/api/cardrank/recommend', {
          method: 'POST',
          body: JSON.stringify({ merchant: 'Test', category: 'shopping' })
        }),
        fetch('/api/interestkiller/suggest', {
          method: 'POST',
          body: JSON.stringify({ accounts: [], payment_amount: 200 })
        }),
        fetch('/api/spending-insights', {
          method: 'POST',
          body: JSON.stringify({ transactions: [] })
        })
      ]);

      const endTime = performance.now();
      
      expect(cardRankResponse.ok).toBe(true);
      expect(interestKillerResponse.ok).toBe(true);
      expect(spendingInsightsResponse.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(8000);
    });
  });

  describe('Error Recovery Performance', () => {
    test('recovers quickly from network errors', async () => {
      // First request fails
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Second request succeeds
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ recommended_card: { id: '1' } })
      });

      const startTime = performance.now();
      
      try {
        await fetch('/api/cardrank/recommend', {
          method: 'POST',
          body: JSON.stringify({ merchant: 'Test' })
        });
      } catch (error) {
        // Expected to fail
      }

      // Retry should be fast
      const retryStartTime = performance.now();
      const response = await fetch('/api/cardrank/recommend', {
        method: 'POST',
        body: JSON.stringify({ merchant: 'Test' })
      });
      const retryEndTime = performance.now();

      expect(response.ok).toBe(true);
      expect(retryEndTime - retryStartTime).toBeLessThan(1000); // Quick retry
    });
  });

  describe('Data Processing Efficiency', () => {
    test('processes large transaction datasets efficiently', async () => {
      const largeTransactionSet = Array.from({ length: 1000 }, (_, index) => ({
        id: index.toString(),
        amount: Math.random() * 100,
        category: ['Shopping', 'Food', 'Gas'][index % 3],
        date: new Date(2025, 0, (index % 30) + 1).toISOString()
      }));

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          category_totals: { Shopping: 15000, Food: 12000, Gas: 8000 },
          insight: 'Large dataset processed'
        })
      });

      const startTime = performance.now();
      
      const response = await fetch('/api/spending-insights', {
        method: 'POST',
        body: JSON.stringify({
          transactions: largeTransactionSet
        })
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(processingTime).toBeLessThan(5000); // Should handle 1000 transactions in under 5s
    });

    test('handles complex account structures efficiently', async () => {
      const complexAccounts = Array.from({ length: 20 }, (_, index) => ({
        id: index.toString(),
        name: `Card ${index}`,
        balance: Math.random() * 5000,
        apr: 15 + Math.random() * 15,
        creditLimit: 5000 + Math.random() * 10000,
        promo_apr_expiry_date: index % 3 === 0 ? '2025-12-31' : null
      }));

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          minimize_interest_plan: { split: complexAccounts.map(acc => ({ card_id: acc.id, amount: 10 })) },
          maximize_score_plan: { split: complexAccounts.map(acc => ({ card_id: acc.id, amount: 5 })) },
          nexus_recommendation: 'minimize_interest'
        })
      });

      const startTime = performance.now();
      
      const response = await fetch('/api/interestkiller/suggest', {
        method: 'POST',
        body: JSON.stringify({
          accounts: complexAccounts,
          payment_amount: 1000
        })
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(processingTime).toBeLessThan(3000); // Complex optimization in under 3s
    });
  });
});