// Conteúdo do app. A Joice pode editar estes textos sem mexer no resto do código.
window.VI = {
  // Frase do dia: troca a cada dia, em ordem.
  frases: [
    ['Tudo posso naquele que me fortalece.', 'Filipenses 4,13'],
    ['O Senhor é meu pastor, nada me faltará.', 'Salmo 23,1'],
    ['Vinde a mim, todos os que estais cansados, e eu vos aliviarei.', 'Mateus 11,28'],
    ['Não sabeis que o vosso corpo é templo do Espírito Santo?', '1 Coríntios 6,19'],
    ['Faça-se em mim segundo a tua palavra.', 'Lucas 1,38'],
    ['Entrega o teu caminho ao Senhor, confia nele, e ele agirá.', 'Salmo 37,5'],
    ['Buscai primeiro o Reino de Deus, e tudo isso vos será dado por acréscimo.', 'Mateus 6,33'],
    ['A alegria do Senhor é a vossa força.', 'Neemias 8,10'],
    ['Minha graça te basta.', '2 Coríntios 12,9'],
    ['Aquietai-vos e sabei que eu sou Deus.', 'Salmo 46,11'],
    ['Fazei tudo o que ele vos disser.', 'João 2,5'],
    ['Os que esperam no Senhor renovam as suas forças.', 'Isaías 40,31'],
    ['Lança sobre o Senhor os teus cuidados, e ele te sustentará.', 'Salmo 55,23'],
    ['Eu vim para que tenham vida, e a tenham em abundância.', 'João 10,10'],
    ['Tudo tem o seu tempo determinado.', 'Eclesiastes 3,1'],
    ['Sede fortes e corajosos; não temais.', 'Deuteronômio 31,6'],
    ['A minha alma engrandece o Senhor.', 'Lucas 1,46'],
    ['Cada manhã se renovam as suas misericórdias.', 'Lamentações 3,23'],
    ['Pedi e vos será dado; buscai e achareis.', 'Mateus 7,7'],
    ['Eu estou convosco todos os dias, até o fim do mundo.', 'Mateus 28,20'],
    ['Confia no Senhor de todo o teu coração.', 'Provérbios 3,5'],
  ],

  // Mistérios do terço por dia da semana (0 = domingo).
  misterios: ['Gloriosos','Gozosos','Dolorosos','Gloriosos','Luminosos','Dolorosos','Gozosos'],

  // Itens sugeridos no "Monte o seu dia". dias: 0=dom ... 6=sáb.
  sugestoes: [
    {id:'oracao', em:'🙏', nome:'Oração da manhã', area:'Com Deus', dias:[0,1,2,3,4,5,6], on:true},
    {id:'evang', em:'📖', nome:'Leitura do Evangelho', area:'Com Deus', dias:[0,1,2,3,4,5,6], on:true},
    {id:'terco', em:'📿', nome:'Terço', area:'Com Deus', dias:[0,1,2,3,4,5,6], on:false},
    {id:'exame', em:'🕯️', nome:'Exame de consciência à noite', area:'Com Deus', dias:[0,1,2,3,4,5,6], on:false},
    {id:'treino', em:'💪', nome:'Treino', area:'Corpo', dias:[1,3,5], on:true},
    {id:'caminhada', em:'🚶‍♀️', nome:'Caminhada de 20 min', area:'Corpo', dias:[2,4,6], on:false},
    {id:'proteina', em:'🥚', nome:'Proteína no café da manhã', area:'Corpo', dias:[0,1,2,3,4,5,6], on:false},
    {id:'sono', em:'🌙', nome:'Dormir antes das 23h', area:'Corpo', dias:[0,1,2,3,4,5,6], on:true},
    {id:'auto', em:'🛁', nome:'10 min de autocuidado', area:'Comigo', dias:[0,1,2,3,4,5,6], on:false},
    {id:'leitura', em:'📚', nome:'Ler 10 páginas', area:'Comigo', dias:[0,1,2,3,4,5,6], on:false},
    {id:'familia', em:'💞', nome:'Tempo de qualidade em família', area:'Comigo', dias:[0,6], on:false},
  ],

  // "Minha semana com Deus": metas da semana.
  semanaDeus: [
    {id:'missa', nome:'Missa de domingo'},
    {id:'biblia', nome:'Leitura bíblica em 5 dias'},
    {id:'confissao', nome:'Confissão (uma vez no mês)'},
    {id:'jejum', nome:'Jejum ou pequena renúncia na sexta'},
    {id:'caridade', nome:'Uma obra de caridade'},
  ],

  // Treino sugerido por dia da semana (a usuária pode trocar).
  treinos: {
    1:{nome:'Inferiores', ex:[['Agachamento livre','3 × 12'],['Afundo alternado','3 × 10'],['Elevação de quadril','3 × 15'],['Prancha','3 × 30s']]},
    3:{nome:'Superiores e core', ex:[['Flexão (pode ser no joelho)','3 × 10'],['Remada com garrafa ou halter','3 × 12'],['Desenvolvimento de ombros','3 × 12'],['Abdominal bicicleta','3 × 20']]},
    5:{nome:'Corpo todo', ex:[['Agachamento com salto leve','3 × 10'],['Polichinelo','3 × 40s'],['Ponte de glúteo','3 × 15'],['Prancha lateral','2 × 20s cada lado']]},
  },

  limpeza: {
    0:['Descanso: só o essencial'], 1:['Roupa para lavar','Cozinha caprichada'], 2:['Banheiros','Trocar toalhas'],
    3:['Quartos e roupa de cama'], 4:['Sala e tirar o pó'], 5:['Geladeira e lista de compras'], 6:['Faxina leve geral'],
  },

  // Desafios. tipo 'data' começa numa data fixa; 'livre' começa quando a usuária quiser.
  desafios: [
    {id:'natal', cls:'c-natal', nome:'50 dias até o Natal 🎄', sub:'Caminhando juntas até o nascimento de Jesus', tipo:'data', inicio:'2026-11-03', dias:50,
      temas:['Voltar pra mim, sem culpa','Um momento com Deus que cabe na rotina','O terço no meu dia a dia','Uma rotina que funciona','Cuidar do corpo que Deus me deu','Esperar com Maria','Preparando o coração pro Natal']},
    {id:'saude', cls:'c-saude', nome:'21 dias de rotina saudável', sub:'Água, sono, movimento e alimentação, um passo por dia', tipo:'livre', dias:21,
      passos:['Beba 2 litros de água hoje','Caminhe 15 minutos','Coma uma fruta no lanche','Durma 30 min mais cedo','Coloque proteína no café da manhã','Alongue 10 minutos antes de dormir','Descanse e agradeça pela semana',
        'Faça 3 séries de agachamento','Troque o refrigerante por água com limão','Prepare as marmitas da semana','Fique 1 hora sem celular antes de dormir','Suba escadas sempre que puder','Coma um prato colorido no almoço','Rezando, caminhe 20 minutos',
        'Treino de 25 minutos','Coma devagar, sem tela','Beba um copo de água ao acordar','Faça uma pausa ao ar livre','Durma 8 horas','Escreva 3 conquistas destes 20 dias','Celebre! Escolha o hábito que vai ficar']},
    {id:'quaresma', cls:'c-quaresma', nome:'40 dias de Quaresma', sub:'Oração, jejum e caridade, com treino leve todo dia', tipo:'data', inicio:'2027-02-10', dias:46,
      temas:['Cinzas: voltar para Deus','Oração: um tempo fixo com Deus','Jejum: renunciar ao que me prende','Caridade: olhar para o outro','Silêncio: menos telas, mais escuta','Cruz: oferecer o cansaço','Semana Santa: caminhar com Jesus']},
    {id:'maria', cls:'c-maria', nome:'Mês de Maria 🌹', sub:'31 dias com Nossa Senhora', tipo:'data', inicio:'2027-05-01', dias:31,
      temas:['Maria, mulher do sim','Maria, mulher do serviço','Maria, mulher da oração','Maria, mãe de família','Maria aos pés da cruz']},
  ],
};
