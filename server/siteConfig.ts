import { callAppsScript, json, scriptEnv, type ContactEnv } from './appsScript.js';

/** Configurações editáveis pelo admin (aba "Site" da planilha). */
export type SiteConfig = Partial<Record<'youtube_modo' | 'youtube_canal' | 'youtube_video' | 'instagram_modo' | 'instagram_behold' | 'instagram_post', string>>;

export type PublicConfig = {
  youtube: { videoId: string } | null;
  instagram: { kind: 'image'; image: string; permalink: string; alt: string } | { kind: 'embed'; shortcode: string; permalink: string } | null;
};

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function youtubeVideoId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Aceita @handle, URL do canal (@handle ou /channel/UC...). Devolve URL canônica. */
export function youtubeChannelUrl(input: string): string | null {
  const s = input.trim();
  const id = s.match(/(UC[\w-]{22})/);
  if (id && /channel\/|^UC/.test(s)) return `https://www.youtube.com/channel/${id[1]}`;
  const handle = s.match(/(?:youtube\.com\/)?@([\w.-]{3,30})/) ?? s.match(/^([\w.-]{3,30})$/);
  return handle ? `https://www.youtube.com/@${handle[1]}` : null;
}

export function instagramShortcode(input: string): string | null {
  const m = input.trim().match(/instagram\.com\/(?:[\w.]+\/)?(?:p|reel|tv)\/([\w-]{5,40})/);
  return m ? m[1] : null;
}

export function beholdUrl(input: string): string | null {
  const m = input.trim().match(/^https:\/\/feeds\.behold\.so\/([\w-]{6,64})\/?$/);
  return m ? `https://feeds.behold.so/${m[1]}` : null;
}

/** Valida e normaliza o que o admin enviou. */
export function normalizeConfig(input: Record<string, unknown>): { config: SiteConfig; errors: string[] } {
  const errors: string[] = [];
  const config: SiteConfig = {};

  const ym = str(input.youtube_modo) || 'padrao';
  if (!['ultimo', 'fixo', 'padrao'].includes(ym)) errors.push('Modo do YouTube inválido.');
  config.youtube_modo = ym;
  config.youtube_canal = '';
  config.youtube_video = '';
  if (ym === 'ultimo') {
    const url = youtubeChannelUrl(str(input.youtube_canal));
    if (!url) errors.push('Informe o canal do YouTube (ex.: https://www.youtube.com/@zisteambr).');
    else config.youtube_canal = url;
  }
  if (ym === 'fixo') {
    const id = youtubeVideoId(str(input.youtube_video));
    if (!id) errors.push('Informe o link de um vídeo do YouTube (ex.: https://youtu.be/...).');
    else config.youtube_video = `https://www.youtube.com/watch?v=${id}`;
  }
  // Guarda o canal mesmo no modo fixo, para facilitar a troca depois.
  if (ym !== 'ultimo' && str(input.youtube_canal)) config.youtube_canal = youtubeChannelUrl(str(input.youtube_canal)) ?? '';

  const im = str(input.instagram_modo) || 'padrao';
  if (!['automatico', 'fixo', 'padrao'].includes(im)) errors.push('Modo do Instagram inválido.');
  config.instagram_modo = im;
  config.instagram_behold = beholdUrl(str(input.instagram_behold)) ?? '';
  config.instagram_post = '';
  if (im === 'automatico' && !config.instagram_behold) errors.push('Informe o endereço do feed do Behold (https://feeds.behold.so/...).');
  if (im === 'fixo') {
    const code = instagramShortcode(str(input.instagram_post));
    if (!code) errors.push('Informe o link de um post do Instagram (ex.: https://www.instagram.com/p/...).');
    else config.instagram_post = `https://www.instagram.com/p/${code}/`;
  }
  return { config, errors };
}

const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; ZisTeamSite/1.0)', 'Accept-Language': 'pt-BR,pt;q=0.9' };

export async function latestYoutubeVideo(channelUrl: string, fetcher: typeof fetch = fetch): Promise<string | null> {
  let channelId = channelUrl.match(/channel\/(UC[\w-]{22})/)?.[1] ?? null;
  if (!channelId) {
    const page = await fetcher(channelUrl, { headers: UA, signal: AbortSignal.timeout(8000) });
    if (!page.ok) return null;
    const html = await page.text();
    channelId = html.match(/"externalId":"(UC[\w-]{22})"/)?.[1]
      ?? html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/)?.[1]
      ?? html.match(/"channelId":"(UC[\w-]{22})"/)?.[1] ?? null;
  }
  if (!channelId) return null;
  const rss = await fetcher(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { headers: UA, signal: AbortSignal.timeout(8000) });
  if (!rss.ok) return null;
  return (await rss.text()).match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1] ?? null;
}

type BeholdPost = { permalink?: string; mediaUrl?: string; thumbnailUrl?: string; mediaType?: string; caption?: string; prunedCaption?: string; sizes?: Record<string, { mediaUrl?: string }> };

export async function latestInstagramPost(feedUrl: string, fetcher: typeof fetch = fetch) {
  const r = await fetcher(feedUrl, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) return null;
  const data = (await r.json()) as BeholdPost[] | { posts?: BeholdPost[] };
  const post = (Array.isArray(data) ? data : data.posts ?? [])[0];
  if (!post?.permalink) return null;
  const image = post.sizes?.large?.mediaUrl ?? post.sizes?.medium?.mediaUrl
    ?? (post.mediaType === 'VIDEO' ? post.thumbnailUrl : post.mediaUrl) ?? post.thumbnailUrl;
  if (!image) return null;
  const alt = (post.prunedCaption ?? post.caption ?? 'Último post da ZisTeam no Instagram').slice(0, 200);
  return { kind: 'image' as const, image, permalink: post.permalink, alt };
}

export async function resolvePublicConfig(config: SiteConfig, fetcher: typeof fetch = fetch): Promise<PublicConfig> {
  const out: PublicConfig = { youtube: null, instagram: null };
  try {
    if (config.youtube_modo === 'fixo' && config.youtube_video) {
      const id = youtubeVideoId(config.youtube_video);
      if (id) out.youtube = { videoId: id };
    } else if (config.youtube_modo === 'ultimo' && config.youtube_canal) {
      const id = await latestYoutubeVideo(config.youtube_canal, fetcher);
      if (id) out.youtube = { videoId: id };
    }
  } catch (e) { console.error('YouTube indisponível:', e); }
  try {
    if (config.instagram_modo === 'fixo' && config.instagram_post) {
      const code = instagramShortcode(config.instagram_post);
      if (code) out.instagram = { kind: 'embed', shortcode: code, permalink: `https://www.instagram.com/p/${code}/` };
    } else if (config.instagram_modo === 'automatico' && config.instagram_behold) {
      out.instagram = await latestInstagramPost(config.instagram_behold, fetcher);
    }
  } catch (e) { console.error('Instagram indisponível:', e); }
  return out;
}

/** GET /api/site-config — público, guardado em cache na CDN por 5 minutos. */
export async function handleSiteConfig(request: Request, env: ContactEnv): Promise<Response> {
  if (request.method !== 'GET') return json({ message: 'Método não permitido.' }, 405);
  const se = scriptEnv(env);
  const cache = { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600' };
  if (!se) return json({ youtube: null, instagram: null }, 200, cache);
  try {
    const r = await callAppsScript<{ config?: SiteConfig }>(se, { action: 'lerConfig' });
    if (!r.ok) throw new Error(r.error);
    return json(await resolvePublicConfig(r.config ?? {}), 200, cache);
  } catch (e) {
    console.error('Configuração do site indisponível:', e);
    return json({ youtube: null, instagram: null }, 200, { 'Cache-Control': 'public, max-age=0, s-maxage=60' });
  }
}
