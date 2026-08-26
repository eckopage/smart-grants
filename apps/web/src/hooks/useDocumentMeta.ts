import { useEffect } from 'react';

function setMetaDescription(content: string) {
  let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = 'description';
    document.head.appendChild(tag);
  }
  tag.content = content;
}

/**
 * Sets the document title and meta description for the lifetime of the
 * calling component. This is a client-side-only SEO measure — the SPA
 * architecture chosen for this app means crawlers that don't execute JS
 * (or run it before content mounts) won't see this. Real SEO for a public
 * catalog like /grants would need SSR/prerendering (e.g. migrating to
 * Next.js/Remix, or a prerender step) — out of scope for this pass.
 */
export function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    if (description) {
      setMetaDescription(description);
    }
    return () => {
      document.title = previousTitle;
    };
  }, [title, description]);
}
