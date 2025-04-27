import { useState, useEffect, useRef } from "react"
import './App.css'

// 改成 fetch 实现流式读取
const chatApi = async (message, onChunk) => {
  const response = await fetch('http://localhost:3000/chatai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });
  console.log({response});
  

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onChunk(chunk); // 每次来一小块，调用回调处理
  }
}

function App() {
  const [question, setQuestion] = useState('')
  const [conversation, setConversation] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const conversationRef = useRef(null)

  useEffect(() => {
    const storedConversation = localStorage.getItem('conversation')
    if (storedConversation) {
      setConversation(JSON.parse(storedConversation))
    }
  }, [])

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight
    }
  }, [conversation])

  const askQuestion = async () => {
    if (!question.trim()) return;

    const newQuestion = question.trim();
    setQuestion('');

    setIsSubmitting(true);

    setConversation((preConversation) => [
      ...preConversation,
      {
        question: newQuestion,
        answer: '',
        timestamp: new Date().toISOString(),
        isNew: true
      }
    ]);

    setLoading(true);

    try {
      await chatApi(newQuestion, (chunk) => {
        setConversation((prev) => {
          const newConv = [...prev];
          // 把最新一条的 answer 拼接上新内容
          newConv[newConv.length - 1].answer += chunk;
          return newConv;
        });
      });

      // 接收完后保存到本地
      setConversation(prev => {
        localStorage.setItem('conversation', JSON.stringify(prev));
        return prev;
      });

    } catch (error) {
      console.error(error);
      setConversation((prev) => {
        const newConv = [...prev];
        newConv[newConv.length - 1].answer = '抱歉，出现了错误，请重试';
        return newConv;
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      setTimeout(() => {
        setConversation(prev => prev.map(item => ({ ...item, isNew: false })));
      }, 300);
    }
  }

  return (
    <div className="chat-container">
      <p className="chat-title">This is ollama + deepseek LLM</p>

      <div className="conversation-history" ref={conversationRef}>
        {conversation.map((item, index) => (
          <div key={index} className={`conversation-item ${item.isNew ? 'new-message' : ''}`}>
            <div className="user-message">
              <div className="user-message-content">
                {item.question}
                <div className="message-timestamp">{new Date(item.timestamp).toLocaleString()}</div>
              </div>
            </div>

            <div className="ai-message">
              <div className="ai-message-content">
                {item.answer}
                <div className="message-timestamp">{new Date(item.timestamp).toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input 
          type="text" 
          value={question} 
          onChange={(e) => setQuestion(e.target.value)}
          onKeyUp={(e) => e.key === 'Enter' && askQuestion()} 
        />
        <button onClick={askQuestion} disabled={isSubmitting || loading}>Submit</button>
      </div>

      {loading && (
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      )}
    </div>
  )
}

export default App;