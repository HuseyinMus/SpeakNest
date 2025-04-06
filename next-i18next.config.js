/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en', 'es', 'ar'],
    localeDetection: true,
  },
  defaultNS: 'common',
  localePath: 'public/locales',
}; 