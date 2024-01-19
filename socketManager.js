export default class WebSocketManager {
    constructor(url = null, userId = null, receiveMessageCallback = null) {
        this.socket = null // WebSocket 对象
        this.pingTimeout = null // 心跳计时器
        this.reconnectTimeout = 5000 // 重连间隔，单位：毫秒
        this.maxReconnectAttempts = 10 // 最大重连尝试次数
        this.reconnectAttempts = 0; // 当前重连尝试次数
        this.id = userId //用户ID（业务逻辑，根据自己业务需求调整）
        this.url = url // WebSocket 连接地址
        this.receiveMessageCallback = receiveMessageCallback // 接收消息回调函数
    }

    /**
     * 初始化
     * @param {String} url WebSocket 连接地址
     * @param {String} id 用户ID
     */
    async initialize() {
        if( this.url && this.id){
            // 连接WebSocket
            this.connectWebSocket()
        }else{
            console.error('WebSocket erros: 请传入连接地址和用户id')
        }
    }

    /**
     * 创建WebSocket连接
     */
    connectWebSocket() {
        // 通过id生成唯一值（服务端要求，具体根据自己业务去调整）
        let id = `${this.id}-${Math.random()}`
        // 创建 WebSocket 对象
        this.socket = new WebSocket(this.url, id)

        // 处理连接打开事件
        this.socket.addEventListener('open', event => {
            // 心跳机制
            this.startHeartbeat()
        })

        // 处理接收到消息事件
        this.socket.addEventListener('message', event => {
            this.receiveMessage(event)
        })

        // 处理连接关闭事件
        this.socket.addEventListener('close', event => {
            // 清除定时器
            clearTimeout(this.pingTimeout)
            clearTimeout(this.reconnectTimeout)
            // 尝试重连
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++
                this.reconnectTimeout = setTimeout(() => {
                    this.connectWebSocket()
                }, this.reconnectTimeout)
            } else {
                // 重置重连次数
                this.reconnectAttempts = 0
                console.error('WebSocketManager erros: Max reconnect attempts reached. Unable to reconnect.')
            }
        })

        // 处理 WebSocket 错误事件
        this.socket.addEventListener('error', event => {
            console.error('WebSocketManager error:', event)
        })
    }

     /**
     * 启动心跳机制
     */
    startHeartbeat() {
        this.pingTimeout = setInterval(() => {
            // 发送心跳消息
            this.sendMessage('ping')
        }, 10000) // 每隔 10 秒发送一次心跳
    }

    /**
     * 发送消息
     * @param {String} message 消息内容
     */
    sendMessage(message) {
       if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else {
            console.error('WebSocketManager error: WebSocket connection is not open. Unable to send message.')
        }
    }

     /**
     * 接收到消息
     */
    receiveMessage(event) {
        // 根据业务自行处理
        console.log('receiveMessage:', event.data)
        this.receiveMessageCallback && this.receiveMessageCallback(event.data)
    }

     /**
     * 关闭连接
     */
    closeWebSocket() {
        this.socket.close()
        // 清除定时器 重置重连次数
        clearTimeout(this.pingTimeout)
        clearTimeout(this.reconnectTimeout)
        this.reconnectAttempts = 0
    }
}
