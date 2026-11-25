// Todo o conteúdo editável do site fica aqui (textos, links e imagens).

export type SectionId = 'inicio' | 'sobre' | 'midia' | 'racing' | 'sports' | 'gaming' | 'contato';

export const navigation: Array<{ label: string; target: SectionId }> = [
  { label: 'Início', target: 'inicio' },
  { label: 'Sobre a Zis', target: 'sobre' },
  { label: 'Racing', target: 'racing' },
  { label: 'Sports', target: 'sports' },
  { label: 'Gaming', target: 'gaming' },
  { label: 'Contato', target: 'contato' },
];

/** Seção "Mídia" faz parte de "Sobre a Zis" no menu, como no layout. */
export const navAlias: Partial<Record<SectionId, SectionId>> = { midia: 'sobre' };

const a = (file: string) => `/assets/${file}`;

export const heroSlides = [
  { src: a('hero-1.webp'), alt: 'Carro da ZisTeam contornando a zebra de uma curva, visto de cima' },
  // Adicione mais imagens aqui para ativar as setas do carrossel. Use artes 1920×1080 com a logo
  // aplicada no mesmo lugar (x 154, y 77, 234×95), como na original: no celular a logo do cabeçalho
  // só aparece ao rolar a página.
];

export const social = {
  handle: '@zisteambr',
  // Endereços derivados do @zisteambr indicado no layout — confirmar com a equipe.
  links: [
    { label: 'Instagram', href: 'https://www.instagram.com/zisteambr/', icon: a('icon-instagram.webp'), w: 47, h: 47 },
    { label: 'YouTube', href: 'https://www.youtube.com/@zisteambr', icon: a('icon-youtube.webp'), w: 66, h: 47 },
    { label: 'TikTok', href: 'https://www.tiktok.com/@zisteambr', icon: a('icon-tiktok.webp'), w: 40, h: 47 },
    { label: 'Threads', href: 'https://www.threads.net/@zisteambr', icon: a('icon-threads.webp'), w: 40, h: 47 },
  ],
};

export const media = {
  instagramPost: {
    image: a('post-instagram.webp'),
    alt: 'Post da ZisTeam: Paul Ricard Race Weekend, carro 721 na pista',
    // Link do post mais recente (troque quando publicar um novo).
    href: 'https://www.instagram.com/zisteambr/',
  },
  /** ID do vídeo do YouTube (o trecho depois de "v=" na URL). Vazio = mostra o espaço reservado. */
  youtubeVideoId: '',
};

export const about = {
  /** Cada linha do título; trechos com `yellow: true` ficam amarelos. */
  headline: [
    [{ text: 'UMA' }],
    [{ text: 'EQUIPE' }],
    [{ text: 'PRA ' }, { text: 'TODO', yellow: true }],
    [{ text: 'MUNDO.', yellow: true }],
  ] as Array<Array<{ text: string; yellow?: boolean }>>,
  subtitle: 'ZISTEAM, MAS PODE CHAMAR DE ZIS.',
  text: 'A ZisTeam foi criada em novembro de 2025 em Minas Gerais. Somos uma equipe multiesportiva com atuação no automobilismo virtual, nos esportes reais e nos games. Competimos e buscamos bons resultados, mas sem esquecer que tudo isso também é uma forma de se divertir e fazer o que a gente gosta.',
  supporters: [
    { name: 'Orion Criativa', src: a('apoio-orion.webp'), w: 133, h: 39 },
    { name: 'Gráfica Líder', src: a('apoio-grafica-lider.webp'), w: 195, h: 31 },
    { name: 'Vader Livery Studio', src: a('apoio-vader.webp'), w: 144, h: 47 },
    { name: 'Zoctech', src: a('apoio-zoctech.webp'), w: 179, h: 37 },
  ],
  brands: [
    { name: 'ZisTeam com raio', src: a('marca-1.webp'), w: 94, h: 73 },
    { name: 'Raio Z', src: a('marca-2.webp'), w: 76, h: 73 },
    { name: 'ZisTeam', src: a('marca-3.webp'), w: 95, h: 39 },
    { name: 'Zis', src: a('marca-4.webp'), w: 92, h: 73 },
  ],
  mascot: [
    { name: 'Zangas de corpo inteiro', src: a('mascote-1.webp'), w: 127, h: 72 },
    { name: 'Rosto do Zangas', src: a('mascote-2.webp'), w: 84, h: 73 },
    { name: 'Olhos do Zangas', src: a('mascote-3.webp'), w: 94, h: 42 },
  ],
};

export const racing = {
  text: 'A ZisTeam Racing é a divisão da Zis dedicada ao automobilismo virtual e real, reunindo diferentes times sob uma mesma equipe, cada uma com sua identidade e área de atuação.',
  image: { src: a('racing-carro.webp'), alt: 'Carro 215 da ZisTeam, preto e amarelo, em vista lateral', w: 694, h: 234 },
  teams: [
    { name: 'ZisTeam Racing', badge: a('badge-racing.webp'), text: 'A equipe principal da ZisTeam Racing reúne pilotos com maior dedicação e compromisso competitivo, representando a organização em campeonatos e buscando evolução constante e resultados expressivos.' },
    { name: 'ZisTeam Club', badge: a('badge-club.webp'), text: 'A ZisTeam Club reúne pilotos da comunidade ZisTeam que compartilham a paixão pelo automobilismo e desejam fazer parte da organização, conciliando as competições com suas disponibilidades.' },
    { name: 'ZisTeam Next', badge: a('badge-next.webp'), text: 'A ZisTeam Next é dedicada à formação e ao desenvolvimento de pilotos, promovendo o aprimoramento técnico e a experiência competitiva, além de incentivar novos talentos no automobilismo.' },
  ],
};

export const sports = {
  text: 'A ZisTeam Sports é a divisão da Zis dedicada aos esportes reais, reunindo equipes, atletas e projetos de diferentes modalidades esportivas. Seu objetivo é ampliar a presença da equipe no cenário esportivo, promovendo a competitividade, o desenvolvimento dos atletas e a conexão entre pessoas que compartilham a paixão pelo esporte.',
  image: { src: a('sports-atleta.webp'), alt: 'Atleta da ZisTeam com camisa amarela sacando com raquete de beach tennis', w: 620, h: 855 },
  modalities: [
    { name: 'Musculação', src: a('sport-musculacao.webp'), w: 82, h: 94 },
    { name: 'Futebol', src: a('sport-futebol.webp'), w: 88, h: 86 },
    { name: 'Boxe', src: a('sport-boxe.webp'), w: 62, h: 90 },
    { name: 'Beach tennis e padel', src: a('sport-padel.webp'), w: 90, h: 90 },
  ],
};

export const gaming = {
  text: 'A ZisTeam Gaming é a divisão da Zis dedicada ao universo dos games, reunindo projetos e comunidades em diferentes jogos e modalidades competitivas. Seu propósito é fortalecer a presença da equipe no cenário gamer, incentivando a participação em competições, o desenvolvimento de jogadores e a criação de conexões entre pessoas que compartilham o interesse pelos jogos eletrônicos.',
  image: { src: a('gaming-personagens.webp'), alt: 'Duas personagens de jogo de tiro em pose de combate', w: 610, h: 697 },
  games: [
    { name: 'Valorant', src: a('game-valorant.webp'), w: 122, h: 80 },
    { name: 'Counter-Strike 2', src: a('game-cs2.webp'), w: 222, h: 44 },
    { name: 'Overwatch', src: a('game-overwatch.webp'), w: 142, h: 78 },
  ],
};

export const contact = {
  text: 'Estamos abertos a novas oportunidades, parcerias e projetos. Utilize nossos canais de comunicação para falar com nossa equipe e saber mais sobre nossas iniciativas.',
  phone: { label: '+55 32 9 8474-1460', href: 'https://wa.me/5532984741460' },
  email: { label: 'contato@zisteam.com', href: 'mailto:contato@zisteam.com' },
  mascot: { src: a('contato-mascote.webp'), alt: 'Zangas, o mascote, sobre o texto "Tropa do Zangas!"' /* texto confirmado no PDF */, w: 706, h: 430 },
  hashtag: { src: a('vamozis.webp'), alt: '#VAMOZIS', w: 167, h: 63 },
  credits: [
    { label: 'Desenvolvimento', name: 'Zoctech', src: a('credito-zoctech.webp'), w: 341, h: 70 },
    { label: 'Identidade visual', name: 'Orion Criativa', src: a('credito-orion.webp'), w: 251, h: 70 },
  ],
};
