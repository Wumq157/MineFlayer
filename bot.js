const mineflayer = require('mineflayer')
const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
const readline = require('readline')

// 🔹 Configurações do bot
const botOptions = {
  host: 'mc.hypixel.net',
  username: '',
  version: '1.8.9',
  auth: 'microsoft' // ou 'mojang' dependendo da sua conta
}

let bot
let isRunning = false
let currentLoop = 0
let clickingInterval = null

// 🔹 Interface para capturar entrada do console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function createBot() {
  console.log('🔄 Conectando ao Hypixel...')
  
  bot = mineflayer.createBot(botOptions)
  
  bot.on('login', () => {
    console.log('✅ Bot logado no servidor!')
  })
  
  bot.once('spawn', () => {
    console.log('🎮 Bot spawnou no Hypixel!')
    
    // Inicia o viewer web
    mineflayerViewer(bot, { port: 3000 })
    console.log('🌍 Viewer disponível em http://localhost:3000')
    console.log('')
    console.log('📝 Comandos disponíveis:')
    console.log('   .mensagem - Enviar no chat')
    console.log('   start - Iniciar coleta de abóbora')
    console.log('   stop - Parar coleta de abóbora')
    console.log('   quit - Sair do bot')
    console.log('=' * 50)
  })
  
  // 🔹 Exibir mensagens do chat no console
  bot.on('chat', (username, message) => {
    if (username === bot.username) return
    console.log(`💬 ${username}: ${message}`)
  })
  
  // 🔹 Exibir mensagens do sistema filtradas
  bot.on('message', (jsonMsg) => {
    const message = jsonMsg.toString()
    if (!message.includes('§') && !message.includes('[RANK]') && 
        !message.includes('Welcome') && message.length < 100) {
      console.log(`📢 ${message}`)
    }
  })
  
  // 🔹 Reconexão automática a cada 5s
  bot.on('end', () => {
    console.log('🔌 Conexão perdida. Reconectando em 5 segundos...')
    isRunning = false
    setTimeout(createBot, 5000)
  })
  
  bot.on('error', (err) => {
    console.log('⚠️ Erro:', err.message)
    isRunning = false
    setTimeout(createBot, 5000)
  })
  
  bot.on('kicked', (reason) => {
    console.log('❌ Kickado:', reason)
    isRunning = false
    setTimeout(createBot, 5000)
  })
}

// 🔹 Função para cliques contínuos (20 CPS como no AHK)
function startContinuousClicking() {
  clickingInterval = setInterval(() => {
    if (isRunning && bot && bot.entity) {
      // Simula clique esquerdo contínuo de forma mais natural
      bot.swingArm()
      
      // Tenta quebrar bloco na frente (mais legit)
      const block = bot.blockAtCursor(5)
      if (block) {
        bot.dig(block).catch(() => {})
      }
    }
  }, 50) // 50ms = 20 CPS
}

function stopContinuousClicking() {
  if (clickingInterval) {
    clearInterval(clickingInterval)
    clickingInterval = null
  }
}

// 🔹 Função principal que replica o AHK
async function startPumpkinFarm() {
  if (isRunning) {
    console.log('⚠️ Bot já está rodando!')
    return
  }
  
  if (!bot || !bot.entity) {
    console.log('❌ Bot não está conectado!')
    return
  }
  
  isRunning = true
  console.log('🎃 Iniciando coleta de abóbora...')
  
  while (isRunning) {
    try {
      // Abre chat e vai para skyblock (como no AHK)
      console.log('📨 Enviando comando skyblock...')
      bot.chat('/skyblock')
      await sleep(5000)
      
      // Warp para garden
      console.log('🌱 Indo para o garden...')
      bot.chat('/warp garden')
      await sleep(1000)
      
      // Loop interno (10 vezes como no AHK)
      for (let i = 0; i < 10 && isRunning; i++) {
        console.log(`🔄 Ciclo ${i + 1}/10 (Loop total: ${currentLoop + 1})`)
        
        // Inicia cliques contínuos
        startContinuousClicking()
        
        // Movimento direita + trás (D + S down)
        bot.setControlState('right', true)
        bot.setControlState('back', true)
        await sleep(31000) // 28 segundos
        
        // Para direita (D up)
        bot.setControlState('right', false)
        await sleep(1500) // 3 segundos de pausa
        
        // Movimento esquerda (A down)
        bot.setControlState('left', true)
        await sleep(31000) // 28 segundos
        
        // Para esquerda (A up)
        bot.setControlState('left', false)
        bot.setControlState('back', false) // Para S também
        
        // Para cliques contínuos
        stopContinuousClicking()
        
        await sleep(1500) // Pausa entre ciclos
        
        if (!isRunning) break
      }
      
      currentLoop++
      console.log(`✅ Loop ${currentLoop} completo!`)
      
      // Pequena pausa entre loops principais
      await sleep(2000)
      
    } catch (error) {
      console.log('⚠️ Erro no farm:', error.message)
      await sleep(5000)
    }
  }
  
  // Limpa tudo ao parar
  stopContinuousClicking()
  bot.clearControlStates()
  console.log('⏹️ Coleta de abóbora parada!')
}

// 🔹 Função para parar o farm
function stopPumpkinFarm() {
  if (!isRunning) {
    console.log('ℹ️ Bot já está parado')
    return
  }
  
  isRunning = false
  stopContinuousClicking()
  
  if (bot) {
    bot.clearControlStates()
  }
  
  console.log('🛑 Parando coleta de abóbora...')
}

// 🔹 Função sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 🔹 Capturar comandos do console
rl.on('line', (input) => {
  const command = input.trim().toLowerCase()
  
  if (!bot || !bot.entity) {
    if (command !== 'quit' && command !== 'exit') {
      console.log('❌ Bot não está conectado!')
      return
    }
  }

  if (input.startsWith('.')) {
    // Mensagem no chat
    const message = input.substring(1).trim()
    if (message.length > 0) {
      bot.chat(message)
      console.log(`✉️ Você: ${message}`)
    }
  } else if (command === 'start') {
    startPumpkinFarm()
  } else if (command === 'stop') {
    stopPumpkinFarm()
  } else if (command === 'quit' || command === 'exit') {
    console.log('👋 Encerrando bot...')
    stopPumpkinFarm()
    if (bot) bot.quit()
    process.exit(0)
  } else if (command === 'status') {
    console.log(`📊 Status: ${isRunning ? 'Rodando' : 'Parado'} | Loops: ${currentLoop}`)
  } else {
    console.log('💡 Comandos: start | stop | status | .mensagem | quit')
  }
})

// 🔹 Handlers para encerrar
process.on('SIGINT', () => {
  console.log('\n👋 Encerrando bot...')
  stopPumpkinFarm()
  if (bot) bot.quit()
  process.exit(0)
})

// 🔹 Iniciar o bot
console.log('🤖 Bot Hypixel - Coleta de Abóbora')
console.log('📧 Conta: otaviopech667@gmail.com')
createBot()