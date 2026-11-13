const prisma = require('../config/prisma');
const { scorePurchaseIntent } = require('./purchaseIntentService');

const HISTORY_LIMIT = 12;

function serviceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getOwner(req) {
  if (req.isAuth && req.userId) {
    return { userId: req.userId, guestSessionId: null };
  }
  if (typeof req.sessionId === 'string' && req.sessionId.trim()) {
    return { userId: null, guestSessionId: req.sessionId.trim() };
  }
  throw serviceError('Không xác định được phiên hội thoại. Vui lòng tải lại trang và thử lại.', 401);
}

async function findOwnedConversation(req, conversationId) {
  if (typeof conversationId !== 'string' || conversationId.length > 36) {
    throw serviceError('Mã hội thoại không hợp lệ', 400);
  }

  const owner = getOwner(req);
  const conversation = await prisma.aiConversation.findFirst({
    where: { id: conversationId, ...owner },
  });
  if (!conversation) {
    throw serviceError('Không tìm thấy hội thoại hoặc bạn không có quyền truy cập', 404);
  }
  return conversation;
}

async function startCustomerTurn(req, { conversationId, text, image }) {
  const owner = getOwner(req);
  let conversation;
  if (conversationId) {
    conversation = await findOwnedConversation(req, conversationId);
  } else {
    conversation = await prisma.aiConversation.create({ data: owner });
  }

  const imageUrl = image
    ? await require('../utils/fileStorage').saveBase64ToFile(image, 'ai_chat')
    : null;
  const customerMessage = await prisma.aiConversationMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'CUSTOMER',
      text,
      ...(imageUrl ? { metadata: { imageUrl } } : {}),
    },
  });
  return { ...conversation, currentMessageId: customerMessage.id };
}

async function getRecentHistory(req, conversation) {
  const messages = await prisma.aiConversationMessage.findMany({
    where: {
      conversationId: conversation.id,
      ...(conversation.currentMessageId ? { id: { not: conversation.currentMessageId } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_LIMIT,
  });
  const recentHistory = messages.reverse().map((message) => ({
    role: message.role === 'CUSTOMER' ? 'user' : 'model',
    text: message.text,
    ...(Array.isArray(message.metadata?.productNames)
      ? { products: message.metadata.productNames }
      : {}),
    ...(typeof message.metadata?.outfitId === 'string'
      ? { outfitId: message.metadata.outfitId }
      : {}),
  }));
  const summary = conversation.contextSummary;
  if (summary && typeof summary === 'object' && !Array.isArray(summary)) {
    const preferences = Object.entries(summary)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${key}: ${String(value)}`);
    if (preferences.length > 0) {
      recentHistory.unshift({
        role: 'model',
        text: `Tóm tắt sở thích đã ghi nhận từ hội thoại trước: ${preferences.join('; ')}.`,
      });
    }
  }
  return recentHistory;
}

function updateContextSummary(previousSummary, intent = {}) {
  const allowedFields = ['gender', 'style', 'budget', 'color', 'fit', 'category', 'occasion', 'recommendedSize'];
  const summary = previousSummary && typeof previousSummary === 'object' && !Array.isArray(previousSummary)
    ? { ...previousSummary }
    : {};

  for (const field of allowedFields) {
    const value = intent[field];
    if (value !== null && value !== undefined && value !== '') {
      summary[field] = field === 'budget' && Number.isSafeInteger(Number(value))
        ? Number(value)
        : String(value).slice(0, 100);
    }
  }
  return summary;
}

async function completeAssistantTurn(req, conversation, result) {
  const customerMessages = await prisma.aiConversationMessage.findMany({
    where: { conversationId: conversation.id, role: 'CUSTOMER' },
    select: { role: true, text: true },
  });
  const intent = scorePurchaseIntent(customerMessages);
  const productIds = (result.products || [])
    .map((product) => product?.id || product?.productId)
    .filter((id) => typeof id === 'string');
  const productNames = (result.products || [])
    .map((product) => product?.name)
    .filter((name) => typeof name === 'string');
  const contextSummary = updateContextSummary(conversation.contextSummary, result.intent);
  const rawBudget = result.intent?.budget;
  const hasBudget = rawBudget !== null &&
    rawBudget !== undefined &&
    rawBudget !== '' &&
    Number.isSafeInteger(Number(rawBudget)) &&
    Number(rawBudget) >= 0;
  const budget = hasBudget
    ? Number(result.intent.budget)
    : conversation.budget;
  const handoffOffer = intent.userMessageCount >= 5 &&
    intent.score >= 60 &&
    conversation.handoffDecision !== 'DECLINED' &&
    !conversation.handoffConsentedAt;
  const assistantText = handoffOffer
    ? `${result.message}\n\nBạn có muốn được chuyên viên Routine tư vấn trực tiếp để lựa chọn sản phẩm phù hợp hơn không?`
    : result.message;

  await prisma.$transaction([
    prisma.aiConversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'AI',
        text: assistantText,
        metadata: {
          productIds,
          productNames,
          outfitId: typeof result.outfit?.id === 'string' ? result.outfit.id : null,
        },
      },
    }),
    prisma.aiConversation.update({
      where: { id: conversation.id },
      data: {
        intentScore: intent.score,
        intentLevel: intent.level,
        intentReason: intent.reason,
        intentSignals: intent.signals,
        interestedProductIds: [...new Set([
          ...(Array.isArray(conversation.interestedProductIds) ? conversation.interestedProductIds : []),
          ...productIds,
        ])],
        ...(Number.isSafeInteger(budget) ? { budget } : {}),
        contextSummary,
      },
    }),
  ]);

  return {
    conversationId: conversation.id,
    handoffOffer,
    message: assistantText,
  };
}

async function decideHandoff(req, conversationId, consent) {
  if (typeof consent !== 'boolean') {
    throw serviceError('Cần xác nhận lựa chọn tư vấn viên', 400);
  }
  const conversation = await findOwnedConversation(req, conversationId);

  if (!consent) {
    const updated = await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: { handoffDecision: 'DECLINED' },
    });
    return { status: updated.status, handoffDecision: updated.handoffDecision };
  }

  const customerMessages = await prisma.aiConversationMessage.findMany({
    where: { conversationId: conversation.id, role: 'CUSTOMER' },
    select: { role: true, text: true },
  });
  const intent = scorePurchaseIntent(customerMessages);
  if (intent.userMessageCount < 5 || intent.score < 60) {
    throw serviceError('Hội thoại chưa đủ điều kiện để tạo yêu cầu tư vấn trực tiếp', 400);
  }

  const updated = await prisma.aiConversation.update({
    where: { id: conversation.id },
    data: {
      handoffDecision: 'ACCEPTED',
      handoffConsentedAt: new Date(),
      status: 'LEAD_PENDING',
    },
  });
  return { status: updated.status, handoffDecision: updated.handoffDecision };
}

async function getCustomerMessages(req, conversationId) {
  const conversation = await findOwnedConversation(req, conversationId);
  const messages = await prisma.aiConversationMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, text: true, metadata: true, createdAt: true },
  });
  return {
    status: conversation.status,
    handoffDecision: conversation.handoffDecision,
    messages,
  };
}

async function listConsentedLeads() {
  const conversations = await prisma.aiConversation.findMany({
    where: { handoffConsentedAt: { not: null } },
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
      messages: {
        where: { role: 'CUSTOMER' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { text: true, createdAt: true },
      },
    },
  });

  const productIds = [...new Set(conversations.flatMap((conversation) => (
    Array.isArray(conversation.interestedProductIds) ? conversation.interestedProductIds : []
  )).filter((id) => typeof id === 'string'))];
  const products = productIds.length
    ? await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, status: true },
    })
    : [];
  const productById = new Map(products.map((product) => [product.id, product]));

  return conversations.map((conversation) => ({
    id: conversation.id,
    status: conversation.status,
    intentScore: conversation.intentScore,
    intentLevel: conversation.intentLevel,
    intentReason: conversation.intentReason,
    intentSignals: conversation.intentSignals,
    budget: conversation.budget,
    handoffConsentedAt: conversation.handoffConsentedAt,
    updatedAt: conversation.updatedAt,
    customer: conversation.user
      ? {
        id: conversation.user.id,
        name: conversation.user.fullName,
        email: conversation.user.email,
        phone: conversation.user.phoneNumber,
      }
      : null,
    interestedProducts: (Array.isArray(conversation.interestedProductIds)
      ? conversation.interestedProductIds
      : []).map((id) => productById.get(id)).filter(Boolean),
    lastMessage: conversation.messages[0]?.text || '',
  }));
}

async function getLeadMessages(conversationId) {
  const conversation = await prisma.aiConversation.findFirst({
    where: { id: conversationId, handoffConsentedAt: { not: null } },
    select: { id: true },
  });
  if (!conversation) throw serviceError('Không tìm thấy yêu cầu tư vấn đã được khách đồng ý', 404);
  return prisma.aiConversationMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, text: true, metadata: true, authorUserId: true, createdAt: true },
  });
}

async function sendStaffMessage(conversationId, authorUserId, text) {
  if (typeof text !== 'string' || !text.trim() || text.trim().length > 4000) {
    throw serviceError('Tin nhắn tư vấn phải có từ 1 đến 4000 ký tự', 400);
  }
  const conversation = await prisma.aiConversation.findFirst({
    where: { id: conversationId, handoffConsentedAt: { not: null } },
    select: { id: true, status: true },
  });
  if (!conversation) throw serviceError('Không tìm thấy yêu cầu tư vấn đã được khách đồng ý', 404);

  const [, message] = await prisma.$transaction([
    prisma.aiConversation.update({
      where: { id: conversation.id },
      data: { status: conversation.status === 'LEAD_PENDING' ? 'IN_PROGRESS' : conversation.status },
    }),
    prisma.aiConversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'STAFF',
        text: text.trim(),
        authorUserId,
      },
    }),
  ]);
  return message;
}

async function updateLeadStatus(conversationId, status) {
  if (!['LEAD_PENDING', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
    throw serviceError('Trạng thái yêu cầu tư vấn không hợp lệ', 400);
  }
  const result = await prisma.aiConversation.updateMany({
    where: { id: conversationId, handoffConsentedAt: { not: null } },
    data: { status },
  });
  if (result.count === 0) throw serviceError('Không tìm thấy yêu cầu tư vấn đã được khách đồng ý', 404);
  return { id: conversationId, status };
}

module.exports = {
  HISTORY_LIMIT,
  completeAssistantTurn,
  decideHandoff,
  getCustomerMessages,
  getLeadMessages,
  getRecentHistory,
  listConsentedLeads,
  sendStaffMessage,
  startCustomerTurn,
  updateLeadStatus,
};
