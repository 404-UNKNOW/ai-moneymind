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
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Missing message in request body' });
    }

    // 获取 Gemini Pro 模型
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 构建发送给 AI 的提示词
    // 添加一些上下文，指示 AI 扮演财务教练的角色
    const prompt = `你是一个友好的AI财务教练，专门用简单易懂的语言为非技术用户提供个人财务指导和解释。请根据以下用户的问题给出回答：

用户问题: "${message}"`;

    // 调用 Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 返回 AI 的回答
    res.status(200).json({ reply: text });

  } catch (error) {
    console.error('Error calling Gemini API for chat:', error);
    res.status(500).json({ message: 'Error processing chat message', error: error.message });
  }
} 