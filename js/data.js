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
        "Rebaixamento do nível de consciência (Pediatria)",
        "Parada cardiorrespiratória",
        "IRpA (Insuficiência Respiratória Aguda)",
        "Crise asmática",
        "Crise convulsiva (Pediatria)",
        "Desidratação aguda",
        "Febre (Pediatria)",
        "Diarreia",
        "Dor abdominal (Pediatria)"
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
    "Parada cardiorrespiratória": { // For Pediatrics
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
    },
    // CATEGORIA CLÍNICOS
    "Rebaixamento do nível de consciência": {
        "vermelha": ["Glasgow < 9", "Não responde a estímulos dolorosos", "Respiração ruidosa ou ausente", "Cianose"],
        "amarela": ["Glasgow 9-13", "Confusão mental aguda", "Sonolência mas desperta ao chamado", "História de diabetes ou uso de insulina"],
        "verde": ["Glasgow 14-15", "Sonolência habitual", "Sem alterações vitais"],
        "orientacoes": ["Lateralizar a cabeça se houver vômito", "Não oferecer água ou alimentos", "Monitorar respiração", "Manter vias aéreas livres"]
    },
    "Hemiparesia": {
        "vermelha": ["Início súbito < 4.5h (Janela Trombólise)", "Rebaixamento de consciência associado", "Dificuldade respiratória"],
        "amarela": ["Início > 4.5h", "Paciente estável hemodinamicamente", "Sem rebaixamento de consciência"],
        "verde": ["Sequela antiga de AVC", "Sem piora do quadro habitual"],
        "orientacoes": ["Manter paciente em repouso absoluto", "Cabeceira elevada a 30 graus", "Não dar medicação para pressão sem orientação médica", "Anotar hora exata do início dos sintomas"]
    },
    "Afasia": {
        "vermelha": ["Início súbito < 4.5h", "Associada a desvio de rima ou fraqueza muscular", "Incapacidade total de comunicação aguda"],
        "amarela": ["Início > 4.5h", "Dificuldade parcial de fala", "Compreensão preservada"],
        "verde": ["Quadro crônico ou sequela", "Dificuldade leve sem outros sintomas"],
        "orientacoes": ["Tranquilizar o paciente", "Não forçar a fala", "Observar simetria facial"]
    },
    "Síncope": {
        "vermelha": ["Não recuperou consciência", "Dor torácica associada", "Palpitações prévias", "Histórico cardíaco grave"],
        "amarela": ["Recuperou consciência mas está confuso", "Trauma na queda", "Idoso > 65 anos", "Sinais de desidratação"],
        "verde": ["Recuperação total rápida", "Causa vasovagal clara (emoção/calor)", "Paciente jovem sem comorbidades"],
        "orientacoes": ["Manter deitado com pernas elevadas", "Afrouxar roupas", "Monitorar pulso", "Não levantar bruscamente"]
    },
    "Crise convulsiva": {
        "vermelha": ["Crise ativa no momento", "Status epilepticus (> 5 min)", "Crises recorrentes sem recuperação de consciência", "Trauma craniano associado"],
        "amarela": ["Pós-ictal (confuso/sonolento)", "Primeira crise da vida", "Recuperou consciência mas relata cefaleia intensa"],
        "verde": ["Paciente epiléptico diagnosticado", "Recuperação total da consciência", "Uso irregular da medicação habitual"],
        "orientacoes": ["Proteger a cabeça", "Não segurar os membros", "Não colocar nada na boca", "Lateralizar após a crise cessar"]
    },
    "Dispneia": {
        "vermelha": ["Saturação < 90%", "Cianose", "Uso de musculatura acessória", "Incapacidade de falar frases completas", "Estridor"],
        "amarela": ["Saturação 90-94%", "Dispneia aos esforços", "Histórico de DPOC/Asma descompensado"],
        "verde": ["Saturação > 94%", "Sem esforço respiratório visível", "Queixa crônica sem agudização"],
        "orientacoes": ["Manter paciente sentado", "Facilitar ventilação do ambiente", "Afrouxar roupas apertadas", "Uso de bombinha se prescrito"]
    },
    "Febre": {
        "vermelha": ["Associada a petéquias (manchas roxas)", "Rigidez de nuca", "Rebaixamento de consciência", "Sinais de choque"],
        "amarela": ["Temp > 39ºC sem melhora com antitérmico", "Dor lombar associada", "Idosos ou imunossuprimidos"],
        "verde": ["Bom estado geral", "Sintomas gripais leves", "Temp < 38ºC"],
        "orientacoes": ["Hidratação oral", "Compressas mornas (não geladas)", "Uso de antitérmico habitual se indicado", "Observar surgimento de manchas"]
    },
    "Hipoatividade": {
        "vermelha": ["Não responde a estímulos", "Sinais de hipoglicemia severa", "Pele fria e pegajosa"],
        "amarela": ["Diminuição da ingesta alimentar em idosos", "Mudança de comportamento súbita", "Sinais de desidratação"],
        "verde": ["Queixa crônica em paciente acamado", "Sem alteração de sinais vitais"],
        "orientacoes": ["Verificar se tomou medicações", "Ofertar líquidos se consciente", "Verificar glicemia se possível"]
    },
    "Dor abdominal": {
        "vermelha": ["Abdome em tábua (rígido)", "Sinais de choque (hipotensão/taquicardia)", "Vômitos com sangue", "Dor súbita e excruciante"],
        "amarela": ["Dor moderada/intensa (EVA > 6)", "Vômitos persistentes", "Localizada em fossa ilíaca direita"],
        "verde": ["Dor leve", "Diarréia sem sangue", "Cólicas menstruais habituais"],
        "orientacoes": ["Jejum absoluto (nada de água ou comida)", "Não usar analgésicos fortes antes da avaliação", "Repouso em posição confortável"]
    },

    // CATEGORIA CAUSAS EXTERNAS
    "Capotamento": {
        "vermelha": ["Ejeção do veículo", "Vítima presa nas ferragens", "Morte de outro ocupante no veículo", "Inconsciência"],
        "amarela": ["Vítima deambulando na cena", "Dor cervical ou dorsal", "Mecanismo de alta energia mesmo sem lesão aparente"],
        "verde": ["Sem queixas álgicas", "Exame físico normal", "Baixa energia"],
        "orientacoes": ["Não mover a vítima", "Sinalizar o local", "Desligar a chave do veículo se seguro", "Afastar curiosos"]
    },
    "Envenenamento": {
        "vermelha": ["Substância desconhecida", "Rebaixamento de consciência", "Dificuldade respiratória", "Tentativa de autoextermínio"],
        "amarela": ["Paciente consciente e estável", "Ingestão recente (< 1h)", "Sintomas gastrointestinais"],
        "verde": ["Contato dermal leve lavado", "Substância não tóxica confirmada"],
        "orientacoes": ["Identificar o frasco/substância", "Não provocar vômito (salvo orientação específica)", "Afastar do agente tóxico"]
    },
    "PAF/FAB": {
        "vermelha": ["Ferimento em Cabeça, Pescoço, Tórax ou Abdome", "Hemorragia exsanguinante", "Sinais de choque", "Amputação"],
        "amarela": ["Ferimento em extremidades sem sangramento ativo grave", "Paciente estável", "Fratura exposta sem sangramento massivo"],
        "verde": ["Ferimento superficial/tangencial", "Escoriações"],
        "orientacoes": ["Compressão direta no local do sangramento", "Não remover objetos encravados", "Manter a vítima aquecida"]
    },
    "Colisão": {
        "vermelha": ["Motociclista sem capacete", "Atropelamento", "Alta velocidade", "Inconsciência"],
        "amarela": ["Deformidade de membro", "Dor torácica", "Escoriações extensas"],
        "verde": ["Danos apenas materiais", "Sem queixas"],
        "orientacoes": ["Não retirar o capacete", "Não mover a vítima", "Sinalizar a via"]
    },
    "Queda de altura": {
        "vermelha": ["Altura > 3m", "Queda de cabeça", "Inconsciência", "Queda em poço/fosso"],
        "amarela": ["Altura < 3m com dor importante", "Suspeita de fratura de membros", "Idoso ou criança"],
        "verde": ["Queda de baixa altura sem dor", "Levantou-se sozinho"],
        "orientacoes": ["Imobilização manual da cabeça se possível", "Não tentar levantar a vítima", "Manter em decúbito dorsal"]
    },
    "Agressão": {
        "vermelha": ["Trauma cranioencefálico grave", "Sangramento incontrolável", "Risco na cena"],
        "amarela": ["Ferimentos contusos múltiplos", "Edema importante", "Suspeita de fratura"],
        "verde": ["Agressão verbal", "Lesões superficiais"],
        "orientacoes": ["Garantir segurança da cena antes de aproximar", "Comprimir sangramentos", "Aguardar polícia se necessário"]
    },
    "Corte": {
        "vermelha": ["Sangramento em jato (arterial)", "Amputação total ou parcial", "Localização em pescoço ou face extensa"],
        "amarela": ["Sangramento venoso contínuo", "Necessidade de sutura", "Lesão de tendão/nervo suspeita"],
        "verde": ["Corte superficial", "Sangramento controlado"],
        "orientacoes": ["Pano limpo comprimindo o local", "Elevar o membro afetado", "Não fazer torniquete (salvo treinamento específico)"]
    },
    "Queda de própria altura": {
        "vermelha": ["Trauma de crânio com anticoagulante", "Perda de consciência", "Fratura de fêmur (perna encurtada/rodada)"],
        "amarela": ["Dor forte em quadril", "Impossibilidade de deambular", "Idoso > 80 anos"],
        "verde": ["Escoriações leves", "Deambulando sem dor"],
        "orientacoes": ["Não forçar a levantar", "Acomodar no chão se dor intensa", "Verificar uso de anticoagulantes"]
    },
    "Queimadura": {
        "vermelha": ["Face, pescoço ou vias aéreas (fogo em ambiente fechado)", "> 20% do corpo", "Queimadura elétrica", "Genitália"],
        "amarela": ["2º grau com bolhas extensas", "Dor intensa", "Mãos ou pés envolvidos"],
        "verde": ["1º grau (vermelhidão tipo sol)", "Pequena extensão"],
        "orientacoes": ["Resfriar com água corrente temperatura ambiente", "Não usar gelo", "Não passar pomadas ou pasta de dente", "Remover anéis e pulseiras", "Cobrir com pano limpo úmido"]
    },

    // CATEGORIA PSIQUIÁTRICOS
    "Ingesta de medicações": {
        "vermelha": ["Rebaixamento de consciência", "Quantidade desconhecida", "Intenção suicida", "Dificuldade respiratória"],
        "amarela": ["Paciente sonolento mas desperta", "Sintomas leves (náusea)", "Medicação de baixo risco"],
        "verde": ["Ingesta acidental de dose terapêutica", "Assintomático"],
        "orientacoes": ["Reunir as embalagens dos remédios", "Não provocar vômito", "Manter vigilância constante"]
    },
    "Auto-mutilação": {
        "vermelha": ["Sangramento arterial", "Corte profundo em pescoço/pulso", "Intenção suicida persistente"],
        "amarela": ["Ferimentos superficiais múltiplos", "Paciente calmo no momento"],
        "verde": ["Cicatrizes antigas", "Sem lesão ativa"],
        "orientacoes": ["Compressão de ferimentos", "Retirar objetos cortantes do alcance", "Não deixar paciente sozinho"]
    },
    "Surto psicótico": {
        "vermelha": ["Posse de arma", "Comportamento violento iminente", "Risco de vida para si ou terceiros"],
        "amarela": ["Agitação psicomotora sem arma", "Discurso desconexo", "Histórico de psiquiatria"],
        "verde": ["Ansiedade leve", "Queixas crônicas"],
        "orientacoes": ["Afastar objetos perigosos", "Falar em tom calmo e baixo", "Não confrontar os delírios", "Contenção apenas se estritamente necessário e seguro"]
    },
    "Hétero-agressividade": {
        "vermelha": ["Agressão física ativa", "Uso de armas", "Vítimas no local"],
        "amarela": ["Ameaças verbais", "Postura hostil", "Agitação"],
        "verde": ["Irritabilidade", "Sem risco iminente"],
        "orientacoes": ["Priorizar segurança da equipe e familiares", "Acionar Polícia Militar se necessário", "Isolar o paciente se possível"]
    },
    "Mania": {
        "vermelha": ["Comportamento de risco extremo (ex: andar em telhados, trânsito)", "Exaustão física grave"],
        "amarela": ["Logorreia (fala compulsiva)", "Insônia prolongada", "Gastos excessivos"],
        "verde": ["Euforia leve", "Paciente em tratamento"],
        "orientacoes": ["Ambiente com poucos estímulos", "Evitar discussões", "Monitorar saída de casa"]
    },
    "Alucinação": {
        "vermelha": ["Alucinações de comando (vozes mandando matar/morrer)", "Terror intenso"],
        "amarela": ["Visual ou auditiva sem comando perigoso", "Paciente angustiado"],
        "verde": ["Crônica e habituada", "Reconhece como irreal"],
        "orientacoes": ["Validar o sentimento, não a alucinação", "Manter ambiente iluminado", "Vigilância"]
    },
    "Delírios": {
        "vermelha": ["Delírio persecutório com reação violenta", "Fuga"],
        "amarela": ["Crenças falsas irredutíveis", "Desconfiança excessiva"],
        "verde": ["Delírio místico sem alteração comportamental"],
        "orientacoes": ["Não argumentar contra o delírio", "Focar na segurança e conforto"]
    },
    "Humor deprimido": {
        "vermelha": ["Planejamento suicida estruturado", "Tentativa recente", "Desesperança extrema"],
        "amarela": ["Ideação suicida sem plano", "Isolamento total", "Recusa alimentar"],
        "verde": ["Tristeza reativa", "Luto recente sem complicações"],
        "orientacoes": ["Retirar meios letais do ambiente", "Escuta acolhedora", "Não julgar ou minimizar"]
    },

    // CATEGORIA OBSTÉTRICOS
    "Parto consumado": {
        "vermelha": ["Bebê não chora/respira", "Hemorragia materna intensa", "Bebê prematuro extremo"],
        "amarela": ["Mãe e bebê estáveis", "Placenta não saiu"],
        "verde": ["Parto domiciliar assistido sem intercorrências"],
        "orientacoes": ["Aquecer o bebê pele a pele", "Não puxar o cordão", "Monitorar sangramento materno", "Limpar vias aéreas do bebê"]
    },
    "Eclâmpsia": {
        "vermelha": ["Convulsão na gestante", "PA > 160/110 com cefaleia/visão turva", "Rebaixamento de consciência"],
        "amarela": ["PA elevada sem sintomas neurológicos", "Edema súbito de face/mãos"],
        "verde": ["Hipertensão crônica controlada"],
        "orientacoes": ["Decúbito lateral esquerdo", "Ambiente escuro e silencioso", "Proteger contra traumas"]
    },
    "Prolapso de cordão umbilical": {
        "vermelha": ["Cordão visível na vulva", "Cordão pulsando ou não", "Emergência absoluta"],
        "amarela": ["N/A (Sempre vermelho)"],
        "verde": ["N/A"],
        "orientacoes": ["Posição genupeitoral (joelhos no peito)", "NÃO empurrar o cordão para dentro", "Elevar quadril da gestante"]
    },
    "Trabalho de parto": {
        "vermelha": ["Sensação de puxo (vontade de fazer cocô)", "Parte do bebê visível", "Contrações a cada 2 min"],
        "amarela": ["Contrações regulares a cada 5 min", "Ruptura de bolsa (líquido claro)"],
        "verde": ["Contrações irregulares", "Perda do tampão mucoso"],
        "orientacoes": ["Preparar local limpo", "Deitar do lado esquerdo", "Respiração lenta e profunda durante contração"]
    },
    "Dor pélvica": {
        "vermelha": ["Dor intensa tipo facada", "Sinais de choque", "Suspeita de gravidez ectópica rota"],
        "amarela": ["Dor moderada contínua", "Sangramento associado"],
        "verde": ["Cólicas leves", "Dor lombar"],
        "orientacoes": ["Repouso absoluto", "Jejum", "Observar sangramento"]
    },
    "Sangramento vaginal": {
        "vermelha": ["Hemorragia intensa (absorventes encharcados rápidos)", "Sinais de choque", "Gestante 3º trimestre"],
        "amarela": ["Sangramento moderado", "Cólicas fortes"],
        "verde": ["Spotting (manchas leves)", "Pós-relação sexual leve"],
        "orientacoes": ["Jejum", "Guardar absorventes para avaliação", "Repouso total"]
    },
    "Disúria": {
        "vermelha": ["Febre alta > 38.5", "Dor lombar intensa (Pielonefrite)", "Vômitos"],
        "amarela": ["Dor ao urinar intensa", "Sangue na urina"],
        "verde": ["Ardor leve", "Polaciúria"],
        "orientacoes": ["Hidratação oral", "Não segurar urina", "Medir temperatura"]
    },
    "Hiperêmese gravídica": {
        "vermelha": ["Sinais de desidratação grave", "Rebaixamento de consciência", "Não urina há > 12h"],
        "amarela": ["Vômitos incoercíveis > 3x dia", "Perda de peso", "Tontura"],
        "verde": ["Náuseas matinais", "Vômitos esporádicos"],
        "orientacoes": ["Jejum temporário (1h) depois líquidos fracionados", "Evitar odores fortes", "Repouso"]
    },
    "Abortamento": {
        "vermelha": ["Sangramento profuso", "Restos ovulares visíveis", "Choque hipovolêmico", "Febre (Aborto infectado)"],
        "amarela": ["Sangramento moderado", "Dor tipo cólica forte"],
        "verde": ["Sangramento leve", "Diagnóstico anterior conhecido"],
        "orientacoes": ["Jejum", "Guardar material expelido se possível", "Não introduzir nada na vagina"]
    },

    // CATEGORIA PEDIÁTRICOS
    "Rebaixamento do nível de consciência (Pediatria)": {
        "vermelha": ["Criança hipotônica (molinha)", "Não chora/não interage", "Pupilas desiguais", "História de trauma"],
        "amarela": ["Sonolência excessiva mas desperta", "Irritabilidade alternada com letargia"],
        "verde": ["Criança ativa e reativa"],
        "orientacoes": ["Não chacoalhar a criança", "Verificar glicemia se possível", "Manter vias aéreas pérvias"]
    },
    "IRpA (Insuficiência Respiratória Aguda)": {
        "vermelha": ["Batimento de asa de nariz", "Tiragem subcostal grave", "Cianose", "Gemência", "Estridor em repouso"],
        "amarela": ["Taquipneia", "Tosse rouca", "Cansaço às mamadas"],
        "verde": ["Tosse sem cansaço", "Coriza", "Bom estado geral"],
        "orientacoes": ["Manter criança sentada ou colo (posição de conforto)", "Limpar nariz se obstruído", "Não forçar alimentação"]
    },
    "Crise asmática": {
        "vermelha": ["Silêncio auscultatório", "Cianose", "Exaustão respiratória", "Rebaixamento de consciência"],
        "amarela": ["Sibilância audível", "Fala entrecortada", "Dificuldade para dormir"],
        "verde": ["Tosse seca isolada", "Sibilos leves ao esforço"],
        "orientacoes": ["Uso de broncodilatador (bombinha) com espaçador", "Acalmar a criança (choro piora)", "Ambiente ventilado"]
    },
    "Crise convulsiva (Pediatria)": {
        "vermelha": ["Crise ativa > 5 min", "Cianose persistente", "Trauma de crânio", "Febre alta associada (risco meningite)"],
        "amarela": ["Pós-ictal (dormindo)", "Crise febril simples < 5 min (já cessou)"],
        "verde": ["Epiléptico conhecido recuperado"],
        "orientacoes": ["Não colocar mão na boca", "Lateralizar a criança", "Proteger de traumas", "Marcar tempo da crise"]
    },
    "Desidratação aguda": {
        "vermelha": ["Olhos fundos", "Fontanela (moleira) afundada", "Pele não volta ao puxar", "Letargia/Coma", "Anúria (sem xixi)"],
        "amarela": ["Boca seca", "Choro sem lágrimas", "Irritabilidade", "Sede intensa"],
        "verde": ["Urina clara", "Aceitando líquidos", "Ativa"],
        "orientacoes": ["Soro de reidratação oral (colheradas)", "Continuar amamentação", "Observar fraldas"]
    },
    "Febre (Pediatria)": {
        "vermelha": ["Petéquias (manchas que não somem)", "Rigidez de nuca", "Convulsão", "Bebê < 3 meses"],
        "amarela": ["Febre > 39ºC persistente", "Sem foco aparente > 24h", "Criança prostrada quando baixa a febre"],
        "verde": ["Febre baixa", "Criança brinca quando medicada", "Foco gripal claro"],
        "orientacoes": ["Não agasalhar excessivamente", "Banho morno (não frio)", "Antitérmico dose peso", "Hidratação rigorosa"]
    },
    "Diarreia": {
        "vermelha": ["Sangue nas fezes", "Vômitos incoercíveis associados", "Sinais de choque/desidratação grave"],
        "amarela": ["> 5 episódios/dia", "Fezes líquidas abundantes", "Recusa alimentar"],
        "verde": ["Fezes pastosas", "Sem vômitos", "Hidratada"],
        "orientacoes": ["Soro de reidratação a cada episódio", "Não suspender leite materno", "Evitar sucos/refrigerantes"]
    },
    "Dor abdominal (Pediatria)": {
        "vermelha": ["Dor em fossa ilíaca direita (apendicite)", "Fezes em geleia de framboesa (invaginação)", "Distensão abdominal grave", "Vômitos biliosos (verde)"],
        "amarela": ["Dor contínua que impede de brincar", "Choro inconsolável", "Dor ao toque"],
        "verde": ["Dor periumbilical leve", "Cólicas de gases"],
        "orientacoes": ["Jejum", "Não dar analgésico sem orientação", "Observar aspecto do vômito/fezes"]
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
