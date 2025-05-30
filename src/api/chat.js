// src/api/chat.js

import { GoogleGenerativeAI } from '@google/generative-ai';

// 从环境变量中获取 API 密钥
// TODO: 确保在 Vercel 中配置 GEMINI_API_KEY 环境变量
const API_KEY = process.env.GEMINI_API_KEY;

// 初始化 GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { message, chatHistory, analysisResult } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Missing message in request body' });
    }

    // 格式化聊天历史为 Gemini API 期望的格式
    const history = chatHistory ? chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model', // 映射 sender 到 role
        parts: [{ text: msg.text }] // 文本内容放在 parts 数组中
    })) : [];

    // 获取 Gemini Pro 模型
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 构建发送给 AI 的内容，包括系统指令、分析结果、历史和当前消息
    const contents = [
        { role: "system", parts: [{ text: "你是一个友好的AI财务教练，专门用简单易懂的语言为非技术用户提供个人财务指导和解释。请根据以下提供的财务分析结果、会话历史和用户问题给出回答，并使用 Markdown 格式组织你的回复，例如使用标题、列表、加粗等。" }] },
        ...(analysisResult ? [{ role: "user", parts: [{ text: `用户财务分析结果：\n${analysisResult}` }] }, { role: "model", parts: [{ text: "好的，我已经参考了您的财务分析结果。" }] }] : []),
        ...history,
        { role: "user", parts: [{ text: message }] }
    ];

    // 调用 Gemini API
    const result = await model.generateContent({ contents: contents });
    const response = await result.response;
    const text = response.text();

    // 返回 AI 的回答
    res.status(200).json({ reply: text });

  } catch (error) {
    console.error('Error calling Gemini API for chat:', error);
    res.status(500).json({ message: 'Error processing chat message', error: error.message });
  }
} 