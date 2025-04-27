import koa from 'koa';
import Router from 'koa-router';
import ollama from 'ollama';
import bodyParser from 'koa-bodyparser';

const app = new koa()
const router = new Router()

// 跨域支持
app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE')
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With')
    if (ctx.method === 'OPTIONS') {
        ctx.status = 204
        return
    }
    await next()
})

app.use(bodyParser())

// --- 这里先定义路由 ---

router.get('/', async (ctx) => {
    ctx.body = `<h1>hello world</h1>`
})

router.post('/chatai', async (ctx) => {
    ctx.set('Content-Type', 'text/plain');
    ctx.set('Transfer-Encoding', 'chunked');
    ctx.status = 200; 
    const message = ctx.request.body.message || 'hello'

    const data = {
        model: "deepseek-r1:1.5b",
        messages: [
            {
                role: "user",
                content: message
            }
        ],
        stream: true
    }
    // const response = await axios.post('http://localhost:11434/api/chat',data)

    const response = await ollama.chat(data)

        // 新增：监听客户端断开连接
        let aborted = false;
        ctx.req.on('close', () => {
            console.log('客户端连接断开');
            aborted = true;
        });
    
        try {
            for await (const part of response) {
                if (aborted) {
                    console.log('检测到断开，中止发送');
                    break; // 退出循环，不再发送
                }
                ctx.res.write(part.message.content);
            }
        } catch (error) {
            console.error('流式发送过程中出错', error);
            ctx.res.write('【服务器异常中断】');
        } finally {
            ctx.res.end();
        }

    for await (const part of response) {
        ctx.res.write(part.message.content);  // 原生 Response
    }
    ctx.res.end();
});

// --- 然后再 use 路由 ---
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => {
  console.log('server is running at port 3000');
})