export const ORG_URL = 'https://github.com/c0nn3ct-info';
export const CONTACT_ADDRESS = 'hello@c0nn3ct.info';
export const NOCTIS_SITE = 'https://noctis.c0nn3ct.info';
export const ARIA2T_SITE = 'https://aria2t.c0nn3ct.info';
export const NOCTIS_SRC = 'https://github.com/c0nn3ct-info/noctis';
export const ARIA2T_SRC = 'https://github.com/c0nn3ct-info/aria2t';
export const NOCTIS_STORE =
  'https://chromewebstore.google.com/detail/noctis/nmhobajopepdpihahepaddpdifdcenpn';

/** A mailto with the subject already filled in, so a reply lands in the right
 * thread without the sender having to name it. */
export function mailto(subject: string): string {
  return `mailto:${CONTACT_ADDRESS}?subject=${encodeURIComponent(subject)}`;
}
