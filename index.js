const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); 

const DICT_DIR = path.join(__dirname, 'dicts');
let bancoDePalavras = [];

// Função de Levenshtein: Calcula o custo de transformar S1 em S2
function calcularDistancia(s1, s2) {
    const m = s1.length;
    const n = s2.length;
    let v0 = new Array(n + 1);
    let v1 = new Array(n + 1);

    for (let i = 0; i <= n; i++) v0[i] = i;

    for (let i = 0; i < m; i++) {
        v1[0] = i + 1;
        for (let j = 0; j < n; j++) {
            const custo = (s1[i] === s2[j]) ? 0 : 1;
            v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + custo);
        }
        for (let j = 0; j <= n; j++) v0[j] = v1[j];
    }
    return v0[n];
}

const carregarDicionarios = () => {
    try {
        const files = fs.readdirSync(DICT_DIR);
        let palavrasSet = new Set();
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
        console.log(`[Sistema] ${bancoDePalavras.length} palavras prontas para busca inteligente.`);
    } catch (err) {
        console.error("Erro ao ler dicts:", err);
    }
};

carregarDicionarios();

app.post('/sugerir', (req, res) => {
    const { texto } = req.body;
    if (!texto) return res.json({ sugestoes: [] });

    const palavrasNoTexto = texto.trim().split(/\s+/);
    const ultima = palavrasNoTexto[palavrasNoTexto.length - 1].toLowerCase();

    // 1. Primeiro, tentamos o autocomplete simples (é mais rápido)
    let matches = bancoDePalavras.filter(p => p.startsWith(ultima));

    // 2. Se tivermos poucas opções ou nenhuma, apelamos para a inteligência (Levenshtein)
    if (matches.length < 5) {
        const fuzzyMatches = bancoDePalavras
            .map(p => ({ palavra: p, distancia: calcularDistancia(ultima, p) }))
            // Filtramos apenas palavras "perto" o suficiente (distância max 2 ou 3)
            .filter(item => item.distancia <= 2) 
            .sort((a, b) => a.distancia - b.distancia)
            .map(item => item.palavra);

        // Unimos as listas removendo duplicatas
        matches = [...new Set([...matches, ...fuzzyMatches])];
    }

    res.json({ 
        original: ultima,
        sugestoes: matches.slice(0, 5) 
    });
});

app.listen(3000, () => console.log('Corretor Inteligente Rodando!'));
