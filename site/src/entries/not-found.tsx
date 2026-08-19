import { isLocale, setLocale } from '../i18n';
import { mountPage } from '../main';
import { NotFoundPage } from '../pages/not-found';

const lang = document.documentElement.lang;
setLocale(isLocale(lang) ? lang : 'en');
mountPage(<NotFoundPage />);
