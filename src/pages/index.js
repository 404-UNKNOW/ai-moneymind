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

    try {
      // 解析纯文本交易数据
      const transactions = transactionData.split('\n').map(line => line.trim()).filter(line => line);
      const parsedTransactionData = transactions.map(line => {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length === 3) {
          // 假设格式: 日期, 描述, 金额
          return {
            date: parts[0],
            description: parts[1],
            amount: parseFloat(parts[2]) // 将金额转换为数字
          };
        }
        return null; // 忽略格式不正确的行
      }).filter(transaction => transaction !== null);

      // if (parsedTransactionData.length === 0 && transactionData.length > 0) {
      //   // 可选：如果用户输入了文本但没有成功解析任何交易，可以提示错误
      //   setError('未能解析任何交易数据。请检查输入格式是否正确（例如：日期, 描述, 金额）。');
      //   setLoading(false);
      //   return;
      // }


      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userDescription: userDescription,
          transactionData: parsedTransactionData, // 发送解析后的数据
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
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '分析中...' : '获取财务分析'}
        </button>
      </form>

      {error && <div style={{ color: 'red' }}>错误: {error}</div>}

      {renderAnalysisResult()}
    </div>
  );
}

export default HomePage; 