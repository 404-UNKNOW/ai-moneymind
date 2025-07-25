import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function HomePage() {
  const [userDescription, setUserDescription] = useState('');
  const [transactionData, setTransactionData] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [expenseData, setExpenseData] = useState(null);

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
      setExpenseData(data.expenseCategories);

    } catch (error) {
      setError(error.message);
      console.error('Frontend fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysisResult = () => {
    if (!analysisResult && !expenseData) return null;

    // 构建饼状图数据
    const chartData = {
        labels: Object.keys(expenseData || {}),
        datasets: [
            {
                data: Object.values(expenseData || {}),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966CC',
                    '#FF9F40'
                ],
                hoverBackgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966CC',
                    '#FF9F40'
                ]
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: '支出类别分布'
            }
        }
    };

    return (
      <div className="result-container">
        <h2>财务分析结果:</h2>
        {expenseData && Object.keys(expenseData).length > 0 && (
            <div style={{ width: '400px', height: '400px', margin: '20px auto' }}>
                <Pie data={chartData} options={chartOptions} />
            </div>
        )}
        {analysisResult && (
          <div>
            <h3>支出模式总结:</h3>
            <p>{analysisResult}</p>
          </div>
        )}
        {expenseData && (
          <div>
            <h3>支出类别分布:</h3>
            <p>{JSON.stringify(expenseData)}</p>
          </div>
        )}
      </div>
    );
  };

  const handleSendMessage = async (event) => {
      event.preventDefault();
      if (!chatInput.trim() || chatLoading) return;

      const newUserMessage = { sender: 'user', text: chatInput };
      setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
      setChatInput('');
      setChatLoading(true);
      setError(null);

      try {
          const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  message: newUserMessage.text,
                  chatHistory: chatMessages,
                  analysisResult: analysisResult
              }),
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || '聊天请求失败');
          }

          const data = await response.json();
          const aiMessage = { sender: 'ai', text: data.reply };
          setChatMessages(prevMessages => [...prevMessages, aiMessage]);

      } catch (error) {
          setError(error.message);
          console.error('Frontend chat fetch error:', error);
          setChatMessages(prevMessages => [...prevMessages, { sender: 'system', text: `错误: ${error.message}` }]);
      } finally {
          setChatLoading(false);
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

      <div style={{ marginTop: '40px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
        <h2>AI 财务教练聊天</h2>
        <div style={{ height: '300px', border: '1px solid #ccc', overflowY: 'scroll', padding: '10px', marginBottom: '10px' }}>
          {chatMessages.map((msg, index) => (
            <div key={index} style={{ marginBottom: '10px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
              <span style={{
                backgroundColor: msg.sender === 'user' ? '#007bff' : '#e9e9eb',
                color: msg.sender === 'user' ? 'white' : 'black',
                padding: '8px 12px',
                borderRadius: '12px',
                maxWidth: '70%',
                display: 'inline-block',
                wordBreak: 'break-word'
              }}>
                {msg.sender === 'ai' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
              </span>
            </div>
          ))}
           {chatLoading && (
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontStyle: 'italic', color: '#666' }}>AI 正在思考...</span>
            </div>
          )}
        </div>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: 0, boxShadow: 'none' }}>
          <textarea
            rows="2"
            cols="50"
            style={{ flexGrow: 1, marginRight: '10px' }}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={chatLoading}
            placeholder="输入您的问题..."
          ></textarea>
          <button type="submit" disabled={chatLoading} style={{ width: 'auto' }}>
            发送
          </button>
        </form>
      </div>
    </div>
  );
}

export default HomePage; 