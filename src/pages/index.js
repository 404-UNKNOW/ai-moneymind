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
      // 实际应用中，transactionData 应该是一个对象或数组
      // 这里为了简化，我们假设用户直接输入 JSON 字符串
      let parsedTransactionData = null;
      if (transactionData) {
        try {
          parsedTransactionData = JSON.parse(transactionData);
        } catch (jsonError) {
          setError('无效的交易数据格式，请输入有效的 JSON。');
          setLoading(false);
          return;
        }
      }


      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userDescription: userDescription,
          transactionData: parsedTransactionData,
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
          <label htmlFor="transactions">交易数据 (JSON 格式):</label>
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

      {analysisResult && (
        <div>
          <h2>分析结果:</h2>
          <p>{analysisResult}</p>
        </div>
      )}
    </div>
  );
}

export default HomePage; 