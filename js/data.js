// Simulating the database of protocols
const categories = [
    {
        id: 'clinicos',
        title: 'Atendimentos Clínicos',
        icon: 'stethoscope',
        color: 'blue'
    },
    {
        id: 'externas',
        title: 'Causas Externas',
        icon: 'ambulance', // corrected from truck-medical which might not exist in base lucide set, using generic ambulance or car
        color: 'red'
    },
    {
        id: 'psiquiatricos',
        title: 'Atendimentos Psiquiátricos',
        icon: 'brain',
        color: 'purple'
    },
    {
        id: 'obstetricos',
        title: 'Atendimentos Obstétricos',
        icon: 'baby',
        color: 'pink'
    },
    {
        id: 'pediatricos',
        title: 'Atendimentos Pediátricos',
        icon: 'toy-brick', 
        color: 'orange'
    }
];

// Content for each category (List of complaints)
const categoryContents = {
    clinicos: [
        "Parada cardiorrespiratória (PCR)",
        "Rebaixamento do nível de consciência",
        "Dor precordial",
        "Hemiparesia",
        "Afasia",
        "Síncope",
        "Crise convulsiva",
        "Dispneia",
        "Febre",
        "Hipoatividade",
        "Dor abdominal"
    ],
    externas: [
        "Capotamento",
        "Envenenamento",
        "PAF/FAB",
        "Colisão",
        "Queda de altura",
        "Agressão",
        "Corte",
        "Queda de própria altura",
        "Queimadura"
    ],
    psiquiatricos: [
        "Ingesta de medicações",
        "Auto-mutilação",
        "Surto psicótico",
        "Hétero-agressividade",
        "Mania",
        "Alucinação",
        "Delírios",
        "Humor deprimido"
    ],
    obstetricos: [
        "Parto consumado",
        "Eclâmpsia",
        "Prolapso de cordão umbilical",
        "Trabalho de parto",
        "Dor pélvica",
        "Sangramento vaginal",
        "Disúria",
        "Hiperêmese gravídica",
        "Abortamento"
    ],
    pediatricos: [
        "Rebaixamento do nível de consciência",
        "Parada cardiorrespiratória",
        "IRpA",
        "Crise asmática",
        "Crise convulsiva",
        "Desidratação aguda",
        "Febre",
        "Diarreia",
        "Dor abdominal"
    ]
};

// Protocol details (Red/Yellow/Green + Guidelines)
// Key matches the complaint string (partially or fully). 
// Ideally should use an ID key, but the original used text matching. 
// I will map the texts to keys.
const protocols = {
    "PCR": {
        vermelha: ["Não respira", "Não tem rigidez", "Tempo conhecido"],
        amarela: ["Na verdade respira", "Retomou consciência", "Não foi possível esclarecer a história"],
        verde: ["Raras exceções"],
        orientacoes: [
            "Orientar compressões imediatas (100-120/min)",
            "Chamar por ajuda e pedir um DEA se disponível",
            "Não interromper até a chegada da equipe",
            "Verificar segurança da cena"
        ]
    },
    "Parada cardiorrespiratória (PCR)": { // Mapping full name
        ref: "PCR"
    },
    // Placeholder for other complaints to avoid empty errors
    "Dor precordial": {
        vermelha: ["Dor torácica típica > 20min", "Sudorese fria/Pálido", "Histórico cardíaco prévio", "Irradiação para MSE"],
        amarela: ["Dor atípica", "Sem sinais vegetativos", "Fatores de risco (HAS, DM, Tabagismo)"],
        verde: ["Dor muscular à palpação", "Sem fatores de risco", "Eletrocardiograma normal recente"],
        orientacoes: [
            "Manter paciente em repouso absoluto",
            "Monitorar Sinais Vitais",
            "Se disponível, rodar ECG", 
            "Aguardar USA"
        ]
    }
};

// Helper to get protocol safely
function getProtocol(complaintName) {
    let data = protocols[complaintName];
    if (!data) {
        // Try to find a partial match or default
        // For the demo, we return a generic placeholder if not found
        return {
            vermelha: ["Critério de gravidade 1", "Critério de gravidade 2"],
            amarela: ["Critério de atenção 1", "Sinais vitais estáveis"],
            verde: ["Queixa crônica", "Sem sinais de alarme"],
            orientacoes: ["Avaliar sinais vitais", "Manter observação", "Aguardar regulação médica"]
        };
    }
    if (data.ref) {
        return protocols[data.ref];
    }
    return data;
}