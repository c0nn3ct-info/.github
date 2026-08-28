export const ORG_URL = 'https://github.com/c0nn3ct-info';
export const CONTACT_ADDRESS = 'hello@c0nn3ct.info';
export const NOCTIS_SITE = 'https://noctis.c0nn3ct.info';
export const ARIA2T_SITE = 'https://aria2t.c0nn3ct.info';
export const NOCTIS_SRC = 'https://github.com/c0nn3ct-info/noctis';
export const ARIA2T_SRC = 'https://github.com/c0nn3ct-info/aria2t';
export const NOCTIS_STORE =
  'https://chromewebstore.google.com/detail/noctis/nmhobajopepdpihahepaddpdifdcenpn';

/** How each product writes its own name, taken from the products themselves.
 * The lowercase form belongs to the identifiers around it: the ids, the anchor
 * targets, the media paths and the domains. */
export const PRODUCT_NAME: Record<'noctis' | 'aria2t', string> = {
  noctis: 'Noctis',
  aria2t: 'Aria2t',
};

/** A mailto with the subject already filled in, so a reply lands in the right
 * thread without the sender having to name it. */
export function mailto(subject: string): string {
  return `mailto:${CONTACT_ADDRESS}?subject=${encodeURIComponent(subject)}`;
}
