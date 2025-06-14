from flask import Flask, request, jsonify, send_file
from gtts import gTTS
import io
import os
from flask_cors import CORS
import tempfile
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Permitir requisições do GitHub Pages

@app.route('/')
def home():
    return jsonify({
        "status": "Sistema TTS Online",
        "versao": "1.0",
        "sistema": "Simples e Mágico - Juizado Especial de Tauá",
        "endpoints": ["/gerar-audio", "/status"],
        "timestamp": str(datetime.now())
    })

@app.route('/gerar-audio', methods=['POST'])
def gerar_audio():
    try:
        data = request.get_json()
        texto = data.get('texto', '')
        idioma = data.get('idioma', 'pt-br')
        
        if not texto:
            return jsonify({"erro": "Texto não fornecido"}), 400
        
        if len(texto) > 5000:
            return jsonify({"erro": "Texto muito longo (máximo 5000 caracteres)"}), 400
        
        # Validar idioma
        idiomas_validos = ['pt', 'pt-br', 'en', 'es']
        if idioma not in idiomas_validos:
            idioma = 'pt'
        
        # Gerar áudio com gTTS
        tts = gTTS(
            text=texto, 
            lang='pt' if idioma in ['pt', 'pt-br'] else idioma, 
            slow=False
        )
        
        # Criar arquivo temporário
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        tts.save(temp_file.name)
        
        # Retornar arquivo
        return send_file(
            temp_file.name,
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name=f'decisao-audio-{uuid.uuid4().hex[:8]}.mp3'
        )
    
    except Exception as e:
        print(f"Erro ao gerar áudio: {str(e)}")
        return jsonify({"erro": f"Erro interno: {str(e)}"}), 500

@app.route('/status')
def status():
    return jsonify({
        "status": "OK", 
        "timestamp": str(datetime.now()),
        "sistema": "TTS Backend - Simples e Mágico",
        "memoria_livre": "OK"
    })

@app.route('/health')
def health():
    """Endpoint para verificação de saúde do serviço"""
    try:
        # Teste rápido do gTTS
        test_tts = gTTS(text="Teste", lang='pt', slow=False)
        return jsonify({
            "status": "healthy",
            "tts_service": "OK",
            "timestamp": str(datetime.now())
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "erro": str(e),
            "timestamp": str(datetime.now())
        }), 500

# Limpeza de arquivos temporários (executar periodicamente)
@app.route('/cleanup')
def cleanup():
    """Limpar arquivos temporários antigos"""
    try:
        temp_dir = tempfile.gettempdir()
        arquivos_removidos = 0
        
        for filename in os.listdir(temp_dir):
            if filename.endswith('.mp3') and filename.startswith('tmp'):
                file_path = os.path.join(temp_dir, filename)
                try:
                    # Remover arquivos mais antigos que 1 hora
                    if os.path.getctime(file_path) < (datetime.now().timestamp() - 3600):
                        os.remove(file_path)
                        arquivos_removidos += 1
                except:
                    pass
        
        return jsonify({
            "status": "cleanup_complete",
            "arquivos_removidos": arquivos_removidos,
            "timestamp": str(datetime.now())
        })
    
    except Exception as e:
        return jsonify({
            "erro": str(e),
            "timestamp": str(datetime.now())
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)