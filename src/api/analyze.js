import { GoogleGenerativeAI } from '@google/generative-ai';

// 从环境变量中获取 API 密钥
// TODO: 确保在 Vercel 中配置 GEMINI_API_KEY 环境变量
const API_KEY = process.env.GEMINI_API_KEY;

// 初始化 GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(API_KEY);

// 简单的交易分类函数
function categorizeTransaction(description) {
    const lowerDescription = description.toLowerCase();
    if (lowerDescription.includes('咖啡') || lowerDescription.includes('餐饮') || lowerDescription.includes('餐厅') || lowerDescription.includes('外卖')) {
        return '餐饮';
    } else if (lowerDescription.includes('交通') || lowerDescription.includes('打车') || lowerDescription.includes('地铁') || lowerDescription.includes('公交')) {
        return '交通';
    } else if (lowerDescription.includes('购物') || lowerDescription.includes('电商') || lowerDescription.includes('服饰') || lowerDescription.includes('超市')) {
        return '购物';
    } else if (lowerDescription.includes('娱乐') || lowerDescription.includes('电影') || lowerDescription.includes('游戏')) {
        return '娱乐';
    } else if (lowerDescription.includes('工资') || lowerDescription.includes('收入')) {
        return '收入'; // 虽然是支出分析，但也识别收入
    } else {
        return '其他';
    }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { userDescription, transactionData, financialGoal } = req.body;

    if (!userDescription && !transactionData && !financialGoal) {
      return res.status(400).json({ message: 'Missing userDescription, transactionData, or financialGoal' });
    }

    // 处理交易数据，计算支出类别总金额
    const expenseCategories = {};
    let totalIncome = 0;
    let totalExpense = 0;

    if (transactionData && Array.isArray(transactionData)) {
      transactionData.forEach(transaction => {
        const amount = transaction.amount;
        if (amount < 0) { // 假设负数为支出
          const category = categorizeTransaction(transaction.description);
          expenseCategories[category] = (expenseCategories[category] || 0) + Math.abs(amount);
          totalExpense += Math.abs(amount);
        } else if (amount > 0) { // 假设正数为收入
          totalIncome += amount;
        }
      });
    }


    // 获取 Gemini Pro 模型
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 构建发送给 AI 的提示词
    // 结合用户描述、交易数据和财务目标进行分析
    const prompt = `用户描述: "${userDescription || '无'}"
关联的银行交易数据: ${JSON.stringify(transactionData || '无')}
我的财务目标是: "${financialGoal || '无'}"

请根据以上信息，特别是我的财务目标，用简单易懂的语言进行财务分析，并提供以下内容：
1. 总结主要的支出模式，并参考我已计算的支出类别总金额（${JSON.stringify(expenseCategories)}）。
2. 给出至少3条具体的、可操作的储蓄建议。这些建议应该与我的财务目标、用户描述或交易数据相关联。请在每条储蓄建议前注明相关的支出类别（例如：餐饮：每天少买一杯咖啡可月省$100）。
3. 如果用户提到了财务目标，请给出与该目标相关的初步财务行动建议或思路。
请避免使用复杂的财务术语。`;

    // 调用 Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 返回 AI 的分析结果和结构化支出数据
    res.status(200).json({
      analysis: text,
      expenseCategories: expenseCategories, // 新增：返回支出类别数据
      totalExpense: totalExpense, // 新增：返回总支出
      totalIncome: totalIncome // 新增：返回总收入
    });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ message: 'Error processing financial data', error: error.message });
  }
} 