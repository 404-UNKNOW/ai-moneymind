import React, { useState } from 'react';

function HomePage() {
  const [userDescription, setUserDescription] = useState('');
  const [transactionData, setTransactionData] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setAnalysisResult('');

    // 前端数据格式验证
    const transactions = transactionData.split('\n').map(line => line.trim()).filter(line => line);
    const formattedTransactions = [];
    const errors = [];

    transactions.forEach((line, index) => {
      const parsedTransactionData = line.split(/[,，]/).map(part => part.trim());
      if (parsedTransactionData.length === 3) {
        const [date, description, amountStr] = parsedTransactionData;
        const amount = parseFloat(amountStr);

        // 简单的日期格式验证 (可以根据需要更复杂)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
           errors.push(`第 ${index + 1} 行: 日期格式不正确 (应为 YYYY-MM-DD)。`);
           return;
        }

        // 金额验证
        if (isNaN(amount)) {
          errors.push(`第 ${index + 1} 行: 金额不是有效的数字。`);
          return;
        }

        formattedTransactions.push({
          date: date,
          description: description,
          amount: amount
        });

      } else if (line.length > 0) { // 只对非空行进行错误提示
        errors.push(`第 ${index + 1} 行: 格式不正确 (应为 日期, 描述, 金额)。`);
      }
    });

    if (errors.length > 0) {
      setError('交易数据存在格式错误：\n' + errors.join('\n'));
      setLoading(false);
      return; // 阻止发送请求
    }

    // 如果没有错误，继续发送请求
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userDescription: userDescription,
          transactionData: formattedTransactions, // 发送验证和格式化后的数据
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '后端请求失败');
      }

      const data = await response.json();
      setAnalysisResult(data.analysis);

    } catch (error) {
      setError(error.message);
      console.error('Frontend fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    // Simple parsing logic (adjust based on actual AI output format)
    const sections = analysisResult.split('\n\n'); // Assuming sections are separated by double newlines
    const structuredResult = {};

    sections.forEach(section => {
      if (section.startsWith('支出模式总结:')) {
        structuredResult.summary = section.replace('支出模式总结:', '').trim();
      } else if (section.startsWith('储蓄建议:')) {
        // Assuming suggestions are in a list format after the heading
        structuredResult.suggestions = section.replace('储蓄建议:', '').trim().split('\n').map(item => item.trim()).filter(item => item);
      } else if (section.startsWith('目标建议:')) {
         // Assuming goal suggestions are in a list format after the heading
        structuredResult.goalSuggestions = section.replace('目标建议:', '').trim().split('\n').map(item => item.trim()).filter(item => item);
      } else {
        // Handle other potential sections or introductory text
        if (!structuredResult.intro) {
            structuredResult.intro = section.trim();
        } else {
            structuredResult.intro += '\n\n' + section.trim();
        }
      }
    });

    return (
      <div className="result-container">
        <h2>财务分析结果:</h2>
        {structuredResult.intro && <p>{structuredResult.intro}</p>}
        {structuredResult.summary && (
          <div>
            <h3>支出模式总结:</h3>
            <p>{structuredResult.summary}</p>
          </div>
        )}
        {structuredResult.suggestions && structuredResult.suggestions.length > 0 && (
          <div>
            <h3>储蓄建议:</h3>
            <ul>
              {structuredResult.suggestions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
         {structuredResult.goalSuggestions && structuredResult.goalSuggestions.length > 0 && (
          <div>
            <h3>目标建议:</h3>
            <ul>
              {structuredResult.goalSuggestions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h1>MoneyMind 财务分析</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="description">您的财务描述:</label>
          <br />
          <textarea
            id="description"
            rows="4"
            cols="50"
            value={userDescription}
            onChange={(e) => setUserDescription(e.target.value)}
            disabled={loading}
          ></textarea>
        </div>
        <div>
          <label htmlFor="transactions">交易数据 (每行: 日期, 描述, 金额):</label>
          <br />
          <textarea
            id="transactions"
            rows="6"
            cols="50"
            value={transactionData}
            onChange={(e) => setTransactionData(e.target.value)}
            disabled={loading}
          ></textarea>
          <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
            每行输入一笔交易，格式示例: 2023-10-26, 咖啡, -30
          </p>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '分析中...' : '获取财务分析'}
        </button>

        {loading && <p style={{ textAlign: 'center', marginTop: '10px', color: '#007bff' }}>正在进行财务分析...</p>}

      </form>

      {error && <div style={{ color: 'red', fontWeight: 'bold', marginTop: '10px' }}>错误: {error}</div>}

      {renderAnalysisResult()}
    </div>
  );
}

export default HomePage; 