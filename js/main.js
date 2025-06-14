/**
 * Sistema Simples e Mágico - JavaScript Principal
 * Desenvolvido para o Juizado Especial da Comarca de Tauá - CE
 * Autor: Juiz de Direito Titular Sérgio Augusto Furtado Neto Viana
 */

class SimplesEMagico {
    constructor() {
        // Configurações iniciais
        this.config = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            supportedFormats: ['.pdf', '.doc', '.docx', '.txt'],
            audioFormats: ['audio/wav', 'audio/mp3', 'audio/webm'],
            qrCodeApi: 'https://api.qrserver.com/v1/create-qr-code/',
            autoSaveInterval: 30000 // 30 segundos
        };
        
        // Estado da aplicação
        this.state = {
            currentTab: 'gerador',
            isDirty: false,
            lastSave: null,
            audioRecording: false,
            processingFile: false
        };
        
        // Contadores e estatísticas
        this.stats = {
            decisoesCriadas: parseInt(localStorage.getItem('stats_decisoes') || '0'),
            uploadsProcessados: parseInt(localStorage.getItem('stats_uploads') || '0'),
            audiosGravados: parseInt(localStorage.getItem('stats_audios') || '0'),
            templatesUsados: parseInt(localStorage.getItem('stats_templates') || '0')
        };
        
        // ODS selecionados
        this.odsObrigatorios = ['ods_16', 'linguagem_simples', 'logo_tjce', 'acessibilidade_universal'];
        this.odsSelecionados = [];
        
        // Templates de decisão
        this.templates = {
            cobranca: {
                titulo: 'Cobrança/Dívida',
                pedido: 'O autor pediu para o réu pagar uma dívida de R$ [VALOR], referente a [DESCRIÇÃO DO DÉBITO - empréstimo, compra, serviço, etc.].',
                decisao: 'O juiz decidiu que o réu deve pagar o valor pedido pelo autor, porque ficou provado que a dívida existe e não foi paga.',
                motivo: 'A decisão foi baseada nos documentos apresentados (contratos, notas fiscais, comprovantes) que provam a existência da dívida e sua não quitação.',
                resultado: 'O réu tem 15 dias para pagar o valor de R$ [VALOR]. Se não pagar, o autor pode pedir à Justiça para penhorar bens do réu para quitar a dívida.'
            },
            consumidor: {
                titulo: 'Relação de Consumo',
                pedido: 'O consumidor pediu a troca/conserto do produto defeituoso e indenização por danos morais no valor de R$ [VALOR].',
                decisao: 'O juiz decidiu que a empresa deve trocar o produto defeituoso e pagar indenização ao consumidor.',
                motivo: 'O produto apresentou defeito dentro do prazo de garantia e a empresa não cumpriu sua obrigação de resolver o problema, violando o Código de Defesa do Consumidor.',
                resultado: 'A empresa tem 30 dias para trocar o produto e pagar R$ [VALOR] de indenização. Se não cumprir, poderá ter bens penhorados.'
            },
            locacao: {
                titulo: 'Locação/Despejo',
                pedido: 'O proprietário pediu o despejo do inquilino do imóvel e o pagamento dos aluguéis em atraso no valor de R$ [VALOR].',
                decisao: 'O juiz decidiu que o inquilino deve sair do imóvel e pagar os aluguéis atrasados.',
                motivo: 'Foi provado que o inquilino não pagou os aluguéis conforme acordado no contrato de locação.',
                resultado: 'O inquilino tem 30 dias para desocupar o imóvel e pagar R$ [VALOR] de aluguéis em atraso. Se não cumprir, será removido pela força policial.'
            },
            transito: {
                titulo: 'Acidente de Trânsito',
                pedido: 'A vítima pediu indenização por danos materiais e morais causados em acidente de trânsito no valor total de R$ [VALOR].',
                decisao: 'O juiz decidiu que o causador do acidente deve pagar indenização à vítima pelos danos causados.',
                motivo: 'Foi provado que o réu causou o acidente por imprudência/negligência/imperícia e que a vítima teve prejuízos comprovados.',
                resultado: 'O causador deve pagar R$ [VALOR] à vítima em 15 dias. Este valor será usado para consertar o veículo e compensar os transtornos causados.'
            },
            servicos: {
                titulo: 'Prestação de Serviços',
                pedido: 'O prestador de serviços pediu o pagamento pelos serviços executados no valor de R$ [VALOR].',
                decisao: 'O juiz decidiu que o contratante deve pagar pelos serviços prestados.',
                motivo: 'Foi provado que os serviços foram executados conforme combinado e não foram pagos pelo contratante.',
                resultado: 'O contratante deve pagar R$ [VALOR] ao prestador em 15 dias, referente aos serviços executados.'
            }
        };
        
        // Lista completa dos ODS
        this.listaODS = [
            {id: 'ods_1', nome: 'ODS 1\nErradicação da Pobreza'},
            {id: 'ods_2', nome: 'ODS 2\nFome Zero'},
            {id: 'ods_3', nome: 'ODS 3\nSaúde e Bem-estar'},
            {id: 'ods_4', nome: 'ODS 4\nEducação de Qualidade'},
            {id: 'ods_5', nome: 'ODS 5\nIgualdade de Gênero'},
            {id: 'ods_6', nome: 'ODS 6\nÁgua Potável'},
            {id: 'ods_7', nome: 'ODS 7\nEnergia Limpa'},
            {id: 'ods_8', nome: 'ODS 8\nTrabalho Decente'},
            {id: 'ods_9', nome: 'ODS 9\nIndústria e Inovação'},
            {id: 'ods_10', nome: 'ODS 10\nRedução Desigualdades'},
            {id: 'ods_11', nome: 'ODS 11\nCidades Sustentáveis'},
            {id: 'ods_12', nome: 'ODS 12\nConsumo Responsável'},
            {id: 'ods_13', nome: 'ODS 13\nAção Contra Mudança Climática'},
            {id: 'ods_14', nome: 'ODS 14\nVida na Água'},
            {id: 'ods_15', nome: 'ODS 15\nVida Terrestre'},
            {id: 'ods_16', nome: 'ODS 16\nPaz, Justiça e Instituições'},
            {id: 'ods_17', nome: 'ODS 17\nParcerias e Objetivos'},
            {id: 'ods_18', nome: 'ODS 18\nInovação Tecnológica'}
        ];
        
        // Inicializar sistema
        this.init();
    }
    
    /**
     * Inicialização do sistema
     */
    init() {
        console.log('🎯 Inicializando Sistema Simples e Mágico...');
        
        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    /**
     * Configuração inicial dos componentes
     */
    setup() {
        try {
            // Configurar eventos
            this.setupEventListeners();
            
            // Carregar ODS
            this.carregarODS();
            
            // Restaurar estado salvo
            this.restaurarEstado();
            
            // Atualizar estatísticas
            this.atualizarEstatisticas();
            
            // Configurar auto-save
            this.setupAutoSave();
            
            // Gerar decisão inicial
            this.gerarDecisao();
            
            console.log('✨ Sistema Simples e Mágico pronto!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.mostrarErro('Erro ao inicializar sistema. Recarregue a página.');
        }
    }
    
    /**
     * Configurar todos os event listeners
     */
    setupEventListeners() {
        // Navegação entre abas
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.showTab(e.target.dataset.tab);
            });
        });
        
        // Botões principais
        const btnGerar = document.getElementById('btnGerarDecisao');
        if (btnGerar) btnGerar.addEventListener('click', () => this.gerarDecisao());
        
        const btnPDF = document.getElementById('btnBaixarPDF');
        if (btnPDF) btnPDF.addEventListener('click', () => this.baixarPDF());
        
        const btnHTML = document.getElementById('btnBaixarHTML');
        if (btnHTML) btnHTML.addEventListener('click', () => this.baixarHTML());
        
        // Auto-atualização nos campos do formulário
        const formInputs = document.querySelectorAll('#decisionForm input, #decisionForm textarea, #decisionForm select');
        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.state.isDirty = true;
                this.gerarDecisaoDebounced();
            });
            
            input.addEventListener('change', () => {
                this.state.isDirty = true;
                this.gerarDecisao();
            });
        });
        
        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.salvarRascunho();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.baixarPDF();
                        break;
                    case 'g':
                        e.preventDefault();
                        this.gerarDecisao();
                        break;
                }
            }
        });
        
        // Evento antes de sair da página
        window.addEventListener('beforeunload', (e) => {
            if (this.state.isDirty) {
                e.preventDefault();
                e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
            }
        });
    }
    
    /**
     * Carregar e renderizar ODS
     */
    carregarODS() {
        const odsGrid = document.getElementById('odsGrid');
        if (!odsGrid) return;
        
        odsGrid.innerHTML = '';
        
        this.listaODS.forEach(ods => {
            // Não mostrar ODS obrigatórios no grid de seleção
            if (!this.odsObrigatorios.includes(ods.id)) {
                const odsElement = this.criarElementoODS(ods);
                odsGrid.appendChild(odsElement);
            }
        });
    }
    
    /**
     * Criar elemento visual do ODS
     */
    criarElementoODS(ods) {
        const div = document.createElement('div');
        div.className = 'ods-item';
        div.dataset.ods = ods.id;
        div.setAttribute('tabindex', '0');
        div.setAttribute('role', 'button');
        div.setAttribute('aria-label', `Selecionar ${ods.nome.replace('\n', ' ')}`);
        
        div.innerHTML = `
            <img src="imgs/${ods.id}.png" 
                 alt="${ods.id}" 
                 onerror="this.style.display='none'">
            <label>${ods.nome}</label>
        `;
        
        // Eventos de clique e teclado
        div.addEventListener('click', () => this.toggleODS(ods.id));
        div.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleODS(ods.id);
            }
        });
        
        return div;
    }
    
    /**
     * Alternar seleção de ODS
     */
    toggleODS(odsId) {
        const index = this.odsSelecionados.indexOf(odsId);
        const element = document.querySelector(`[data-ods="${odsId}"]`);
        
        if (index > -1) {
            // Remover seleção
            this.odsSelecionados.splice(index, 1);
            element.classList.remove('selected');
            this.mostrarNotificacao(`ODS removido: ${odsId.replace('_', ' ').toUpperCase()}`);
        } else {
            // Adicionar seleção
            this.odsSelecionados.push(odsId);
            element.classList.add('selected', 'new-selection');
            this.mostrarNotificacao(`ODS adicionado: ${odsId.replace('_', ' ').toUpperCase()}`);
            
            // Remover classe de animação após a animação
            setTimeout(() => {
                element.classList.remove('new-selection');
            }, 600);
        }
        
        this.state.isDirty = true;
        this.gerarDecisao();
    }
    
    /**
     * Alternar entre abas
     */
    showTab(tabName) {
        // Remover classe active de todas as abas
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Ativar aba selecionada
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(tabName);
        
        if (tabButton && tabContent) {
            tabButton.classList.add('active');
            tabContent.classList.add('active');
            this.state.currentTab = tabName;
            
            // Ações específicas por aba
            switch(tabName) {
                case 'estatisticas':
                    this.atualizarEstatisticas();
                    break;
                case 'gravador':
                    this.verificarPermissaoMicrofone();
                    break;
            }
        }
    }
    
    /**
     * Gerar decisão completa
     */
    gerarDecisao() {
        try {
            const dados = this.obterDadosFormulario();
            const html = this.construirHTMLDecisao(dados);
            
            // Atualizar preview
            const preview = document.getElementById('previewDecisao');
            if (preview) {
                preview.innerHTML = html;
                preview.classList.add('fade-in');
            }
            
            // Verificar se está completo
            if (this.validarDadosMinimos(dados)) {
                this.mostrarSucesso('✨ Decisão gerada com sucesso!');
                this.incrementarEstatistica('decisoesCriadas');
            }
            
        } catch (error) {
            console.error('Erro ao gerar decisão:', error);
            this.mostrarErro('Erro ao gerar decisão. Verifique os dados.');
        }
    }
    
    /**
     * Versão debounced da geração de decisão
     */
    gerarDecisaoDebounced = this.debounce(() => this.gerarDecisao(), 500);
    
    /**
     * Obter dados do formulário
     */
    obterDadosFormulario() {
        return {
            numeroProcesso: document.getElementById('numeroProcesso')?.value || '',
            autor: document.getElementById('autor')?.value || '',
            reu: document.getElementById('reu')?.value || '',
            pedido: document.getElementById('pedido')?.value || '',
            decisao: document.getElementById('decisao')?.value || '',
            motivo: document.getElementById('motivo')?.value || '',
            resultado: document.getElementById('resultado')?.value || '',
            linkConsulta: document.getElementById('linkConsulta')?.value || '',
            linkAudio: document.getElementById('linkAudio')?.value || '',
            dataAtual: new Date().toLocaleDateString('pt-BR')
        };
    }
    
    /**
     * Construir HTML da decisão
     */
    construirHTMLDecisao(dados) {
        const qrCodes = this.gerarQRCodes(dados);
        const odsSection = this.gerarSecaoODS();
        const contatoSection = this.gerarSecaoContato();
        const desenvolvedor = this.gerarSecaoDesenvolvedor();
        
        return `
            <div class="header">
                <h1>✨ SUA SITUAÇÃO NA JUSTIÇA</h1>
                <p>Sistema Simples e Mágico - Juizado Especial de Tauá - CE</p>
                <p style="font-size: 0.9em; opacity: 0.8;">Gerado em: ${dados.dataAtual}</p>
            </div>
            
            <div class="info-box">
                <h3><span class="section-icon">📋</span>DADOS DO SEU PROCESSO</h3>
                <p><strong>Número:</strong> ${dados.numeroProcesso || '[NÚMERO DO PROCESSO]'}</p>
                <p><strong>Quem pediu:</strong> ${dados.autor || '[NOME DO AUTOR]'}</p>
                <p><strong>Contra quem:</strong> ${dados.reu || '[NOME DO RÉU]'}</p>
            </div>
            
            <div class="info-box">
                <h3><span class="section-icon">❓</span>O QUE FOI PEDIDO NA JUSTIÇA</h3>
                <p>${dados.pedido || '[DESCREVER O PEDIDO DE FORMA SIMPLES]'}</p>
            </div>
            
            <div class="result-box">
                <h3><span class="section-icon">⚖️</span>COMO A JUSTIÇA DECIDIU</h3>
                <p>${dados.decisao || '[EXPLICAR A DECISÃO DE FORMA CLARA]'}</p>
            </div>
            
            <div class="info-box">
                <h3><span class="section-icon">🤔</span>POR QUE A JUSTIÇA DECIDIU ASSIM</h3>
                <p>${dados.motivo || '[EXPLICAR O MOTIVO DA DECISÃO]'}</p>
            </div>
            
            <div class="result-box">
                <h3><span class="section-icon">📋</span>O QUE ACONTECE AGORA</h3>
                <p>${dados.resultado || '[EXPLICAR O QUE ACONTECE A PARTIR DE AGORA]'}</p>
            </div>
            
            ${qrCodes}
            ${odsSection}
            ${contatoSection}
            ${desenvolvedor}
        `;
    }
    
    /**
     * Gerar seção de QR Codes
     */
    gerarQRCodes(dados) {
        if (!dados.linkConsulta && !dados.linkAudio) return '';
        
        let qrItems = '';
        
        if (dados.linkConsulta) {
            const qrConsulta = `${this.config.qrCodeApi}?size=120x120&data=${encodeURIComponent(dados.linkConsulta)}`;
            qrItems += `
                <div class="qr-item">
                    <img src="${qrConsulta}" alt="QR Code Consulta" loading="lazy">
                    <h5>🔍 Consultar Processo</h5>
                    <p>Escaneie para acompanhar seu processo online</p>
                </div>
            `;
        }
        
        if (dados.linkAudio) {
            const qrAudio = `${this.config.qrCodeApi}?size=120x120&data=${encodeURIComponent(dados.linkAudio)}`;
            qrItems += `
                <div class="qr-item">
                    <img src="${qrAudio}" alt="QR Code Áudio" loading="lazy">
                    <h5>🎧 Ouvir Explicação</h5>
                    <p>Escaneie para ouvir o áudio explicativo</p>
                </div>
            `;
        }
        
        return `
            <div class="qr-section">
                <h3>📱 ACESSO RÁPIDO</h3>
                <p>Use a câmera do seu celular para escanear os códigos:</p>
                <div class="qr-grid">
                    ${qrItems}
                </div>
            </div>
        `;
    }
    
    /**
     * Gerar seção dos ODS
     */
    gerarSecaoODS() {
        const todosODS = [...this.odsObrigatorios, ...this.odsSelecionados];
        const iconsHTML = todosODS.map(ods => 
            `<img src="imgs/${ods}.png" alt="${ods}" title="${this.obterNomeODS(ods)}" loading="lazy">`
        ).join('');
        
        return `
            <div class="ods-decisao">
                <h3>🌍 ESTA DECISÃO CONTRIBUI PARA:</h3>
                <div class="ods-icons">
                    ${iconsHTML}
                </div>
                <p style="margin-top: 15px; font-size: 14px; color: #666;">
                    Esta decisão está alinhada com os <strong>Objetivos de Desenvolvimento Sustentável da ONU</strong> 
                    e utiliza <strong>linguagem simples</strong> para garantir acessibilidade universal e transparência judicial.
                </p>
            </div>
        `;
    }
    
    /**
     * Gerar seção de contato
     */
    gerarSecaoContato() {
        return `
            <div class="contato-section">
                <h3 style="color: #17a2b8; margin-bottom: 15px;">
                    <span class="section-icon">📞</span>CONTATOS PARA DÚVIDAS
                </h3>
                <div style="line-height: 1.8;">
                    <p><strong>JUIZADO ESPECIAL DA COMARCA DE TAUÁ</strong></p>
                    <p>📞 <strong>Telefone Fixo:</strong> (85) 3108-2529</p>
                    <p>📱 <strong>WhatsApp:</strong> (85) 98198-8631 (apenas mensagens)</p>
                    <p>📧 <strong>E-mail:</strong> taua.jecc@tjce.jus.br</p>
                    <p>📍 <strong>Endereço:</strong> Avenida Abgail Cidrão de Oliveira, S/N - Colibri</p>
                    <p>🕒 <strong>Atendimento:</strong> Segunda a Sexta, 8h às 14h</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Gerar seção do desenvolvedor
     */
    gerarSecaoDesenvolvedor() {
        return `
            <div class="desenvolvedor-section">
                <p><strong>✨ Sistema "Simples e Mágico" desenvolvido pelo Juiz de Direito Titular do Juizado Especial da Comarca de Tauá</strong></p>
                <p>Versão 2.0 - ${new Date().getFullYear()} | Em conformidade com a Recomendação 144/2023 do CNJ sobre Linguagem Simples</p>
                <p style="margin-top: 10px; font-style: italic;">
                    "A justiça só é verdadeiramente acessível quando é compreensível por todos"
                </p>
            </div>
        `;
    }
    
    /**
     * Carregar template pré-definido
     */
    carregarTemplate(tipo) {
        const template = this.templates[tipo];
        if (!template) {
            this.mostrarErro(`Template ${tipo} não encontrado`);
            return;
        }
        
        // Preencher campos
        document.getElementById('pedido').value = template.pedido;
        document.getElementById('decisao').value = template.decisao;
        document.getElementById('motivo').value = template.motivo;
        document.getElementById('resultado').value = template.resultado;
        
        // Voltar para aba do gerador
        this.showTab('gerador');
        
        // Gerar decisão
        this.gerarDecisao();
        
        // Feedback
        this.mostrarSucesso(`✨ Template "${template.titulo}" carregado com sucesso!`);
        this.incrementarEstatistica('templatesUsados');
        
        // Marcar como alterado
        this.state.isDirty = true;
    }
    
    /**
     * Baixar como PDF
     */
    baixarPDF() {
        try {
            // Preparar para impressão
            document.body.classList.add('printing');
            
            // Usar API de impressão do navegador
            window.print();
            
            // Remover classe após impressão
            setTimeout(() => {
                document.body.classList.remove('printing');
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            this.mostrarErro('Erro ao gerar PDF. Use Ctrl+P para imprimir.');
        }
    }
    
    /**
     * Baixar como HTML
     */
    baixarHTML() {
        try {
            const dados = this.obterDadosFormulario();
            const conteudo = this.construirHTMLDecisao(dados);
            const nomeArquivo = `decisao-${dados.numeroProcesso.replace(/[^0-9]/g, '') || 'sem-numero'}-${Date.now()}.html`;
            
            const htmlCompleto = this.criarHTMLCompleto(conteudo);
            
            // Criar e baixar arquivo
            const blob = new Blob([htmlCompleto], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = nomeArquivo;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            this.mostrarSucesso(`📄 Arquivo ${nomeArquivo} baixado com sucesso!`);
            
        } catch (error) {
            console.error('Erro ao baixar HTML:', error);
            this.mostrarErro('Erro ao baixar arquivo HTML.');
        }
    }
    
    /**
     * Criar HTML completo para download
     */
    criarHTMLCompleto(conteudo) {
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Decisão em Linguagem Simples - Juizado Especial de Tauá</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            background-color: #f8f9fa;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
        }
        .info-box, .result-box, .ods-decisao, .contato-section {
            background: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }
        .result-box {
            background: #e8f5e8;
            border-left: 5px solid #28a745;
        }
        .info-box {
            border-left: 5px solid #667eea;
        }
        .ods-decisao {
            border-left: 5px solid #1976d2;
        }
        .contato-section {
            border-left: 5px solid #17a2b8;
            background: #e8f4f8;
        }
        .qr-section {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            margin: 20px 0;
            border: 2px dashed #2196f3;
        }
        .qr-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .qr-item {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .ods-icons {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
        }
        .ods-icons img {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .section-icon {
            font-size: 1.5em;
            margin-right: 10px;
        }
        .desenvolvedor-section {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        strong {
            color: #2c3e50;
        }
        h1, h3 {
            color: inherit;
        }
        @media print {
            body { background: white; padding: 0; }
            .qr-section, .ods-decisao { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    ${conteudo}
</body>
</html>`;
    }
    
    // Continua na próxima parte...
    
    /**
     * Utilitários e funções auxiliares
     */
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    validarDadosMinimos(dados) {
        return dados.numeroProcesso.trim() && 
               dados.autor.trim() && 
               dados.reu.trim() && 
               dados.pedido.trim();
    }
    
    obterNomeODS(odsId) {
        const ods = this.listaODS.find(item => item.id === odsId);
        return ods ? ods.nome.replace('\n', ' - ') : odsId;
    }
    
    incrementarEstatistica(tipo) {
        if (this.stats.hasOwnProperty(tipo)) {
            this.stats[tipo]++;
            localStorage.setItem(`stats_${tipo}`, this.stats[tipo].toString());
            this.atualizarEstatisticas();
        }
    }
    
    atualizarEstatisticas() {
        const elementos = {
            'totalDecisoes': this.stats.decisoesCriadas,
            'totalUploads': this.stats.uploadsProcessados,
            'totalGravacoes': this.stats.audiosGravados
        };
        
        Object.entries(elementos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = valor;
            }
        });
    }
    
    salvarRascunho() {
        const dados = this.obterDadosFormulario();
        const rascunho = {
            dados,
            odsSelecionados: this.odsSelecionados,
            timestamp: Date.now()
        };
        
        localStorage.setItem('rascunho_decisao', JSON.stringify(rascunho));
        this.state.isDirty = false;
        this.state.lastSave = Date.now();
        
        this.mostrarNotificacao('💾 Rascunho salvo automaticamente');
    }
    
    restaurarEstado() {
        try {
            const rascunho = localStorage.getItem('rascunho_decisao');
            if (rascunho) {
                const dados = JSON.parse(rascunho);
                
                // Restaurar campos do formulário
                Object.entries(dados.dados).forEach(([campo, valor]) => {
                    const elemento = document.getElementById(campo);
                    if (elemento && valor) {
                        elemento.value = valor;
                    }
                });
                
                // Restaurar ODS selecionados
                if (dados.odsSelecionados) {
                    this.odsSelecionados = dados.odsSelecionados;
                    dados.odsSelecionados.forEach(odsId => {
                        const elemento = document.querySelector(`[data-ods="${odsId}"]`);
                        if (elemento) {
                            elemento.classList.add('selected');
                        }
                    });
                }
                
                this.mostrarNotificacao('📋 Rascunho restaurado');
            }
        } catch (error) {
            console.warn('Erro ao restaurar estado:', error);
        }
    }
    
    setupAutoSave() {
        setInterval(() => {
            if (this.state.isDirty) {
                this.salvarRascunho();
            }
        }, this.config.autoSaveInterval);
    }
    
    verificarPermissaoMicrofone() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    stream.getTracks().forEach(track => track.stop());
                })
                .catch(error => {
                    this.mostrarNotificacao('🎤 Permita o acesso ao microfone para gravar áudio');
                });
        } else {
            this.mostrarErro('Navegador não suporta gravação de áudio');
        }
    }
    
    mostrarSucesso(mensagem) {
        this.mostrarMensagem(mensagem, 'success');
    }
    
    mostrarErro(mensagem) {
        this.mostrarMensagem(mensagem, 'error');
    }
    
    mostrarNotificacao(mensagem) {
        // Criar notificação toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = mensagem;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            max-width: 300px;
            font-size: 14px;
        `;
        
        document.body.appendChild(toast);
        
        // Mostrar com animação
        setTimeout(() => toast.style.opacity = '1', 100);
        
        // Remover após 3 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
    
    mostrarMensagem(mensagem, tipo) {
        const successEl = document.getElementById('successMessage');
        const errorEl = document.getElementById('errorMessage');
        
        if (tipo === 'success' && successEl) {
            successEl.textContent = mensagem;
            successEl.style.display = 'block';
            if (errorEl) errorEl.style.display = 'none';
            
            setTimeout(() => successEl.style.display = 'none', 5000);
        } else if (tipo === 'error' && errorEl) {
            errorEl.textContent = mensagem;
            errorEl.style.display = 'block';
            if (successEl) successEl.style.display = 'none';
            
            setTimeout(() => errorEl.style.display = 'none', 7000);
        }
    }
}

// Inicializar sistema quando a página carregar
const sistemaSimplesMagico = new SimplesEMagico();
