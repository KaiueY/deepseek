import  { useState, useEffect, useRef } from "react"
import axios from "axios"
import './App.css'


const chatApi = async (message) => {
  const response = await axios.post('http://localhost:3000/chatai',
    message, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return response.data
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



    // const callChatApi = async()=>{
    //   await chatApi({
    //     message:"Hello"
    //   })
    // }
    // callChatApi()

    // useEffect 第二个参数为空数组时，只执行一次，挂载完后执行唯一一次，不再执行
  }, [])

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight
    }
  }, [conversation])

  const askQuestion = async () => {
    if (!question.trim()) return

    const newQuestion = question.trim()
    setQuestion('') // 清空输入框

    setIsSubmitting(true)
    setConversation((preConversation) => {
      return [
        ...preConversation,
        {
          question: newQuestion,
          answer: 'Loading response...',
          timestamp: new Date().toISOString(),
          isNew: true
        }
      ]
    })

    setLoading(true)
    try {
      const message = `${newQuestion}`
      const response = await chatApi({
        message
      })
      
      // 更新对话记录中的答案
      setConversation((preConversation) => {
        const newConversation = [...preConversation]
        newConversation[newConversation.length - 1].answer = response.message
        // 保存到本地存储
        localStorage.setItem('conversation', JSON.stringify(newConversation))
        return newConversation
      })
    } catch (error) {
      console.warn(error)
      // 更新错误信息
      setConversation((preConversation) => {
        const newConversation = [...preConversation]
        newConversation[newConversation.length - 1].answer = '抱歉，出现了错误，请重试'
        return newConversation
      })
    } finally {
      setLoading(false)
      setIsSubmitting(false)
      // 移除新消息的动画标记
      setTimeout(() => {
        setConversation(prev => prev.map(item => ({ ...item, isNew: false })))
      }, 300)
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

export default App
