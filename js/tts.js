/**
 * Módulo TTS (Text-to-Speech) - Sistema Simples e Mágico
 * Geração de áudio a partir do texto da decisão
 */

class TTSGenerator {
    constructor() {
        this.apiUrl = 'https://sistema-tts-api.onrender.com'; // URL do backend
        this.currentAudioBlob = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        console.log('🎵 Sistema TTS inicializado!');
    }
    
    setupEventListeners() {
        const btnGerarTexto = document.getElementById('btnGerarTextoAudio');
        const btnGerarAudio = document.getElementById('btnGerarAudioTTS');
        const btnEditarTexto = document.getElementById('btnEditarTexto');
        const btnNovoAudio = document.getElementById('btnNovoAudio');
        
        if (btnGerarTexto) btnGerarTexto.addEventListener('click', () => this.gerarTextoParaAudio());
        if (btnGerarAudio) btnGerarAudio.addEventListener('click', () => this.gerarAudio());
        if (btnEditarTexto) btnEditarTexto.addEventListener('click', () => this.editarTexto());
        if (btnNovoAudio) btnNovoAudio.addEventListener('click', () => this.novoAudio());
    }
    
    gerarTextoParaAudio() {
        try {
            // Obter dados do formulário principal
            const autor = document.getElementById('autor')?.value || '[AUTOR]';
            const reu = document.getElementById('reu')?.value || '[RÉU]';
            const decisao = document.getElementById('decisao')?.value || '';
            const resultado = document.getElementById('resultado')?.value || '';
            
            if (!decisao.trim() || !resultado.trim()) {
                this.mostrarErro('Preencha pelo menos os campos "Como decidiu" e "Resultado" na aba Gerador.');
                return;
            }
            
            // Gerar texto otimizado para áudio
            const textoAudio = this.criarTextoAudio(autor, reu, decisao, resultado);
            
            // Mostrar área de edição
            document.getElementById('textoParaAudio').value = textoAudio;
            document.getElementById('textoAudioGerado').style.display = 'block';
            document.getElementById('audioGerado').style.display = 'none';
            
            this.mostrarSucesso('Texto gerado! Revise e clique em "Gerar Áudio MP3".');
            
        } catch (error) {
            console.error('Erro ao gerar texto:', error);
            this.mostrarErro('Erro ao gerar texto para áudio.');
        }
    }
    
    criarTextoAudio(autor, reu, decisao, resultado) {
        const incluirIntro = document.getElementById('incluirIntroducao')?.checked;
        
        let texto = '';
        
        if (incluirIntro) {
            texto += `Olá! Este é um áudio explicativo sobre uma decisão judicial em linguagem simples. `;
            texto += `Escute com atenção para entender o que foi decidido e o que você precisa fazer. `;
            texto += `\n\n`;
        }
        
        texto += `Neste processo, ${autor} pediu algo contra ${reu}. `;
        texto += `\n\n`;
        
        texto += `A decisão da Justiça foi a seguinte: `;
        texto += this.otimizarTextoParaAudio(decisao);
        texto += `\n\n`;
        
        texto += `O que acontece agora: `;
        texto += this.otimizarTextoParaAudio(resultado);
        texto += `\n\n`;
        
        if (incluirIntro) {
            texto += `Se você tiver dúvidas, entre em contato com o Juizado. `;
            texto += `Todas as informações de contato estão na sua decisão. `;
            texto += `Obrigado pela atenção!`;
        }
        
        return texto;
    }
    
    otimizarTextoParaAudio(texto) {
        return texto
            .replace(/R\$/g, 'reais')
            .replace(/\bqd\b/g, 'quando')
            .replace(/\bvc\b/g, 'você')
            .replace(/\bp\//g, 'para')
            .replace(/\btbm\b/g, 'também')
            .replace(/\bpq\b/g, 'porque')
            .replace(/\bn\b/g, 'não')
            .replace(/(\d+)\.(\d+)\.(\d+)/g, '$1 ponto $2 ponto $3')
            .replace(/Art\./g, 'Artigo')
            .replace(/§/g, 'parágrafo')
            .replace(/\./g, '. ')
            .replace(/,/g, ', ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    async gerarAudio() {
        const texto = document.getElementById('textoParaAudio')?.value;
        
        if (!texto || texto.trim().length < 10) {
            this.mostrarErro('Texto muito curto ou vazio.');
            return;
        }
        
        try {
            this.mostrarStatus('🎵 Gerando áudio... Aguarde (pode demorar 1-2 minutos)');
            
            // Chamar API TTS
            const response = await fetch(`${this.apiUrl}/gerar-audio`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    texto: texto,
                    idioma: 'pt-br'
                })
            });
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }
            
            // Obter blob do áudio
            this.currentAudioBlob = await response.blob();
            
            // Criar URL para reprodução e download
            const audioUrl = URL.createObjectURL(this.currentAudioBlob);
            
            // Configurar player e download
            const audioPlayer = document.getElementById('audioPlayer');
            const linkDownload = document.getElementById('linkDownloadAudio');
            
            audioPlayer.src = audioUrl;
            linkDownload.href = audioUrl;
            
            // Mostrar área de áudio gerado
            document.getElementById('audioGerado').style.display = 'block';
            document.getElementById('textoAudioGerado').style.display = 'none';
            
            this.mostrarSucesso('🎉 Áudio gerado com sucesso! Baixe e faça upload para a nuvem.');
            
            // Incrementar estatística
            if (window.sistemaSimplesMagico) {
                window.sistemaSimplesMagico.incrementarEstatistica('audiosGravados');
            }
            
        } catch (error) {
            console.error('Erro ao gerar áudio:', error);
            this.mostrarErro('Erro ao gerar áudio. Verifique sua conexão e tente novamente.');
        } finally {
            this.mostrarStatus('');
        }
    }
    
    editarTexto() {
        document.getElementById('textoAudioGerado').style.display = 'block';
        document.getElementById('audioGerado').style.display = 'none';
    }
    
    novoAudio() {
        document.getElementById('textoAudioGerado').style.display = 'none';
        document.getElementById('audioGerado').style.display = 'none';
        document.getElementById('textoParaAudio').value = '';
        
        if (this.currentAudioBlob) {
            URL.revokeObjectURL(this.currentAudioBlob);
            this.currentAudioBlob = null;
        }
    }
    
    mostrarStatus(mensagem) {
        const statusElement = document.getElementById('statusTTS');
        if (statusElement) {
            statusElement.textContent = mensagem;
            statusElement.style.color = mensagem.includes('Erro') ? '#dc3545' : '#007bff';
        }
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
        
        setTimeout(() => toast.style.opacity = '1', 100);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, tipo === 'error' ? 6000 : 4000);
    }
}

// Inicializar TTS quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.ttsGenerator = new TTSGenerator();
        console.log('🎵 Sistema TTS carregado!');
    }, 1000);
});