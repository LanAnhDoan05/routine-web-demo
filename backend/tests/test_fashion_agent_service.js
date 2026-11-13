const test = require('node:test');
const assert = require('node:assert/strict');
const geminiService = require('../src/services/geminiService');
const { MAX_TOOL_CALLS, TOOL_DECLARATIONS, runFashionAgent } = require('../src/services/fashionAgentService');

test('declares catalog-backed tools and completes a Gemini function-call round trip', async () => {
  const originalGenerate = geminiService.generateContentResponse;
  const seenRequests = [];
  const functionCall = {
    name: 'search_products',
    args: { category: 'áo sơ mi', color: 'trắng', priceMax: 500000 },
  };
  geminiService.generateContentResponse = async (request) => {
    seenRequests.push(request);
    if (seenRequests.length === 1) {
      return {
        functionCalls: [functionCall],
        candidates: [{ content: { parts: [{ functionCall }] } }],
      };
    }
    return { text: 'Mình đã tìm sản phẩm từ catalog Routine.' };
  };

  try {
    const calls = [];
    const result = await runFashionAgent({
      message: 'Tìm áo sơ mi trắng dưới 500.000 đồng.',
      history: [{ role: 'user', text: 'Tôi cần áo đi làm.' }],
      executeTool: async (name, args) => {
        calls.push({ name, args });
        return {
          products: [{ id: 'real-product-id', name: 'White Shirt', price: 450000 }],
        };
      },
    });

    assert.deepEqual(calls, [{ name: 'search_products', args: functionCall.args }]);
    assert.equal(result.message, 'Mình đã tìm sản phẩm từ catalog Routine.');
    assert.deepEqual(result.toolCalls, ['search_products']);
    assert.equal(result.products[0].id, 'real-product-id');
    assert.equal(seenRequests[0].tools, TOOL_DECLARATIONS);
    assert.ok(seenRequests[1].contents.some((entry) => (
      entry.role === 'user' && entry.parts?.some((part) => part.functionResponse?.name === 'search_products')
    )));
  } finally {
    geminiService.generateContentResponse = originalGenerate;
  }
});

test('caps calls per response to the configured tool limit', async () => {
  const originalGenerate = geminiService.generateContentResponse;
  const calls = Array.from({ length: MAX_TOOL_CALLS + 2 }, (_, index) => ({
    name: 'search_products',
    args: { keyword: `item-${index}` },
  }));
  geminiService.generateContentResponse = async () => ({
    functionCalls: calls,
    candidates: [{ content: { parts: calls.map((functionCall) => ({ functionCall })) } }],
  });

  try {
    let executed = 0;
    const result = await runFashionAgent({
      message: 'Tìm sản phẩm.',
      executeTool: async () => {
        executed += 1;
        return { products: [] };
      },
    });
    assert.equal(executed, MAX_TOOL_CALLS);
    assert.equal(result.toolCalls.length, MAX_TOOL_CALLS);
  } finally {
    geminiService.generateContentResponse = originalGenerate;
  }
});

test('requires a fixed tool executor and returns null when Gemini is unavailable', async () => {
  await assert.rejects(runFashionAgent({ message: 'Tìm áo.' }), TypeError);
  const originalGenerate = geminiService.generateContentResponse;
  geminiService.generateContentResponse = async () => null;
  try {
    const result = await runFashionAgent({
      message: 'Tìm áo.',
      executeTool: async () => ({ products: [] }),
    });
    assert.equal(result, null);
  } finally {
    geminiService.generateContentResponse = originalGenerate;
  }
});
