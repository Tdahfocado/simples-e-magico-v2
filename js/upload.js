/**
 * Módulo Upload e OCR - Sistema Simples e Mágico
 * Processamento de arquivos PDF, DOC, DOCX, TXT com OCR
 */

class UploadProcessor {
    constructor() {
        this.supportedTypes = {
            'application/pdf': 'PDF',
            'application/msword': 'DOC',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
            'text/plain': 'TXT',
            'text/html': 'HTML',
            'application/rtf': 'RTF'
        };
        
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.processedFiles = [];
        this.currentText = '';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
    }
    
    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const btnProcessar = document.getElementById('btnProcessarIA');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFiles(e.target.files);
            });
        }
        
        if (btnProcessar) {
            btnProcessar.addEventListener('click', () => {
                this.processarComIA();
            });
        }
    }
    
    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;
        
        // Prevenir comportamento padrão
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });
        
        // Highlight na área de drop
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            }, false);
        });
        
        // Handle drop
        uploadArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            this.handleFiles(files);
        }, false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    async handleFiles(files) {
        if (!files || files.length === 0) return;
        
        this.updateStatus('📁 Processando arquivos...');
        this.showProgress(0);
        
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const progress = ((i + 1) / files.length) * 100;
                
                await this.processFile(file);
                this.showProgress(progress);
            }
            
            this.hideProgress();
            this.updateStatus('✅ Arquivos processados com sucesso!');
            
            if (this.currentText) {
                this.showExtractedText();
                this.enableProcessButton();
            }
            
        } catch (error) {
            console.error('Erro ao processar arquivos:', error);
            this.showError('Erro ao processar arquivos: ' + error.message);
            this.hideProgress();
        }
    }
    
    async processFile(file) {
        // Validar arquivo
        if (!this.validateFile(file)) {
            return;
        }
        
        this.updateStatus(`📄 Processando ${file.name}...`);
        
        const fileType = this.supportedTypes[file.type] || 'UNKNOWN';
        let extractedText = '';
        
        try {
            switch (fileType) {
                case 'PDF':
                    extractedText = await this.extractFromPDF(file);
                    break;
                case 'DOC':
                case 'DOCX':
                    extractedText = await this.extractFromWord(file);
                    break;
                case 'TXT':
                case 'HTML':
                    extractedText = await this.extractFromText(file);
                    break;
                case 'RTF':
                    extractedText = await this.extractFromRTF(file);
                    break;
                default:
                    throw new Error(`Tipo de arquivo não suportado: ${file.type}`);
            }
            
            // Limpar e normalizar texto
            extractedText = this.cleanText(extractedText);
            
            // Adicionar ao texto combinado
            if (extractedText.trim()) {
                this.currentText += (this.currentText ? '\n\n' : '') + extractedText;
                
                this.processedFiles.push({
                    name: file.name,
                    type: fileType,
                    size: file.size,
                    textLength: extractedText.length,
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            console.error(`Erro ao processar ${file.name}:`, error);
            this.showError(`Erro ao processar ${file.name}: ${error.message}`);
        }
    }
    
    validateFile(file) {
        // Verificar tipo
        if (!this.supportedTypes[file.type]) {
            this.showError(`Tipo de arquivo não suportado: ${file.name}`);
            return false;
        }
        
        // Verificar tamanho
        if (file.size > this.maxFileSize) {
            this.showError(`Arquivo muito grande: ${file.name} (máximo ${this.maxFileSize / 1024 / 1024}MB)`);
            return false;
        }
        
        return true;
    }
    
    async extractFromPDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';
            
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ');
                
                fullText += pageText + '\n\n';
            }
            
            return fullText;
            
        } catch (error) {
            throw new Error(`Erro ao extrair texto do PDF: ${error.message}`);
        }
    }
    
    async extractFromWord(file) {
        try {
            // Para arquivos DOC/DOCX, tentamos extrair como texto
            // Em uma implementação completa, usaríamos uma biblioteca como mammoth.js
            const text = await file.text();
            
            // Tentar extrair texto básico removendo caracteres de controle
            const cleanText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
                                  .replace(/\s+/g, ' ')
                                  .trim();
            
            if (cleanText.length < 50) {
                throw new Error('Documento pode estar protegido ou corrompido');
            }
            
            return cleanText;
            
        } catch (error) {
            // Fallback: tentar OCR se disponível
            console.warn('Tentando OCR como fallback...');
            return await this.extractWithOCR(file);
        }
    }
    
    async extractFromText(file) {
        try {
            const text = await file.text();
            return text;
        } catch (error) {
            throw new Error(`Erro ao ler arquivo de texto: ${error.message}`);
        }
    }
    
    async extractFromRTF(file) {
        try {
            const text = await file.text();
            
            // Remover códigos RTF básicos
            const cleanText = text
                .replace(/\{\\rtf1[^}]*\}/g, '')
                .replace(/\{[^}]*\}/g, '')
                .replace(/\\[a-z]+\d*/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            
            return cleanText;
            
        } catch (error) {
            throw new Error(`Erro ao processar RTF: ${error.message}`);
        }
    }
    
    async extractWithOCR(file) {
        try {
            this.updateStatus('🔍 Executando OCR (pode demorar)...');
            
            // Verificar se Tesseract está disponível
            if (typeof Tesseract === 'undefined') {
                throw new Error('OCR não disponível');
            }
            
            const { data: { text } } = await Tesseract.recognize(file, 'por', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        this.updateStatus(`🔍 OCR: ${progress}%`);
                    }
                }
            });
            
            return text;
            
        } catch (error) {
            throw new Error(`OCR falhou: ${error.message}`);
        }
    }
    
    cleanText(text) {
        if (!text) return '';
        
        return text
            // Remover caracteres de controle
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
            // Normalizar espaços
            .replace(/\s+/g, ' ')
            // Remover linhas vazias excessivas
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            // Trim
            .trim();
    }
    
    showExtractedText() {
        const textContainer = document.getElementById('textoExtraido');
        const textContent = document.getElementById('textoConteudo');
        
        if (textContainer && textContent) {
            textContent.textContent = this.currentText;
            textContainer.style.display = 'block';
            
            // Scroll para o texto
            textContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    enableProcessButton() {
        const btnProcessar = document.getElementById('btnProcessarIA');
        if (btnProcessar) {
            btnProcessar.disabled = false;
        }
    }
    
    processarComIA() {
        if (!this.currentText) {
            this.showError('Nenhum texto extraído para processar');
            return;
        }
        
        // Criar prompt para IA
        const prompt = this.createAIPrompt(this.currentText);
        
        // Copiar para clipboard
        this.copyToClipboard(prompt);
        
        // Mostrar instruções
        this.showAIInstructions();
        
        // Incrementar estatística
        if (window.sistemaSimplesMagico) {
            window.sistemaSimplesMagico.incrementarEstatistica('uploadsProcessados');
        }
    }
    
    createAIPrompt(texto) {
        return `Analise esta sentença judicial e extraia as seguintes informações em linguagem simples e clara:

**INSTRUÇÕES:**
1. Use linguagem simples que qualquer pessoa possa entender
2. Evite jargões jurídicos complexos
3. Seja objetivo e direto
4. Se alguma informação não estiver clara, indique [NÃO IDENTIFICADO]

**CAMPOS A EXTRAIR:**

**Número do processo:** 
[Extrair o número completo do processo]

**Autor (quem pediu):** 
[Nome da pessoa ou empresa que fez o pedido]

**Réu (contra quem):** 
[Nome da pessoa ou empresa processada]

**O que foi pedido na Justiça:** 
[Explicar de forma simples o que o autor pediu, como se estivesse explicando para uma criança]

**Como a Justiça decidiu:** 
[Explicar de forma clara qual foi a decisão do juiz - se deu razão ao autor ou ao réu]

**Por que a Justiça decidiu assim:** 
[Explicar o motivo da decisão de forma que qualquer pessoa entenda]

**O que acontece agora (resultado):** 
[Explicar o que vai acontecer a partir de agora - quem deve fazer o quê, prazos, etc.]

---

**TEXTO DA SENTENÇA:**

${texto}

---

**RESPOSTA SOLICITADA:**
Por favor, forneça apenas as informações extraídas nos campos acima, de forma organizada e em linguagem simples.`;
    }
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccess('📋 Prompt copiado! Cole no ChatGPT ou Claude.');
        } catch (error) {
            // Fallback para navegadores mais antigos
            this.fallbackCopyToClipboard(text);
        }
    }
    
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showSuccess('📋 Prompt copiado! Cole no ChatGPT ou Claude.');
        } catch (error) {
            this.showError('Erro ao copiar. Copie manualmente o texto acima.');
        }
        
        document.body.removeChild(textArea);
    }
    
    showAIInstructions() {
        const modal = document.createElement('div');
        modal.className = 'ai-instructions-modal';
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
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h3 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">
                    🤖 Como usar a IA para processar sua sentença
                </h3>
                
                <div style="background: #e8f4f8; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="color: #17a2b8; margin-bottom: 10px;">✅ Prompt já copiado!</h4>
                    <p>O texto com as instruções para a IA já foi copiado para sua área de transferência.</p>
                </div>
                
                <div style="line-height: 1.8; margin-bottom: 25px;">
                    <h4 style="color: #28a745; margin-bottom: 15px;">📝 Passo a passo:</h4>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h5 style="color: #dc3545;">1. 🌐 Abra uma IA:</h5>
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <a href="https://chat.openai.com" target="_blank" 
                               style="background: #28a745; color: white; padding: 8px 15px; border-radius: 5px; text-decoration: none; font-size: 12px;">
                                ChatGPT
                            </a>
                            <a href="https://claude.ai" target="_blank" 
                               style="background: #007bff; color: white; padding: 8px 15px; border-radius: 5px; text-decoration: none; font-size: 12px;">
                                Claude AI
                            </a>
                            <a href="https://gemini.google.com" target="_blank" 
                               style="background: #ff9800; color: white; padding: 8px 15px; border-radius: 5px; text-decoration: none; font-size: 12px;">
                                Gemini
                            </a>
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h5 style="color: #dc3545;">2. 📋 Cole o prompt:</h5>
                        <p>Use <strong>Ctrl+V</strong> (Windows) ou <strong>Cmd+V</strong> (Mac) para colar o texto na IA</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h5 style="color: #dc3545;">3. ⚡ Envie e aguarde:</h5>
                        <p>A IA processará sua sentença e extrairá as informações em linguagem simples</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <h5 style="color: #dc3545;">4. 📝 Copie os resultados:</h5>
                        <p>Copie cada campo da resposta da IA e cole nos campos do formulário</p>
                    </div>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h5 style="color: #856404; margin-bottom: 10px;">💡 Dicas importantes:</h5>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Revise sempre as informações extraídas pela IA</li>
                        <li>Corrija ou adapte conforme necessário</li>
                        <li>A IA pode não identificar todas as informações</li>
                        <li>Use seu conhecimento jurídico para validar</li>
                    </ul>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="this.closest('.ai-instructions-modal').remove()" 
                            style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        ✅ Entendi, vou processar!
                    </button>
                    <button onclick="copyPromptAgain()" 
                            style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        📋 Copiar Prompt Novamente
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Função para copiar prompt novamente
        window.copyPromptAgain = () => {
            const prompt = this.createAIPrompt(this.currentText);
            this.copyToClipboard(prompt);
        };
    }
    
    updateStatus(message) {
        const statusElement = document.getElementById('uploadStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
    
    showProgress(percentage) {
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        
        if (progressBar && progressFill) {
            progressBar.style.display = 'block';
            progressFill.style.width = percentage + '%';
        }
    }
    
    hideProgress() {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            max-width: 400px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Mostrar
        setTimeout(() => notification.style.opacity = '1', 100);
        
        // Remover
        const duration = type === 'error' ? 7000 : 4000;
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    // Método para limpar dados
    clearData() {
        this.currentText = '';
        this.processedFiles = [];
        
        const textContainer = document.getElementById('textoExtraido');
        if (textContainer) {
            textContainer.style.display = 'none';
        }
        
        const btnProcessar = document.getElementById('btnProcessarIA');
        if (btnProcessar) {
            btnProcessar.disabled = true;
        }
        
        this.updateStatus('');
        this.hideProgress();
    }
    
    // Método para obter estatísticas
    getStats() {
        return {
            totalFiles: this.processedFiles.length,
            totalCharacters: this.currentText.length,
            fileTypes: this.processedFiles.reduce((acc, file) => {
                acc[file.type] = (acc[file.type] || 0) + 1;
                return acc;
            }, {})
        };
    }
}

// Funções auxiliares globais
window.copiarTextoIA = function() {
    const uploadProcessor = window.uploadProcessor;
    if (uploadProcessor && uploadProcessor.currentText) {
        const prompt = uploadProcessor.createAIPrompt(uploadProcessor.currentText);
        uploadProcessor.copyToClipboard(prompt);
    }
};

window.preencherCamposAutomatico = function() {
    // Função para preenchimento automático futuro
    // Por enquanto, mostra instruções
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 500px;
        text-align: center;
    `;
    
    notification.innerHTML = `
        <h3 style="color: #2c3e50; margin-bottom: 15px;">🚀 Preenchimento Automático</h3>
        <p style="margin-bottom: 20px; line-height: 1.6;">
            Esta funcionalidade estará disponível em breve com integração direta de IA!
        </p>
        <p style="margin-bottom: 20px; color: #666;">
            Por enquanto, use a opção "Copiar para IA" para processar com ChatGPT ou Claude.
        </p>
        <button onclick="this.parentElement.remove()" 
                style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
            Entendi
        </button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 5000);
};

// Adicionar estilos para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideIn {
        from { 
            transform: translateX(100%); 
            opacity: 0; 
        }
        to { 
            transform: translateX(0); 
            opacity: 1; 
        }
    }
`;
document.head.appendChild(style);

// Inicializar processador de upload
let uploadProcessor;
document.addEventListener('DOMContentLoaded', function() {
    uploadProcessor = new UploadProcessor();
    window.uploadProcessor = uploadProcessor;
});