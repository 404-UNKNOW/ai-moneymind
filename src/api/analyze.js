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
    const { userDescription, transactionData } = req.body;

    if (!userDescription && !transactionData) {
      return res.status(400).json({ message: 'Missing userDescription or transactionData' });
    }

    // 获取 Gemini Pro 模型
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 构建发送给 AI 的提示词
    // 结合用户描述和交易数据进行分析
    const prompt = `用户描述: "${userDescription || '无'}"
关联的银行交易数据: ${JSON.stringify(transactionData || '无')}

请根据以上信息，用简单易懂的语言进行财务分析，并提供以下内容：
1. 总结主要的支出模式。
2. 给出至少3条具体的、可操作的储蓄建议。这些建议应该与用户的描述或交易数据相关联，例如"减少咖啡支出可月省xxx元"等。
3. 如果用户提到了财务目标，请给出与该目标相关的初步财务行动建议或思路。
请避免使用复杂的财务术语。`;

    // 调用 Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 返回 AI 的分析结果
    res.status(200).json({ analysis: text });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ message: 'Error processing financial data', error: error.message });
  }
} 