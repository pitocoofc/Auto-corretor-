const carregarDicionarios = () => {
    try {
        // Verifica se a pasta existe, se não, cria
        if (!fs.existsSync(DICT_DIR)) {
            console.log("[Aviso] Pasta dicts não encontrada. Criando agora...");
            fs.mkdirSync(DICT_DIR);
        }

        const files = fs.readdirSync(DICT_DIR);
        let palavrasSet = new Set();
        
        if (files.length === 0) {
            console.log("[Aviso] A pasta dicts está vazia. Coloque arquivos .txt lá!");
        }

        files.forEach(file => {
            if (file.endsWith('.txt')) {
                const conteudo = fs.readFileSync(path.join(DICT_DIR, file), 'utf-8');
                conteudo.split(/\r?\n/).forEach(p => {
                    const formatada = p.trim().toLowerCase();
                    if (formatada) palavrasSet.add(formatada);
                });
            }
        });
        bancoDePalavras = Array.from(palavrasSet);
        console.log(`[Sistema] ${bancoDePalavras.length} palavras prontas.`);
    } catch (err) {
        console.error("Erro crítico ao ler dicts:", err);
    }
};
