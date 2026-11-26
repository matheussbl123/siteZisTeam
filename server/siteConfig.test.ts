import { describe, expect, it } from 'vitest';
import { beholdUrl, instagramShortcode, latestInstagramPost, latestYoutubeVideo, normalizeConfig, resolvePublicConfig, youtubeChannelUrl, youtubeVideoId } from './siteConfig';

const fakeFetch = (routes: Record<string, string>) => (async (url: string) => {
  const key = Object.keys(routes).find((k) => String(url).startsWith(k));
  return key ? new Response(routes[key]) : new Response('nada', { status: 404 });
}) as unknown as typeof fetch;

describe('links', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['qualquer coisa', null],
  ])('vídeo %s', (input, id) => expect(youtubeVideoId(input)).toBe(id));
  it('canal', () => {
    expect(youtubeChannelUrl('@zisteambr')).toBe('https://www.youtube.com/@zisteambr');
    expect(youtubeChannelUrl('https://www.youtube.com/@zisteambr/videos')).toBe('https://www.youtube.com/@zisteambr');
    expect(youtubeChannelUrl('https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv')).toBe('https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv');
  });
  it('instagram e behold', () => {
    expect(instagramShortcode('https://www.instagram.com/p/C9xYz12AbcD/?igsh=1')).toBe('C9xYz12AbcD');
    expect(instagramShortcode('https://www.instagram.com/zisteambr/reel/C9xYz12AbcD/')).toBe('C9xYz12AbcD');
    expect(beholdUrl('https://feeds.behold.so/AbC123xyz')).toBe('https://feeds.behold.so/AbC123xyz');
    expect(beholdUrl('https://evil.com/feeds.behold.so/x')).toBeNull();
  });
});

describe('normalizeConfig', () => {
  it('aceita configuração válida', () => {
    const { config, errors } = normalizeConfig({ youtube_modo: 'ultimo', youtube_canal: '@zisteambr', instagram_modo: 'fixo', instagram_post: 'https://www.instagram.com/p/C9xYz12AbcD/' });
    expect(errors).toEqual([]);
    expect(config).toMatchObject({ youtube_canal: 'https://www.youtube.com/@zisteambr', instagram_post: 'https://www.instagram.com/p/C9xYz12AbcD/' });
  });
  it('aponta campos faltando', () => {
    expect(normalizeConfig({ youtube_modo: 'fixo', instagram_modo: 'automatico' }).errors).toHaveLength(2);
  });
});

describe('conteúdo público', () => {
  it('último vídeo do canal via RSS', async () => {
    const f = fakeFetch({
      'https://www.youtube.com/@zisteambr': '<html>"externalId":"UCabcdefghijklmnopqrstuv"</html>',
      'https://www.youtube.com/feeds/videos.xml': '<feed><entry><yt:videoId>AAAAAAAAAAA</yt:videoId></entry><entry><yt:videoId>BBBBBBBBBBB</yt:videoId></entry></feed>',
    });
    expect(await latestYoutubeVideo('https://www.youtube.com/@zisteambr', f)).toBe('AAAAAAAAAAA');
  });
  it('último post do Behold (formato novo e antigo)', async () => {
    const novo = fakeFetch({ 'https://feeds.behold.so/x': JSON.stringify({ posts: [{ permalink: 'https://www.instagram.com/p/A/', mediaType: 'IMAGE', mediaUrl: 'https://cdn/a.jpg', sizes: { large: { mediaUrl: 'https://cdn/a-large.jpg' } } }] }) });
    expect(await latestInstagramPost('https://feeds.behold.so/x', novo)).toMatchObject({ image: 'https://cdn/a-large.jpg', permalink: 'https://www.instagram.com/p/A/' });
    const antigo = fakeFetch({ 'https://feeds.behold.so/y': JSON.stringify([{ permalink: 'https://www.instagram.com/p/B/', mediaType: 'VIDEO', mediaUrl: 'https://cdn/b.mp4', thumbnailUrl: 'https://cdn/b.jpg' }]) });
    expect((await latestInstagramPost('https://feeds.behold.so/y', antigo))?.image).toBe('https://cdn/b.jpg');
  });
  it('modo fixo e reserva quando algo falha', async () => {
    const r = await resolvePublicConfig({ youtube_modo: 'fixo', youtube_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', instagram_modo: 'automatico', instagram_behold: 'https://feeds.behold.so/fora' }, fakeFetch({}));
    expect(r).toEqual({ youtube: { videoId: 'dQw4w9WgXcQ' }, instagram: null });
  });
});
