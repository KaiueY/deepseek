/* eslint-disable no-undef */
const koa = require('koa')
const Router = require('koa-router')
const axios = require('axios')
const bodyParser = require('koa-bodyparser') ;



const app = new koa()
const  router = new Router()

// 跨域支持
app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE')
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With')
    // ctx.set('Access-Control-Max-Age', '86400') // 预检请求缓存24小时
    
    // 处理 OPTIONS 预检请求
    if (ctx.method === 'OPTIONS') {
        ctx.status = 204
        return
    }
    
    await next()
})

/**
 * bodyParser
 */
app.use(bodyParser())

// 确保跨域中间件在路由中间件之前使用
app.use(router.routes())
// app.use(router.allowedMethods())




router.get('/',async (ctx)=>{
    // ctx 当前请求响应的上下文

    
    ctx.body = `
        <h1>hello world</h1>`
})
// 向11434/api/chat 发送post请求
router.post('/chatai',async (ctx) => {

    const message  = ctx.request.body.message || 'hello'
    const data = {
        model:"deepseek-r1:1.5b",
        messages:[
            {
                role:"user",
                content:message
            }
        ],
        stream:false
    }
    const respons = await axios.post('http://localhost:11434/api/chat',data)

    ctx.body = {
        code:200,
        message:respons.data.message.content.replace(/<think>[\s\S]*?<\/think>/, '')
    }
})



app.listen(3000, () => {
  console.log('server is running at port 3000')
})