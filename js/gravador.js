/**
 * Módulo Gravador de Áudio - Sistema Simples e Mágico
 * Funcionalidades avançadas de gravação, processamento e exportação de áudio
 */

class GravadorAudio {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.audioStream = null;
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.totalPauseTime = 0;
        this.timerInterval = null;
        this.visualizerInterval = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        
        // Configurações
        this.config = {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 128000,
            sampleRate: 44100,
            channelCount: 1,
            maxDuration: 600000, // 10 minutos
            visualizerBars: 20
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createAudioVisualizer();
        this.checkBrowserSupport();
    }
    
    setupEventListeners() {
        // Botões de controle
        const btnIniciar = document.getElementById('btnIniciarGravacao');
        const btnParar = document.getElementById('btnPararGravacao');
        const btnReproducir = document.getElementById('btnReproducir');
        const btnBaixar = document.getElementById('btnBaixarAudio');
        const btnQR = document.getElementById('btnGerarQRAudio');
        
        if (btnIniciar) btnIniciar.addEventListener('click', () => this.iniciarGravacao());
        if (btnParar) btnParar.addEventListener('click', () => this.pararGravacao());
        if (btnReproducir) btnReproducir.addEventListener('click', () => this.reproduzirAudio());
        if (btnBaixar) btnBaixar.addEventListener('click', () => this.baixarAudio());
        if (btnQR) btnQR.addEventListener('click', () => this.gerarQRAudio());
        
        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.isRecording ? this.pararGravacao() : this.iniciarGravacao();
                    break;
                case 'r':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.iniciarGravacao();
                    }
                    break;
                case 'p':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.reproduzirAudio();
                    }
                    break;
            }
        });
        
        // Controle de volume do player
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            audioPlayer.addEventListener('loadedmetadata', () => {
                this.atualizarDuracaoAudio();
            });
            
            audioPlayer.addEventListener('timeupdate', () => {
                this.atualizarProgressoReproducao();
            });
        }
    }
    
    checkBrowserSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.mostrarErro('Seu navegador não suporta gravação de áudio. Use Chrome, Firefox ou Safari recentes.');
            return false;
        }
        
        if (!MediaRecorder.isTypeSupported(this.config.mimeType)) {
            // Fallback para outros formatos
            const fallbacks = ['audio/webm', 'audio/mp4', 'audio/wav'];
            for (const mimeType of fallbacks) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    this.config.mimeType = mimeType;
                    break;
                }
            }
        }
        
        return true;
    }
    
    async iniciarGravacao() {
        try {
            if (!this.checkBrowserSupport()) return;
            
            // Solicitar permissão para microfone
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: this.config.sampleRate,
                    channelCount: this.config.channelCount
                }
            });
            
            // Configurar MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.audioStream, {
                mimeType: this.config.mimeType,
                audioBitsPerSecond: this.config.audioBitsPerSecond
            });
            
            // Resetar dados
            this.audioChunks = [];
            this.audioBlob = null;
            this.totalPauseTime = 0;
            
            // Event listeners do MediaRecorder
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.finalizarGravacao();
            };
            
            this.mediaRecorder.onerror = (event) => {
                this.mostrarErro('Erro durante a gravação: ' + event.error);
            };
            
            // Iniciar gravação
            this.mediaRecorder.start(1000); // Capturar dados a cada segundo
            this.isRecording = true;
            this.startTime = Date.now();
            
            // Atualizar UI
            this.atualizarStatusGravacao('🔴 Gravando... Fale agora!');
            this.atualizarBotoesGravacao(true);
            
            // Iniciar timer e visualizador
            this.iniciarTimer();
            this.iniciarVisualizador();
            
            // Auto-parar após tempo máximo
            setTimeout(() => {
                if (this.isRecording) {
                    this.pararGravacao();
                    this.mostrarNotificacao('⏰ Gravação parada automaticamente (tempo máximo atingido)');
                }
            }, this.config.maxDuration);
            
        } catch (error) {
            this.tratarErroGravacao(error);
        }
    }
    
    pararGravacao() {
        if (!this.isRecording) return;
        
        try {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Parar stream
            if (this.audioStream) {
                this.audioStream.getTracks().forEach(track => track.stop());
            }
            
            // Parar timer e visualizador
            this.pararTimer();
            this.pararVisualizador();
            
            // Atualizar UI
            this.atualizarStatusGravacao('⏹️ Processando gravação...');
            this.atualizarBotoesGravacao(false);
            
        } catch (error) {
            this.mostrarErro('Erro ao parar gravação: ' + error.message);
        }
    }
    
    finalizarGravacao() {
        try {
            // Criar blob de áudio
            this.audioBlob = new Blob(this.audioChunks, { 
                type: this.config.mimeType 
            });
            
            // Criar URL para reprodução
            const audioURL = URL.createObjectURL(this.audioBlob);
            
            // Configurar player
            const audioPlayer = document.getElementById('audioPlayer');
            if (audioPlayer) {
                audioPlayer.src = audioURL;
                audioPlayer.style.display = 'block';
            }
            
            // Calcular duração
            const duracao = Math.floor((Date.now() - this.startTime - this.totalPauseTime) / 1000);
            
            // Atualizar UI
            this.atualizarStatusGravacao(`✅ Gravação concluída! Duração: ${this.formatarTempo(duracao)}`);
            this.habilitarBotoesReproducao(true);
            
            // Incrementar estatística
            if (window.sistemaSimplesMagico) {
                window.sistemaSimplesMagico.incrementarEstatistica('audiosGravados');
            }
            
            // Notificação de sucesso
            this.mostrarSucesso('🎉 Gravação concluída com sucesso!');
            
        } catch (error) {
            this.mostrarErro('Erro ao finalizar gravação: ' + error.message);
        }
    }
    
    reproduzirAudio() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer && this.audioBlob) {
            if (audioPlayer.paused) {
                audioPlayer.play();
                this.mostrarNotificacao('▶️ Reproduzindo áudio...');
            } else {
                audioPlayer.pause();
                this.mostrarNotificacao('⏸️ Áudio pausado');
            }
        }
    }
    
    async baixarAudio() {
        if (!this.audioBlob) {
            this.mostrarErro('Nenhum áudio gravado para baixar');
            return;
        }
        
        try {
            // Converter para MP3 se possível
            const audioFinal = await this.converterParaMP3(this.audioBlob);
            
            // Nome do arquivo
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const nomeArquivo = `audio-decisao-${timestamp}.mp3`;
            
            // Criar link de download
            const url = URL.createObjectURL(audioFinal);
            const link = document.createElement('a');
            link.href = url;
            link.download = nomeArquivo;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            this.mostrarSucesso(`💾 Áudio baixado: ${nomeArquivo}`);
            
            // Mostrar instruções
            setTimeout(() => {
                this.mostrarInstrucoes();
            }, 2000);
            
        } catch (error) {
            this.mostrarErro('Erro ao baixar áudio: ' + error.message);
        }
    }
    
    async converterParaMP3(audioBlob) {
        // Por enquanto, retorna o blob original
        // Em uma implementação futura, poderia usar Web Audio API
        // ou uma biblioteca como lamejs para conversão real para MP3
        return audioBlob;
    }
    
    gerarQRAudio() {
        const modal = this.criarModalQR();
        document.body.appendChild(modal);
        
        // Mostrar modal
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
    }
    
    criarModalQR() {
        const modal = document.createElement('div');
        modal.className = 'modal-qr';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%;">
                <h3 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">
                    🎧 Gerar QR Code do Áudio
                </h3>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                        📎 Cole o link do áudio na nuvem:
                    </label>
                    <input type="url" id="linkAudioQR" placeholder="https://drive.google.com/..." 
                           style="width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                        Exemplo: Google Drive, Dropbox, OneDrive, etc.
                    </div>
                </div>
                
                <div id="qrPreview" style="text-align: center; margin: 20px 0; display: none;">
                    <img id="qrImage" style="max-width: 200px; border: 2px solid #2c3e50; border-radius: 8px;">
                    <p style="margin-top: 10px; color: #666;">Escaneie para ouvir o áudio</p>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Cancelar
                    </button>
                    <button onclick="gerarQRDoAudio()" 
                            style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        🎯 Gerar QR Code
                    </button>
                    <button onclick="usarAudioNoFormulario()" 
                            style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        ✨ Usar no Formulário
                    </button>
                </div>
            </div>
        `;
        
        // Adicionar classe para animação
        modal.classList.add('show');
        
        return modal;
    }
    
    iniciarTimer() {
        this.timerInterval = setInterval(() => {
            const tempoDecorrido = Date.now() - this.startTime - this.totalPauseTime;
            const segundos = Math.floor(tempoDecorrido / 1000);
            
            const tempoElement = document.getElementById('tempoGravacao');
            if (tempoElement) {
                tempoElement.textContent = this.formatarTempo(segundos);
            }
        }, 1000);
    }
    
    pararTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    iniciarVisualizador() {
        if (!this.audioStream) return;
        
        try {
            // Configurar Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(this.audioStream);
            
            this.analyser.fftSize = 256;
            this.microphone.connect(this.analyser);
            
            // Iniciar visualização
            this.visualizerInterval = setInterval(() => {
                this.atualizarVisualizador();
            }, 100);
            
        } catch (error) {
            console.warn('Erro ao iniciar visualizador:', error);
        }
    }
    
    pararVisualizador() {
        if (this.visualizerInterval) {
            clearInterval(this.visualizerInterval);
            this.visualizerInterval = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        // Resetar visualizador
        this.resetarVisualizador();
    }
    
    createAudioVisualizer() {
        const visualizerContainer = document.createElement('div');
        visualizerContainer.id = 'audioVisualizer';
        visualizerContainer.className = 'audio-visualizer';
        visualizerContainer.style.display = 'none';
        
        // Criar barras do visualizador
        for (let i = 0; i < this.config.visualizerBars; i++) {
            const bar = document.createElement('div');
            bar.className = 'audio-bar';
            bar.style.height = '5px';
            visualizerContainer.appendChild(bar);
        }
        
        // Inserir após o status de gravação
        const statusElement = document.getElementById('statusGravacao');
        if (statusElement && statusElement.parentNode) {
            statusElement.parentNode.insertBefore(visualizerContainer, statusElement.nextSibling);
        }
    }
    
    atualizarVisualizador() {
        if (!this.analyser) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        
        const visualizer = document.getElementById('audioVisualizer');
        if (!visualizer) return;
        
        visualizer.style.display = 'flex';
        const bars = visualizer.querySelectorAll('.audio-bar');
        
        bars.forEach((bar, index) => {
            const dataIndex = Math.floor(index * bufferLength / bars.length);
            const amplitude = dataArray[dataIndex];
            const height = Math.max(5, (amplitude / 255) * 40);
            
            bar.style.height = height + 'px';
            bar.classList.toggle('active', amplitude > 50);
        });
    }
    
    resetarVisualizador() {
        const visualizer = document.getElementById('audioVisualizer');
        if (visualizer) {
            const bars = visualizer.querySelectorAll('.audio-bar');
            bars.forEach(bar => {
                bar.style.height = '5px';
                bar.classList.remove('active');
            });
            visualizer.style.display = 'none';
        }
    }
    
    atualizarStatusGravacao(status) {
        const statusElement = document.getElementById('statusGravacao');
        if (statusElement) {
            statusElement.textContent = status;
            
            // Adicionar classe baseada no status
            statusElement.className = 'status-gravacao';
            if (status.includes('Gravando')) {
                statusElement.classList.add('gravando');
            }
        }
    }
    
    atualizarBotoesGravacao(gravando) {
        const btnIniciar = document.getElementById('btnIniciarGravacao');
        const btnParar = document.getElementById('btnPararGravacao');
        
        if (btnIniciar) {
            btnIniciar.disabled = gravando;
            btnIniciar.textContent = gravando ? '🔴 Gravando...' : '🎤 Gravar';
        }
        
        if (btnParar) {
            btnParar.disabled = !gravando;
        }
    }
    
    habilitarBotoesReproducao(habilitar) {
        const botoes = ['btnReproducir', 'btnBaixarAudio', 'btnGerarQRAudio'];
        
        botoes.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = !habilitar;
            }
        });
    }
    
    atualizarDuracaoAudio() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            const duracao = Math.floor(audioPlayer.duration);
            console.log(`Áudio carregado - Duração: ${this.formatarTempo(duracao)}`);
        }
    }
    
    atualizarProgressoReproducao() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            const progresso = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            // Aqui poderia atualizar uma barra de progresso se existisse
        }
    }
    
    tratarErroGravacao(error) {
        console.error('Erro de gravação:', error);
        
        let mensagem = 'Erro ao iniciar gravação: ';
        
        switch(error.name) {
            case 'NotAllowedError':
                mensagem += 'Permissão negada. Permita o acesso ao microfone.';
                break;
            case 'NotFoundError':
                mensagem += 'Microfone não encontrado. Verifique se está conectado.';
                break;
            case 'NotReadableError':
                mensagem += 'Microfone está sendo usado por outro aplicativo.';
                break;
            case 'OverconstrainedError':
                mensagem += 'Configurações de áudio não suportadas.';
                break;
            default:
                mensagem += error.message || 'Erro desconhecido.';
        }
        
        this.mostrarErro(mensagem);
        this.resetarEstadoGravacao();
    }
    
    resetarEstadoGravacao() {
        this.isRecording = false;
        this.atualizarStatusGravacao('🎤 Pronto para gravar');
        this.atualizarBotoesGravacao(false);
        this.pararTimer();
        this.pararVisualizador();
        
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
    }
    
    formatarTempo(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    
    mostrarInstrucoes() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 90%;">
                <h3 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">
                    🎯 Como usar seu áudio
                </h3>
                
                <div style="line-height: 2; margin-bottom: 20px;">
                    <h4 style="color: #28a745; margin-bottom: 10px;">📤 1. Faça Upload para Nuvem:</h4>
                    <ul style="padding-left: 20px; margin-bottom: 15px;">
                        <li>🌐 <strong>Google Drive:</strong> drive.google.com</li>
                        <li>📦 <strong>Dropbox:</strong> dropbox.com</li>
                        <li>☁️ <strong>OneDrive:</strong> onedrive.live.com</li>
                        <li>🎵 <strong>SoundCloud:</strong> soundcloud.com</li>
                    </ul>
                    
                    <h4 style="color: #007bff; margin-bottom: 10px;">🔗 2. Obtenha o Link Público:</h4>
                    <ul style="padding-left: 20px; margin-bottom: 15px;">
                        <li>📂 Configure como "Qualquer pessoa com o link"</li>
                        <li>📋 Copie o link de compartilhamento</li>
                        <li>🔍 Teste o link em uma aba anônima</li>
                    </ul>
                    
                    <h4 style="color: #dc3545; margin-bottom: 10px;">✨ 3. Use no Sistema:</h4>
                    <ul style="padding-left: 20px;">
                        <li>📝 Cole o link no campo "Link do Áudio"</li>
                        <li>📱 QR Code será gerado automaticamente</li>
                        <li>🎧 Pessoas poderão ouvir escaneando o código</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        ✅ Entendi!
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Remover ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    mostrarSucesso(mensagem) {
        this.mostrarNotificacao(mensagem, 'success');
    }
    
    mostrarErro(mensagem) {
        this.mostrarNotificacao(mensagem, 'error');
    }
    
    mostrarNotificacao(mensagem, tipo = 'info') {
        const cores = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8'
        };
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${cores[tipo]};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            max-width: 350px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        toast.textContent = mensagem;
        document.body.appendChild(toast);
        
        // Animação de entrada
        setTimeout(() => toast.style.opacity = '1', 100);
        
        // Remover após tempo baseado no tipo
        const duracao = tipo === 'error' ? 6000 : 4000;
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duracao);
    }
    
    // Método público para limpeza
    destruir() {
        this.pararGravacao();
        this.pararTimer();
        this.pararVisualizador();
        
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.audioBlob) {
            URL.revokeObjectURL(this.audioBlob);
        }
    }
}

// Funções globais para os modais
window.gerarQRDoAudio = function() {
    const linkInput = document.getElementById('linkAudioQR');
    const link = linkInput.value.trim();
    
    if (!link) {
        alert('Por favor, cole o link do áudio primeiro.');
        return;
    }
    
    if (!link.startsWith('http')) {
        alert('Link inválido. Deve começar com http:// ou https://');
        return;
    }
    
    // Gerar QR Code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
    
    const qrPreview = document.getElementById('qrPreview');
    const qrImage = document.getElementById('qrImage');
    
    if (qrPreview && qrImage) {
        qrImage.src = qrUrl;
        qrPreview.style.display = 'block';
    }
};

window.usarAudioNoFormulario = function() {
    const linkInput = document.getElementById('linkAudioQR');
    const link = linkInput.value.trim();
    
    if (!link) {
        alert('Por favor, cole o link do áudio primeiro.');
        return;
    }
    
    // Preencher campo no formulário principal
    const linkAudioForm = document.getElementById('linkAudio');
    if (linkAudioForm) {
        linkAudioForm.value = link;
        
        // Trigger event para atualizar a decisão
        linkAudioForm.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Fechar modal
    const modal = document.querySelector('.modal-qr');
    if (modal) {
        modal.remove();
    }
    
    // Ir para aba do gerador
    if (window.sistemaSimplesMagico) {
        window.sistemaSimplesMagico.showTab('gerador');
    }
    
    // Notificação
    const toast = document.createElement('div');
    toast.textContent = '✅ Link do áudio adicionado ao formulário!';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
};

// Inicializar gravador quando a página carregar
let gravadorAudio;
document.addEventListener('DOMContentLoaded', function() {
    gravadorAudio = new GravadorAudio();
});

// Limpeza ao sair da página
window.addEventListener('beforeunload', function() {
    if (gravadorAudio) {
        gravadorAudio.destruir();
    }
});